from fastapi import APIRouter, HTTPException
from app.models.policy import UserProfile, RecommendationResponse
from app.services.rag_service import rag_service
from app.services.ai_agent import ai_agent

router = APIRouter()

import traceback

@router.post("/recommend", response_model=RecommendationResponse)
async def get_recommendation(profile: UserProfile):
    try:
        # Fetch all distinct policies first to ensure multi-policy comparison
        policies = rag_service.list_documents()
        
        all_relevant_docs = []
        
        # Enhanced query logic for better premium/co-pay band selection
        # Fix 2: Embed age and income band in the query
        income_tier = "3L" if "under 3L" in profile.income else profile.income
        age_band = "18-35" if 18 <= profile.age <= 35 else "36-45" if 36 <= profile.age <= 45 else "46-55" if 46 <= profile.age <= 55 else "56-65" if 56 <= profile.age <= 65 else "66+"
        
        query = f"Premium and benefits for {profile.age} year old (age band {age_band}), income {profile.income} (tier {income_tier}), conditions: {', '.join(profile.conditions)}"
        
        if not policies:
            # Fallback if no policies are uploaded
            relevant_docs = rag_service.query_documents(query)
            all_relevant_docs.extend(relevant_docs)
        else:
            # Fix 1: Retrieve chunks for EACH distinct policy
            for p in policies:
                policy_docs = rag_service.query_documents(
                    query, 
                    k=4, 
                    where={"filename": p['filename']}
                )
                all_relevant_docs.extend(policy_docs)
        
        # Step 2: Generate response via AI Agent
        recommendation = await ai_agent.generate_recommendation(profile, all_relevant_docs)
        return recommendation
        
    except Exception as e:
        print("--- SERVER ERROR TRACEBACK ---")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
