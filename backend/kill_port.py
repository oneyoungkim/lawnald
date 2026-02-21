import os
import signal
import sys
import subprocess

def kill_port(port):
    try:
        # Find process ID using netstat
        cmd = f"netstat -ano | findstr {port}"
        output = subprocess.check_output(cmd, shell=True).decode()
        
        for line in output.splitlines():
            if f":{port}" in line and "LISTENING" in line:
                pid = line.strip().split()[-1]
                print(f"Killing PID {pid} on port {port}...")
                subprocess.call(f"taskkill /F /PID {pid}", shell=True)
                return
        print(f"No process found on port {port}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        kill_port(sys.argv[1])
