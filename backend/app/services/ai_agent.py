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

RULES:
1. USE ONLY PROVIDED DOCUMENTS. If info is missing, say "Not available in uploaded documents".
2. DO NOT HALLUCINATE.
3. ALWAYS acknowledge the user's specific health conditions (e.g., Diabetes, Cardiac) with empathy before giving the recommendation.
4. Explain complex insurance terms (like Co-pay, Waiting Period) simply.
5. You MUST return a VALID JSON following the exact schema provided.
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

SCHEMA REQUIREMENT:
Return a JSON object with:
- "comparison_table": List of at least 2 policies with policy_name, insurer, premium, cover_amount, waiting_period, key_benefit, suitability_score.
- "coverage_details": inclusions, exclusions, sub_limits, copay, claim_type.
- "why_this_policy": A 150-250 word explanation referencing at least 3 user fields (e.g., age, income, conditions).

RESPONSE FORMAT:
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
