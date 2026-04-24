from .upload import router as upload_router
from .recommend import router as recommend_router
from .chat import router as chat_router
from .admin import router as admin_router

__all__ = ["upload", "recommend", "chat", "admin"]
