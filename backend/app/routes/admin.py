import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from app.config import config
from app.services.rag_service import rag_service

router = APIRouter(prefix="/admin", tags=["admin"])
security = HTTPBasic()

def authenticate(credentials: HTTPBasicCredentials = Depends(security)):
    correct_username = secrets.compare_digest(credentials.username, config.ADMIN_USERNAME)
    correct_password = secrets.compare_digest(credentials.password, config.ADMIN_PASSWORD)
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

@router.get("/policies")
async def get_policies(username: str = Depends(authenticate)):
    try:
        policies = rag_service.list_documents()
        return policies
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/policy/{filename}")
async def delete_policy(filename: str, username: str = Depends(authenticate)):
    try:
        rag_service.delete_by_filename(filename)
        return {"status": "success", "message": f"Policy {filename} deleted from vector store"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/clear-all")
async def clear_all(username: str = Depends(authenticate)):
    try:
        rag_service.clear_collection()
        return {"status": "success", "message": "All policies cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
