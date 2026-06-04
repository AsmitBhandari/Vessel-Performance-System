"""
Ingestion API — POST /api/ingest-report

Combines parsing + persistence in a single endpoint.
Accepts an Excel file, parses it, and ingests daily reports into PostgreSQL.
"""

import io

from fastapi import APIRouter, Depends, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.parser.excel_parser import parse_excel_report
from app.services.file_service import get_file_extension
from app.services.ingestion_service import ingest_reports

router = APIRouter(prefix="/api", tags=["Ingestion"])

ALLOWED_EXCEL_EXTENSIONS = {"xlsx", "xls"}


@router.post("/ingest-report")
async def ingest_report(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Upload an Excel noon report, parse it, and ingest daily reports into
    the database with UPSERT deduplication.

    Returns ingestion statistics and parser metadata.
    """
    filename = file.filename or ""
    ext = get_file_extension(filename)

    # 1. Validate file type
    if ext not in ALLOWED_EXCEL_EXTENSIONS:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": f"Invalid file type. Allowed: {', '.join(sorted(ALLOWED_EXCEL_EXTENSIONS))}",
            },
        )

    # 2. Read file into memory
    try:
        contents = await file.read()
        if not contents:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "message": "File is empty or could not be read",
                },
            )

        file_stream = io.BytesIO(contents)

        # 3. Parse the Excel workbook
        parsed_data, parser_info = parse_excel_report(file_stream)

        # 4. Ingest into PostgreSQL
        ingestion_stats = ingest_reports(db, parsed_data, source_file_name=filename)

        # 5. Return standardized envelope
        return {
            "success": True,
            "ingestion": ingestion_stats,
            "parserInfo": parser_info,
        }

    except ValueError as e:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": str(e),
            },
        )
    except Exception as e:
        # Rollback on unexpected errors
        db.rollback()
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": f"Ingestion error: {str(e)}",
            },
        )
    finally:
        await file.seek(0)
