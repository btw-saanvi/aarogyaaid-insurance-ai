from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="AarogyaAid AI - Senior Backend",
    description="Production-quality insurance recommendation system using RAG",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
from app.routes.upload import router as upload_router
from app.routes.recommend import router as recommend_router
from app.routes.chat import router as chat_router
from app.routes.admin import router as admin_router

app.include_router(upload_router)
app.include_router(recommend_router)
app.include_router(chat_router)
app.include_router(admin_router)

@app.get("/")
async def root():
    return {
        "app": "AarogyaAid AI",
        "status": "ready",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=5000, reload=True)
