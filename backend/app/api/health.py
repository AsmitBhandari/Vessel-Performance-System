from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    """Health check endpoint for deployment verification and monitoring."""
    return {"status": "ok"}
