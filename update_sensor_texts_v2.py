import sys

filename = '/home/shared/TFIA/hackathon-the-wave/dashboard/frontend/src/app/page.tsx'

with open(filename, 'r') as f:
    lines = f.readlines()

for i in range(470, 660):
    if i >= len(lines):
        break
    # Labels
    lines[i] = lines[i].replace('className="text-on-surface-variant font-medium"', 'className="text-sm text-on-surface-variant font-medium"')
    lines[i] = lines[i].replace('className="text-on-surface-variant/60 font-medium"', 'className="text-sm text-on-surface-variant/60 font-medium"')
    
    # Subscripts
    lines[i] = lines[i].replace('className="text-[9px]"', 'className="text-[10px]"')
    
    # Values
    lines[i] = lines[i].replace('className="text-sm font-bold text-on-surface"', 'className="text-base font-bold text-on-surface"')
    lines[i] = lines[i].replace('className="text-sm font-bold text-on-surface-variant/60"', 'className="text-base font-bold text-on-surface-variant/60"')
    
    # Units
    lines[i] = lines[i].replace('className="font-normal text-[10px]', 'className="font-normal text-xs')
    
    # Container sizes (optional but helps avoid breaking layouts)
    lines[i] = lines[i].replace('min-w-[80px]', 'min-w-[95px]')
    lines[i] = lines[i].replace('min-w-[60px]', 'min-w-[75px]')

with open(filename, 'w') as f:
    f.writelines(lines)
