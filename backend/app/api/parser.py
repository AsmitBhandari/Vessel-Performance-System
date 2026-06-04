import io
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse

from app.parser.excel_parser import parse_excel_report
from app.services.file_service import validate_file_extension, get_file_extension

router = APIRouter(prefix="/api", tags=["Parser"])

ALLOWED_EXCEL_EXTENSIONS = {"xlsx", "xls"}

@router.post("/parse-report")
async def parse_report(file: UploadFile = File(...)):
    """
    Parse an Excel noon report spreadsheet dynamically and return a structured JSON response.
    
    Performs validation on file type, discovers operational sheet, resolves row anchors,
    and returns a standardized envelope payload.
    """
    filename = file.filename or ""
    ext = get_file_extension(filename)
    
    # 1. Enforce Excel-only file type validation
    if ext not in ALLOWED_EXCEL_EXTENSIONS:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": f"Invalid file type. Allowed: {', '.join(sorted(ALLOWED_EXCEL_EXTENSIONS))}",
            },
        )
        
    # 2. Read file contents in-memory
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
        
        # 3. Call the dynamic Excel parser
        parsed_data, parser_info = parse_excel_report(file_stream)
        
        # 4. Return the standardized successful response envelope
        return {
            "success": True,
            "data": parsed_data,
            "parserInfo": parser_info
        }
        
    except ValueError as e:
        # Expected parsing and validation failures (e.g. missing sheets or required labels)
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": str(e),
            },
        )
    except Exception as e:
        # Unexpected server-side parsing exceptions
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": f"Unexpected parsing error: {str(e)}",
            },
        )
    finally:
        await file.seek(0)
