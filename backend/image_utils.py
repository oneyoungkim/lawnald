import os
import aiofiles
import io

UPLOAD_DIR = "static/images"
ORIGINAL_DIR = os.path.join(UPLOAD_DIR, "original")
CUTOUT_DIR = os.path.join(UPLOAD_DIR, "cutout")

# Ensure directories exist
os.makedirs(ORIGINAL_DIR, exist_ok=True)
os.makedirs(CUTOUT_DIR, exist_ok=True)

async def save_upload_file(file, filename: str) -> str:
    """Save uploaded file to original directory and return path."""
    file_path = os.path.join(ORIGINAL_DIR, filename)
    async with aiofiles.open(file_path, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)
    return file_path

def process_background_removal(input_path: str, filename: str) -> str:
    """
    Skipping background removal as per user request.
    Just returns the original image path as if it was processed.
    """
    # Simply copy or just return the original path logic if needed.
    # But since frontend expects a cutout path, let's just use the original URL structure or copy.
    # For now, let's just return None or duplicate the file if we want to simulate it.
    
    return f"/static/images/original/{filename}"
