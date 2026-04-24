# AarogyaAid AI - Health Insurance Policy Recommender

A production-quality AI-powered health insurance recommender system using RAG (Retrieval Augmented Generation).

## Project Structure
- `backend/`: FastAPI server with LangChain, ChromaDB, and Grok AI.
- `frontend/`: React + Vite application with premium styling.

## Prerequisites
- Python 3.9+ (Tested on 3.10-3.13)
- Node.js (v18+)
- xAI API Key (Grok)

## Getting Started

### 1. Setup Backend
```bash
cd backend
pip install -r requirements.txt
```
Create a `.env` file in the `backend/` directory:
```env
OPENAI_API_KEY=your_openai_key
XAI_API_KEY=your_xai_key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=password123
```

### 2. Setup Frontend
```bash
cd frontend
npm install
```

### 3. Run the Application

**Terminal 1 (Backend):**
```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 5000 --reload
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

## How to Use
1. **Upload Policies**: Access the web app, click **Admin Panel**, and upload policy PDFs.
2. **Get Recommendation**: Complete your profile. The system will retrieve relevant chunks from the PDFs and use Grok AI to generate a detailed recommendation.
3. **Chat**: Use the follow-up chat to ask specific questions about the coverage.

## Tech Stack
- **Backend**: FastAPI, ChromaDB (Local Embeddings), PyPDF.
- **Frontend**: React, Lucide-react, React-Markdown.
- **AI**: xAI Grok (LLM Advisor).
