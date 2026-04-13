import os
import glob
import re

for filepath in glob.glob('/home/shared/TFIA/hackathon-the-wave/zaragoza/scripts/*.js'):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Replace all console.log with console.error except the JSON.stringify ones
    # A bit of regex: look for console.log( but not if it's followed by JSON.stringify
    new_content = re.sub(r"console\.log\((?!.*JSON\.stringify)", "console.error(", content)
    
    with open(filepath, 'w') as f:
        f.write(new_content)

print("Logs fixed")
