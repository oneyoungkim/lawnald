import subprocess
import sys

process = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "main:app", "--port", "8000"],
    stderr=subprocess.PIPE,
    stdout=subprocess.PIPE,
    text=True
)
out, err = process.communicate()
print("STDOUT:")
print(out)
print("STDERR:")
print(err)
