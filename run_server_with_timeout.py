import subprocess
import time

command = ['powershell.exe', '-Command', ". .\\scripts\\load-env.ps1 -EnvFile 'server/.env' -Silent; node server/dist/index.js"]

proc = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8', errors='ignore')
start = time.time()
lines = []

try:
    while True:
        if proc.poll() is not None:
            break
        line = proc.stdout.readline()
        if line:
            lines.append(line)
        if time.time() - start > 12:
            proc.terminate()
            break
    remaining = proc.stdout.read()
    if remaining:
        lines.append(remaining)
finally:
    if proc.stdout:
        proc.stdout.close()

print('SERVER_RUN_LOG_START')
for raw in lines:
    safe = raw.encode('cp1252', errors='ignore').decode('cp1252')
    print(safe, end='')
print('SERVER_RUN_LOG_END')
