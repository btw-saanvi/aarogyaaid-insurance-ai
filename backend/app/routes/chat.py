from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.models.policy import UserProfile
from app.services.rag_service import rag_service
from app.services.ai_agent import ai_agent

router = APIRouter()

class ChatInput(BaseModel):
    question: str
    user_profile: UserProfile

@router.post("/chat")
async def chat_endpoint(chat_input: ChatInput):
    try:
        # Context retrieval
        relevant_docs = rag_service.query_documents(chat_input.question)
        
        # Generate answer
        answer = await ai_agent.chat_response(
            chat_input.question, 
            chat_input.user_profile, 
            relevant_docs
        )
        return {"answer": answer}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
