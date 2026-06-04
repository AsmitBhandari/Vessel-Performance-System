from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse

from app.services.file_service import (
    validate_file_extension,
    validate_file_size,
    read_file_to_memory,
    ALLOWED_EXTENSIONS,
    MAX_FILE_SIZE_MB,
)

router = APIRouter(prefix="/api", tags=["Upload"])


@router.post("/upload-report")
async def upload_report(file: UploadFile = File(...)):
    """
    Upload an Excel or CSV file for processing.

    Validates the file extension and size, reads it into memory
    to confirm readability, then returns a success response.
    No file is persisted to disk or database.
    """
    # 1. Validate file extension
    if not validate_file_extension(file.filename or ""):
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": f"Invalid file type. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
            },
        )

    # 2. Read file into memory
    try:
        contents = await read_file_to_memory(file)
    except ValueError as e:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": str(e),
            },
        )

    # 3. Validate file size
    if not await validate_file_size(contents):
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": f"File too large. Maximum size: {MAX_FILE_SIZE_MB} MB",
            },
        )

    # 4. Return success — file is transient, not persisted
    return {
        "success": True,
        "filename": file.filename,
        "file_size": len(contents),
        "message": "File received successfully",
    }
