from fastapi import APIRouter, HTTPException
from app.models.policy import UserProfile, RecommendationResponse
from app.services.rag_service import rag_service
from app.services.ai_agent import ai_agent

router = APIRouter()

import traceback

@router.post("/recommend", response_model=RecommendationResponse)
async def get_recommendation(profile: UserProfile):
    try:
        # Construct query using all 6 fields for RAG retrieval
        query = f"Health insurance for {profile.age} year old, lifestyle: {profile.lifestyle}, conditions: {', '.join(profile.conditions)}, income: {profile.income}, city: {profile.city}"
        
        # Step 1: Query documents
        relevant_docs = rag_service.query_documents(query)
        
        # Step 2: Generate response via AI Agent
        recommendation = await ai_agent.generate_recommendation(profile, relevant_docs)
        return recommendation
        
    except Exception as e:
        print("--- SERVER ERROR TRACEBACK ---")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
