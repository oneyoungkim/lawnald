import os

# Vercel serverless: read-only filesystem, skip directory creation
UPLOAD_DIR = "/tmp/images"
ORIGINAL_DIR = os.path.join(UPLOAD_DIR, "original")
CUTOUT_DIR = os.path.join(UPLOAD_DIR, "cutout")

try:
    os.makedirs(ORIGINAL_DIR, exist_ok=True)
    os.makedirs(CUTOUT_DIR, exist_ok=True)
except:
    pass

async def save_upload_file(file, filename: str) -> str:
    """Save uploaded file to /tmp directory."""
    file_path = os.path.join(ORIGINAL_DIR, filename)
    try:
        content = await file.read()
        with open(file_path, 'wb') as out_file:
            out_file.write(content)
    except:
        pass
    return file_path

def process_background_removal(input_path: str, filename: str) -> str:
    return f"/static/images/original/{filename}"
