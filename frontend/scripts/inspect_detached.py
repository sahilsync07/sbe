import subprocess
import json
import collections

out = subprocess.check_output(['git', 'show', 'b558c38', '--', 'frontend/public/assets/stock-data.json'], encoding='utf-8')
detached = []
for line in out.splitlines():
    if line.startswith('-        "secondaryImageUrl":'):
        url = line.split(':', 1)[1].strip().strip('",')
        detached.append(url)

print('Total detached:', len(detached))
counts = collections.Counter([u.split('/')[-2] if '/' in u else u for u in detached])
for k, v in counts.items():
    print(f'  {k}: {v}')

print("\nSample URLs detached:")
for u in detached[:20]:
    print(" ", u)
