import re

with open("dashboard/frontend/src/app/page.tsx", "r") as f:
    content = f.read()

# Add use client
if '"use client";' not in content:
    content = content.replace('import Map from "@/components/Map";', '"use client";\n\nimport Map from "@/components/Map";\nimport { useState } from "react";')

# Add useState
if 'const [isExpanded, setIsExpanded] = useState(false);' not in content:
    content = content.replace('export default function Dashboard() {\n  return (', 'export default function Dashboard() {\n  const [isExpanded, setIsExpanded] = useState(false);\n\n  return (')

# Change grid wrapper
if 'max-h-[420px]' not in content:
    content = content.replace('<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">', '<div className="relative mb-6">\n<div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-hidden transition-all duration-700 ease-in-out ${isExpanded ? \'max-h-[3000px]\' : \'max-h-[420px]\'}`}>')

# Camera duplication
cam_str = """<div className="relative group rounded-xl overflow-hidden aspect-video border-2 border-primary shadow-md">
<img alt="AI Camera 1 View" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQFVWBbZCHjgMIs-Yy7i19DX_bvSB_uDpTe2JWYV3ow6_-5C5Hz5A43bo_Ql_fW2rXcG_ryzJMM3Y3D4H-BOsZt-N0IzCdIA2IhIQycrU7Ow4j4XRlDYUnbdqKBWCEoLBtkZELCm5W-aZb3jpCGbQ6ON3XLjhDtydhtwwTvI9kxtuY3xEPX-5Y41gkA5WKpCQR1ZTcv1kMNVfKFAvZq5Vk6ZPw9MCEGLk5cbethoG3jOPVMAL4F0g1AjB7kyjnI2fkGCOR6PClB3ZI"/>
<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
<div className="absolute top-2 left-2 flex items-center gap-1.5 px-1.5 py-0.5 bg-black/50 backdrop-blur-md rounded-full">
<div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></div>
<span className="text-[8px] font-bold text-white uppercase tracking-wider">Live</span>
</div>
<div className="absolute bottom-2 left-2">
<p className="text-[9px] font-bold text-white leading-tight">North Face AI-1</p>
<p className="text-[7px] text-white/80">Hazard: 0%</p>
</div>
</div>
<div className="relative group rounded-xl overflow-hidden aspect-video shadow-md border border-outline-variant">
<img alt="AI Camera 2 View" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA3LA3WsCdqgb6X0YC_3mV4mFWENVzJaCVcG1kvvM695VpJWzSjBxPVzI6Hf7FzRLaglWVQJWGonqVwqFWHs5I_D9oidmNsps4I5Ml-dgsKaS5Ihdrmd5LTcXNE37iOuolYAFQA41yVn7nq4qyqGHVe95TWUHfnYE03xfy3P93oMnJashgwvQZVtKfAIuM1bQSCUvZkdx7NkM5SsqOe-xlsQQc5HDbxF9InRmY1LE-IHFsIazs_jpSq-9TZNyhyfq7rT4sMZTRutvPP"/>
<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
<div className="absolute top-2 left-2 flex items-center gap-1.5 px-1.5 py-0.5 bg-black/50 backdrop-blur-md rounded-full">
<div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></div>
<span className="text-[8px] font-bold text-white uppercase tracking-wider">Live</span>
</div>
<div className="absolute bottom-2 left-2">
<p className="text-[9px] font-bold text-white leading-tight">Valley Watch 2</p>
<p className="text-[7px] text-white/80">Clear</p>
</div>
</div>"""

if content.count('AI Camera 1 View') == 1:
    repl_cam = cam_str + '\n' + cam_str.replace("AI Camera 1", "AI Camera 3").replace("AI Camera 2", "AI Camera 4") + '\n' + cam_str.replace("AI Camera 1", "AI Camera 5").replace("AI Camera 2", "AI Camera 6")
    content = content.replace(cam_str, repl_cam)

# Microphone duplication
mic_str = """<div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex items-center justify-between border border-outline-variant">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-secondary text-lg">mic</span>
<span className="text-sm font-medium">Mic Crevillent-01</span>
</div>
<div className="flex flex-col items-end">
<span className="text-xs font-bold text-secondary">Claro</span>
<span className="text-[10px] font-mono text-on-surface-variant">Fuego Prob: 2%</span>
</div>
</div>
<div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex items-center justify-between border border-error/50">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-error text-lg animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
<span className="text-sm font-medium text-error">Mic Elda-Core</span>
</div>
<div className="flex flex-col items-end">
<span className="text-xs font-bold text-error">Fuego Detectado</span>
<span className="text-[10px] font-mono text-error">Fuego Prob: 89%</span>
</div>
</div>"""

if content.count('Mic Crevillent-01') == 1:
    repl_mic = mic_str + '\n' + mic_str.replace("Crevillent-01", "Crevillent-02").replace("Elda-Core", "Elda-Sur") + '\n' + mic_str.replace("Crevillent-01", "Orihuela-01").replace("Elda-Core", "Villena-01")
    content = content.replace(mic_str, repl_mic)

# Sensors duplication
sens_str = """<div className="bg-surface-container-lowest p-3 rounded-xl shadow-sm border border-outline-variant">
    <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-base">sensors</span>
            <span className="text-[11px] font-bold uppercase tracking-wider">Estación Alpha</span>
        </div>
        <div className="flex items-center gap-1.5">
             <span className="px-1.5 py-0.5 bg-primary-fixed text-on-primary-fixed text-[8px] font-bold rounded-sm">ICA 2/5</span>
             <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
        </div>
    </div>
    <div className="flex flex-wrap gap-1.5 pl-1">
        <div className="bg-surface-container px-2 py-0.5 rounded text-[9px] min-w-[60px] flex justify-between gap-1 border border-outline-variant/30">
            <span className="text-on-surface-variant font-medium">SO<span className="text-[7px]">2</span></span><span className="font-bold text-on-surface">15</span>
        </div>
        <div className="bg-surface-container px-2 py-0.5 rounded text-[9px] min-w-[60px] flex justify-between gap-1 border border-outline-variant/30">
            <span className="text-on-surface-variant font-medium">NO<span className="text-[7px]">2</span></span><span className="font-bold text-on-surface">42</span>
        </div>
        <div className="bg-surface-container px-2 py-0.5 rounded text-[9px] min-w-[60px] flex justify-between gap-1 border border-outline-variant/30">
            <span className="text-on-surface-variant font-medium">PM<span className="text-[7px]">2.5</span></span><span className="font-bold text-on-surface">18</span>
        </div>
        <div className="bg-surface-container px-2 py-0.5 rounded text-[9px] min-w-[60px] flex justify-between gap-1 border border-outline-variant/30">
            <span className="text-on-surface-variant font-medium">PM<span className="text-[7px]">10</span></span><span className="font-bold text-on-surface">30</span>
        </div>
    </div>
</div>
<div className="bg-surface-container-lowest p-3 rounded-xl shadow-sm border border-outline-variant">
    <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant text-base">sensors</span>
            <span className="text-[11px] font-bold uppercase tracking-wider">Estación Beta</span>
        </div>
        <div className="flex items-center gap-1.5">
             <span className="px-1.5 py-0.5 bg-surface-variant text-on-surface-variant text-[8px] font-bold rounded-sm border border-dashed border-outline-variant/50">ICA N/D</span>
             <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
        </div>
    </div>
    <div className="flex flex-wrap gap-1.5 pl-1">
        <div className="bg-surface-variant/30 px-2 py-0.5 rounded text-[9px] min-w-[60px] flex justify-between gap-1 border border-dashed border-outline-variant/50">
            <span className="text-on-surface-variant/60 font-medium">SO<span className="text-[7px]">2</span></span><span className="font-bold text-on-surface-variant/60">--</span>
        </div>
        <div className="bg-surface-variant/30 px-2 py-0.5 rounded text-[9px] min-w-[60px] flex justify-between gap-1 border border-dashed border-outline-variant/50">
            <span className="text-on-surface-variant/60 font-medium">NO<span className="text-[7px]">2</span></span><span className="font-bold text-on-surface-variant/60">--</span>
        </div>
        <div className="bg-surface-container px-2 py-0.5 rounded text-[9px] min-w-[60px] flex justify-between gap-1 border border-outline-variant/30">
            <span className="text-on-surface-variant font-medium">PM<span className="text-[7px]">2.5</span></span><span className="font-bold text-on-surface">22</span>
        </div>
        <div className="bg-surface-container px-2 py-0.5 rounded text-[9px] min-w-[60px] flex justify-between gap-1 border border-outline-variant/30">
            <span className="text-on-surface-variant font-medium">PM<span className="text-[7px]">10</span></span><span className="font-bold text-on-surface">45</span>
        </div>
    </div>
</div>"""

if content.count('Estación Alpha') == 1:
    repl_sens = sens_str + '\n' + sens_str.replace("Alpha", "Gamma").replace("Beta", "Delta") + '\n' + sens_str.replace("Alpha", "Epsilon").replace("Beta", "Zeta")
    content = content.replace(sens_str, repl_sens)

# Gradient and replace bottom
if 'bg-gradient-to-t' not in content[content.rfind('</div>\n</div>\n</div>\n{/* Foundation Map Panel'):]:
    # We want to replace the closing tags of the grid container.
    # The grid was: <div className={`grid grid-cols-1 ...
    # Following it is:
    # </div>
    # </div>  <-- closing relative div
    # </div>  <-- closing flex-1 overflow-y-auto p-8
    # {/* Foundation Map
    # Let's do a replace using regex to safely replace the exact closing sequence for the grid:
    # Inside the original code, the grid ends around line 280. We wrapped it in `<div className="relative mb-6">` 
    old_end = '''</div>
</div>
{/* Foundation Map Panel (Bottom) */}'''

    new_end = '''</div>
{/* Gradient transparent overlay */}
<div className={`absolute bottom-0 left-0 right-0 transition-opacity duration-500 pointer-events-none ${isExpanded ? 'opacity-0' : 'opacity-100'} h-32 bg-gradient-to-t from-[#F7FBE1] dark:from-slate-950 via-[#F7FBE1]/80 dark:via-slate-950/80 to-transparent`}></div>
</div>

{/* Show More / Shrink Button */}
<div className="flex justify-center -mt-2 mb-6 relative z-10 w-full">
  <button 
    onClick={() => setIsExpanded(!isExpanded)}
    className="px-6 py-2.5 bg-secondary text-on-secondary rounded-full font-bold shadow-lg shadow-secondary/20 hover:bg-secondary/90 hover:shadow-secondary/30 transition-all flex items-center gap-2 active:scale-95"
  >
    <span>{isExpanded ? "Mostrar Menos" : "Mostrar Más"}</span>
    <span className="material-symbols-outlined text-lg">{isExpanded ? "expand_less" : "expand_more"}</span>
  </button>
</div>
</div>
{/* Foundation Map Panel (Bottom) */}'''

    content = content.replace(old_end, new_end)


with open("dashboard/frontend/src/app/page.tsx", "w") as f:
    f.write(content)
