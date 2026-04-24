import json
import httpx
from app.config import config
from app.models.policy import UserProfile, RecommendationResponse

class AIAgent:
    def __init__(self):
        self.api_key = config.XAI_API_KEY # Reusing the same key variable for simplicity
        self.base_url = config.AI_BASE_URL
        self.model = config.AI_MODEL

    async def generate_recommendation(self, user_profile: UserProfile, documents: list) -> RecommendationResponse:
        """Generate structured recommendation via Grok AI."""
        
        system_prompt = """
You are an empathetic senior insurance advisor at AarogyaAid.
Your goal is to recommend the best health insurance policy based ONLY on the provided documents.

STRICT ANTI-HALLUCINATION RULES:
1. DATA SOURCE: Every single value in the tables (Premiums, Cover Amounts, Waiting Periods, etc.) MUST be found in the provided context.
2. NO GUESSING: Do not guess premiums or cover amounts based on your training data. If a policy document does not contain a specific premium for the user's age, you MUST say "Refer Insurer Quote" or "Check Table". 
3. COVER LIMITS: Pay close attention to maximum sum insured limits mentioned in the text. Do not offer a cover amount higher than what the document specifies.
4. PEER COMPARISON (FIX 1): Before generating the peer comparison table, you MUST call retrieve_policy_chunks at least TWICE — once for each distinct policy in the knowledge base. You MUST only generate rows for policies present in the context. Never generate a row with "(Estimate)" in any field. If only one policy is found in the context, list only that policy and state "No other matching policies found in knowledge base".
5. MISSING CONDITIONS (FIX 3): If a user's pre-existing condition (e.g., Cancer, Rare Diseases) does not appear in any retrieved policy document, you MUST state: "I could not find specific coverage terms for [condition] in the uploaded policy documents. I recommend contacting the insurer directly." Never infer or fabricate waiting periods for undocumented conditions.
6. AGE-AWARE CO-PAY (FIX 4): When extracting co-pay from retrieved chunks, always filter by the user's age. If the user is 33, apply the standard co-pay row, not the senior/age 66+ row.
7. SUITABILITY SCORE: Determine the score (0-100) based on:
   - 40% Alignment with user's pre-existing conditions.
   - 30% Fit within user's income bracket/premium affordability.
   - 30% Relevance of key benefits to user's lifestyle and city.
8. GLOSSARY: Define jargon (Co-pay, Waiting Period) inline in parentheses.
9. JSON: Return valid JSON only.
10. MISSING INFO: If a field like "Sub-limits" is not mentioned, write "Not mentioned in uploaded document". Do NOT assume standard industry values.
"""

        context = "\n\n".join(documents)
        user_prompt = f"""
User Profile:
- Full Name: {user_profile.full_name}
- Age: {user_profile.age}
- Lifestyle: {user_profile.lifestyle}
- Pre-existing Conditions: {", ".join(user_profile.conditions)}
- Income Bracket: {user_profile.income}
- City: {user_profile.city}

Relevant Policy Context:
{context}

STRICT TASK:
Generate a recommendation using ONLY the context above. 
If you find conflicting information, prioritize the one that seems more specific to the user's profile.
If a specific policy does not support the user's condition or income, mention it in the "why_this_policy" section as a limitation.

REQUIRED OUTPUT SECTIONS:
1. "comparison_table": List of policies found in the context. Columns: policy_name, insurer, premium, cover_amount, waiting_period, key_benefit, suitability_score.
   - List all matching policies from the context.
2. "coverage_details": inclusions, exclusions, sub_limits, copay, claim_type.
3. "why_this_policy": 150-250 words, human-facing, referencing at least 3 profile fields, explaining jargon.

If you cannot find a specific premium, set "premium" to "Refer Insurer Quote".
If you cannot find cover amounts, set "cover_amount" to "Contact Insurer for Options".

Strict JSON only.
"""

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0
                },
                timeout=60.0
            )
            
        if response.status_code != 200:
            raise Exception(f"AI Agent Error: {response.text}")
            
        result = response.json()
        content = result['choices'][0]['message']['content']
        
        # Robustly extract JSON if Grok wraps it in markdown blocks
        clean_json = content
        if "```json" in content:
            clean_json = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            clean_json = content.split("```")[1].split("```")[0].strip()
            
        try:
            parsed_data = json.loads(clean_json)
            # Use model_validate for Pydantic V2 compatibility
            if hasattr(RecommendationResponse, "model_validate"):
                return RecommendationResponse.model_validate(parsed_data)
            return RecommendationResponse.parse_obj(parsed_data)
        except Exception as e:
            print(f"FAILED TO PARSE JSON. RAW CONTENT: {content}")
            print(f"CLEANED JSON: {clean_json}")
            print(f"ERROR: {str(e)}")
            # Fallback to a structured error response that won't crash the frontend
            return RecommendationResponse(
                comparison_table=[],
                coverage_details={
                    "inclusions": "Error parsing AI response",
                    "exclusions": "Error parsing AI response",
                    "sub_limits": "N/A",
                    "copay": "N/A",
                    "claim_type": "N/A"
                },
                why_this_policy=f"The AI generated a response but it couldn't be parsed into the expected format. Raw response start: {content[:100]}..."
            )

    async def chat_response(self, question: str, user_profile: UserProfile, documents: list) -> str:
        """Answer chat questions using context."""
        system_prompt = f"""
You are an empathetic senior insurance advisor at AarogyaAid.
User Profile: {user_profile.json()}

INSTRUCTIONS:
1. Use only document data to answer.
2. Define insurance terms simply.
3. Give examples based on the user's health profile.
4. SCOPE GUARDRAIL: If the user asks for medical advice, diagnosis, or treatment, strictly and politely decline. Redirect them to consult a qualified medical professional. 
5. Always maintain an empathetic, supportive tone.
"""
        context = "\n\n".join(documents)
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Context documents:\n{context}\n\nQuestion: {question}"}
                    ],
                    "temperature": 0
                },
                timeout=30.0
            )
            
        if response.status_code != 200:
            raise Exception(f"Chat Agent Error: {response.text}")
            
        result = response.json()
        return result['choices'][0]['message']['content']

ai_agent = AIAgent()
