from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from datetime import datetime
from app.services.parser import parse_pdf
from app.services.rag_service import rag_service

router = APIRouter()

@router.post("/upload-policy")
async def upload_policy(
    file: UploadFile = File(...),
    insurer: str = Form("Unknown"),
    policy_name: str = Form("Unknown")
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    try:
        content = await file.read()
        text = parse_pdf(content)
        
        metadata = {
            "filename": file.filename,
            "insurer": insurer,
            "policy_name": policy_name,
            "upload_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        rag_service.store_document(text, metadata)
        return {"status": "success", "filename": file.filename, "metadata": metadata, "message": "Policy uploaded and indexed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
