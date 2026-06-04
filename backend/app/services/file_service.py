from fastapi import UploadFile

ALLOWED_EXTENSIONS = {"xlsx", "xls", "csv"}
MAX_FILE_SIZE_MB = 25
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024


def get_file_extension(filename: str) -> str:
    """Extract the lowercase file extension without the dot."""
    if "." not in filename:
        return ""
    return filename.rsplit(".", 1)[-1].lower()


def validate_file_extension(filename: str) -> bool:
    """Check if the file extension is in the allowed set."""
    return get_file_extension(filename) in ALLOWED_EXTENSIONS


async def validate_file_size(contents: bytes) -> bool:
    """Check if the file contents are within the size limit."""
    return len(contents) <= MAX_FILE_SIZE_BYTES


async def read_file_to_memory(file: UploadFile) -> bytes:
    """
    Read the uploaded file into memory and return its contents.
    Raises ValueError if the file is empty or unreadable.
    """
    try:
        contents = await file.read()
        if not contents:
            raise ValueError("File is empty or could not be read")
        return contents
    except ValueError:
        raise
    except Exception as e:
        raise ValueError(f"Failed to read file: {str(e)}")
    finally:
        await file.seek(0)
