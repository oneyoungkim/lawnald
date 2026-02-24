"""
Lawyer Image Upload Utility
- Save to /tmp temporarily, then upload to Supabase Storage
- Return Supabase public URL for permanent access
"""
import os

# Vercel serverless: /tmp is the only writable directory
UPLOAD_DIR = "/tmp/images"
ORIGINAL_DIR = os.path.join(UPLOAD_DIR, "original")
CUTOUT_DIR = os.path.join(UPLOAD_DIR, "cutout")

try:
    os.makedirs(ORIGINAL_DIR, exist_ok=True)
    os.makedirs(CUTOUT_DIR, exist_ok=True)
except Exception:
    pass


async def save_upload_file(file, filename: str) -> str:
    """Save uploaded file to /tmp, then upload to Supabase Storage.
    Returns the Supabase public URL, or a local /tmp path as fallback.
    """
    # 1. Read file bytes
    content = await file.read()
    content_type = getattr(file, "content_type", "image/png") or "image/png"

    # 2. Save locally as temp cache
    file_path = os.path.join(ORIGINAL_DIR, filename)
    try:
        with open(file_path, "wb") as out_file:
            out_file.write(content)
    except Exception:
        pass

    # 3. Upload to Supabase Storage
    try:
        from storage_utils import upload_and_get_url  # type: ignore
        public_url = upload_and_get_url("photos", filename, content, content_type)
        if public_url:
            print(f"✅ 프로필 사진 Supabase 업로드: {public_url}")
            return public_url
    except Exception as e:
        print(f"⚠️ Supabase Storage 업로드 실패: {e}")

    # 4. Fallback: return temp path
    return file_path


def process_background_removal(input_path: str, filename: str) -> str:
    return f"/static/images/original/{filename}"
