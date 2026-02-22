import subprocess
import sys

try:
    process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app", "--port", "8000"],
        stderr=subprocess.PIPE,
        stdout=subprocess.PIPE,
        text=True
    )
    for line in process.stderr:
        print(line.strip())
except Exception as e:
    print(e)
