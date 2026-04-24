from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.parser import parse_pdf
from app.services.rag_service import rag_service

router = APIRouter()

@router.post("/upload-policy")
async def upload_policy(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    try:
        content = await file.read()
        text = parse_pdf(content)
        rag_service.store_document(text, {"filename": file.filename})
        return {"status": "success", "filename": file.filename, "message": "Policy uploaded and indexed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
