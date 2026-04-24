import os
import chromadb
from chromadb.utils import embedding_functions
from app.config import config

class RAGService:
    def __init__(self):
        # Use a local embedding model (free, no API key needed)
        # HuggingFace model: all-MiniLM-L6-v2 is fast and efficient
        self.embedding_func = embedding_functions.DefaultEmbeddingFunction()
        
        # Direct ChromaDB client
        self.chroma_client = chromadb.PersistentClient(path=config.DATABASE_PATH)
        self.collection = self.chroma_client.get_or_create_collection(
            name="policies",
            embedding_function=self.embedding_func
        )

    def store_document(self, text: str, metadata: dict):
        """Chunk text and store in ChromaDB with local embeddings."""
        chunk_size = 500
        overlap = 100
        chunks = []
        for i in range(0, len(text), chunk_size - overlap):
            chunks.append(text[i:i + chunk_size])

        # Chroma handles embeddings internally when embedding_function is passed to the collection
        self.collection.add(
            ids=[f"{metadata.get('filename')}_{i}" for i in range(len(chunks))],
            metadatas=[metadata] * len(chunks),
            documents=chunks
        )

    def query_documents(self, query: str, k: int = 5):
        """Retrieve top k relevant chunks using local semantic search."""
        results = self.collection.query(
            query_texts=[query],
            n_results=k
        )
        return results['documents'][0] if results['documents'] else []

    def clear_collection(self):
        """Delete all documents in the collection."""
        self.chroma_client.delete_collection("policies")
        self.collection = self.chroma_client.get_or_create_collection(
            name="policies",
            embedding_function=self.embedding_func
        )
        
    def delete_by_filename(self, filename: str):
        """Delete documents matching a specific filename metadata."""
        self.collection.delete(where={"filename": filename})

rag_service = RAGService()
