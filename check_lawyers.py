import requests, struct, zlib

API = "https://www.lawnald.com"
H = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "Accept": "application/json"}

# Check current lawyers
r = requests.get(f"{API}/api/admin/lawyers", headers=H)
print(f"Status: {r.status_code}")
if r.status_code != 200:
    print(f"Error: {r.text[:200]}")
    exit(1)

data = r.json()
existing = [l.get("id") for l in data]
print(f"현재 변호사 {len(data)}명: {existing}")

if "jdnlaw@innovatelaw.kr" in existing:
    print("\n✅ 이정도 변호사 이미 등록됨!")
else:
    print("\n등록 시도 중...")
    sig = b'\x89PNG\r\n\x1a\n'
    ihdr_data = struct.pack('>IIBBBBB', 1, 1, 8, 2, 0, 0, 0)
    ihdr_crc = struct.pack('>I', zlib.crc32(b'IHDR' + ihdr_data) & 0xffffffff)
    ihdr = struct.pack('>I', 13) + b'IHDR' + ihdr_data + ihdr_crc
    raw = zlib.compress(b'\x00\xff\xff\xff')
    idat_crc = struct.pack('>I', zlib.crc32(b'IDAT' + raw) & 0xffffffff)
    idat = struct.pack('>I', len(raw)) + b'IDAT' + raw + idat_crc
    iend_crc = struct.pack('>I', zlib.crc32(b'IEND') & 0xffffffff)
    iend = struct.pack('>I', 0) + b'IEND' + iend_crc
    png = sig + ihdr + idat + iend

    files = {"licenseImage": ("license.png", png, "image/png")}
    form = {
        "name": "이정도 변호사",
        "email": "jdnlaw@innovatelaw.kr",
        "password": "dsf213(^",
        "licenseId": "000000",
        "firm": "",
        "phone": "010-0000-0000",
    }
    r = requests.post(f"{API}/api/auth/signup/lawyer", headers=H, data=form, files=files)
    print(f"결과: {r.status_code}")
    print(f"응답: {r.text[:300]}")

# Verify
print("\n=== 최종 확인 ===")
r = requests.get(f"{API}/api/admin/lawyers", headers=H)
for l in r.json():
    print(f"  {l.get('id')} | {l.get('name')} | verified={l.get('verified')}")
