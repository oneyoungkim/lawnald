"""
증거자료(갑호증) 자동 넘버링 및 PDF 병합
──────────────────────────────────────────
업로드된 이미지/PDF 파일에 순차적으로 "[갑 제N호증]" 스탬프를 찍고
단일 PDF로 병합하여 다운로드합니다.

사용 라이브러리: PyMuPDF (fitz), Pillow (이미지→PDF 변환용)
"""

from fastapi import APIRouter, UploadFile, File
from fastapi.responses import StreamingResponse
from typing import List
import fitz  # PyMuPDF
from PIL import Image
import io
import os
import tempfile
from datetime import datetime

router = APIRouter(prefix="/api", tags=["evidence-processor"])


def stamp_page(page: fitz.Page, label: str):
    """
    페이지 우측 상단에 붉은색 굵은 갑호증 스탬프를 합성합니다.
    여백을 고려하여 우측 상단에 배치합니다.
    """
    rect = page.rect  # 페이지 크기

    # 스탬프 텍스트 크기/위치 계산
    font_size = min(rect.width, rect.height) * 0.028  # 페이지 대비 비율
    font_size = max(font_size, 12)  # 최소 12pt
    font_size = min(font_size, 22)  # 최대 22pt

    # 스탬프 배경 박스 위치 (우측 상단, 여백 15pt)
    margin = 15
    text_width = len(label) * font_size * 0.55  # 대략적 텍스트 폭
    text_height = font_size + 10

    box_x1 = rect.width - margin - text_width - 16
    box_y1 = margin
    box_x2 = rect.width - margin
    box_y2 = margin + text_height + 8

    # 반투명 흰색 배경 박스
    bg_rect = fitz.Rect(box_x1, box_y1, box_x2, box_y2)
    shape = page.new_shape()
    shape.draw_rect(bg_rect)
    shape.finish(
        color=(0.8, 0.1, 0.1),     # 테두리: 붉은색
        fill=(1.0, 1.0, 1.0),       # 배경: 흰색
        width=1.5,
        fill_opacity=0.85
    )
    shape.commit()

    # 붉은색 굵은 텍스트
    text_x = box_x1 + 8
    text_y = box_y1 + font_size + 2

    page.insert_text(
        (text_x, text_y),
        label,
        fontsize=font_size,
        fontname="helv",    # Helvetica (built-in, 한글 미지원이면 fallback)
        color=(0.85, 0.1, 0.1),  # 진한 붉은색
    )


def image_to_pdf_page(image_bytes: bytes, filename: str) -> fitz.Document:
    """
    이미지 파일을 PDF 한 페이지로 변환합니다.
    A4 크기에 맞게 이미지를 배치합니다.
    """
    img = Image.open(io.BytesIO(image_bytes))
    if img.mode == "RGBA":
        img = img.convert("RGB")

    # A4 크기 (pt): 595.28 x 841.89
    a4_width, a4_height = 595.28, 841.89

    # 이미지 비율 유지하며 A4에 맞추기
    img_width, img_height = img.size
    scale = min(
        (a4_width - 60) / img_width,  # 좌우 여백 30pt
        (a4_height - 60) / img_height  # 상하 여백 30pt
    )
    new_width = img_width * scale
    new_height = img_height * scale

    # 이미지 → 바이트
    img_buffer = io.BytesIO()
    img.save(img_buffer, format="JPEG", quality=92)
    img_buffer.seek(0)

    # PDF 생성
    doc = fitz.open()
    page = doc.new_page(width=a4_width, height=a4_height)

    # 이미지를 페이지 중앙에 배치
    x_offset = (a4_width - new_width) / 2
    y_offset = (a4_height - new_height) / 2
    img_rect = fitz.Rect(x_offset, y_offset, x_offset + new_width, y_offset + new_height)

    page.insert_image(img_rect, stream=img_buffer.read())

    return doc


@router.post("/merge-evidence")
async def merge_evidence(files: List[UploadFile] = File(...)):
    """
    여러 이미지/PDF 파일을 받아 갑호증 넘버링 후 단일 PDF로 병합합니다.
    """
    if not files:
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=400, content={"detail": "파일을 1개 이상 업로드해 주세요."})

    print(f"[Evidence] 📄 Processing {len(files)} files...")

    merged_doc = fitz.open()  # 최종 병합 PDF
    evidence_number = 1

    for file in files:
        try:
            content = await file.read()
            filename = file.filename or "unknown"
            ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

            print(f"[Evidence]   → {filename} ({len(content) // 1024}KB, type={ext})")

            if ext in ("jpg", "jpeg", "png", "gif", "bmp", "webp"):
                # 이미지 → PDF 변환
                img_doc = image_to_pdf_page(content, filename)
                for page_idx in range(len(img_doc)):
                    merged_doc.insert_pdf(img_doc, from_page=page_idx, to_page=page_idx)
                    # 방금 삽입된 마지막 페이지에 스탬프
                    target_page = merged_doc[-1]
                    label = f"[갑 제{evidence_number}호증]"
                    stamp_page(target_page, label)
                    evidence_number += 1
                img_doc.close()

            elif ext == "pdf":
                # PDF 파일 처리
                pdf_doc = fitz.open(stream=content, filetype="pdf")
                for page_idx in range(len(pdf_doc)):
                    merged_doc.insert_pdf(pdf_doc, from_page=page_idx, to_page=page_idx)
                    target_page = merged_doc[-1]
                    label = f"[갑 제{evidence_number}호증]"
                    stamp_page(target_page, label)
                    evidence_number += 1
                pdf_doc.close()

            else:
                print(f"[Evidence]   ⚠ Unsupported file type: {ext}, skipping")
                continue

        except Exception as e:
            print(f"[Evidence]   ❌ Error processing {file.filename}: {e}")
            continue

    if len(merged_doc) == 0:
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=400, content={"detail": "처리 가능한 파일이 없습니다. JPG, PNG, PDF 파일을 업로드해 주세요."})

    # PDF를 바이트로 출력
    pdf_bytes = merged_doc.tobytes()
    merged_doc.close()

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_filename = f"갑호증_병합_{timestamp}.pdf"

    print(f"[Evidence] ✅ Merged {evidence_number - 1} evidence items → {len(pdf_bytes) // 1024}KB")

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{output_filename}"',
            "Content-Length": str(len(pdf_bytes)),
        }
    )
