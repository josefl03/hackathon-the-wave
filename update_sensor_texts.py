import sys

filename = '/home/shared/TFIA/hackathon-the-wave/dashboard/frontend/src/app/page.tsx'

with open(filename, 'r') as f:
    lines = f.readlines()

for i in range(473, 656):
    lines[i] = lines[i].replace('className="font-bold text-on-surface"', 'className="text-sm font-bold text-on-surface"')
    lines[i] = lines[i].replace('className="font-bold text-on-surface-variant/60"', 'className="text-sm font-bold text-on-surface-variant/60"')
    lines[i] = lines[i].replace('className="font-normal text-[8px]', 'className="font-normal text-[10px]')

with open(filename, 'w') as f:
    f.writelines(lines)
