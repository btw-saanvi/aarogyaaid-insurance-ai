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
        chunk_size = 1000
        overlap = 200
        chunks = []
        for i in range(0, len(text), chunk_size - overlap):
            chunks.append(text[i:i + chunk_size])

        # Chroma handles embeddings internally when embedding_function is passed to the collection
        self.collection.add(
            ids=[f"{metadata.get('filename')}_{i}" for i in range(len(chunks))],
            metadatas=[metadata] * len(chunks),
            documents=chunks
        )

    def query_documents(self, query: str, k: int = 5, where: dict = None):
        """Retrieve top k relevant chunks using local semantic search."""
        results = self.collection.query(
            query_texts=[query],
            n_results=k,
            where=where
        )
        return results['documents'][0] if results['documents'] else []

    def clear_collection(self):
        """Delete all documents in the collection."""
        self.chroma_client.delete_collection("policies")
        self.collection = self.chroma_client.get_or_create_collection(
            name="policies",
            embedding_function=self.embedding_func
        )
        
    def list_documents(self):
        """List all documents in the collection with their metadata."""
        results = self.collection.get(include=['metadatas', 'documents'])
        # De-duplicate by filename since one PDF creates multiple chunks
        seen_files = {}
        if results['metadatas']:
            for i, meta in enumerate(results['metadatas']):
                filename = meta.get('filename')
                if filename not in seen_files:
                    seen_files[filename] = {
                        "filename": filename,
                        "insurer": meta.get("insurer", "Unknown"),
                        "policy_name": meta.get("policy_name", "Unknown"),
                        "upload_date": meta.get("upload_date", "N/A")
                    }
        return list(seen_files.values())

    def delete_by_filename(self, filename: str):
        """Delete documents matching a specific filename metadata."""
        self.collection.delete(where={"filename": filename})

    def update_metadata_by_filename(self, filename: str, new_metadata: dict):
        """Update metadata for all chunks associated with a filename."""
        # Find all chunks for this file
        results = self.collection.get(where={"filename": filename})
        ids = results['ids']
        if ids:
            # We must preserve the filename in the metadata for future operations
            for i in range(len(ids)):
                # Merging new metadata with the required filename
                meta = {**new_metadata, "filename": filename}
                self.collection.update(
                    ids=[ids[i]],
                    metadatas=[meta]
                )
            return True
        return False

rag_service = RAGService()
