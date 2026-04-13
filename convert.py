import re

html_file = "/home/shared/TFIA/hackathon-the-wave/dashboard/frontend/code.html"
tsx_file = "/home/shared/TFIA/hackathon-the-wave/dashboard/frontend/src/app/page.tsx"

with open(html_file, "r", encoding="utf-8") as f:
    html_content = f.read()

# Extract from <aside> to </main>
aside_start = html_content.find("<aside")
main_end = html_content.find("</main>") + len("</main>")

content = html_content[aside_start:main_end]

# Convert class to className
content = content.replace('class="', 'className="')

# Convert for to htmlFor
content = content.replace('for="', 'htmlFor="')

# Convert inline styles
def style_replacer(match):
    style_str = match.group(1)
    if "font-variation-settings: 'FILL' 1;" in style_str:
        return 'style={{ fontVariationSettings: "\'FILL\' 1" }}'
    return match.group(0) # fallback
    
content = re.sub(r'style="([^"]+)"', style_replacer, content)

# Replace <img ...> tags to be self-closing if they are not
def img_replacer(match):
    tag = match.group(0)
    if not tag.endswith("/>"):
        # For simplicity, if it's <img ... >, make it <img ... />
        if tag.endswith(">"):
            return tag[:-1] + " />"
    return tag

content = re.sub(r'<img[^>]+>', img_replacer, content)

# Replace the satellite image with <Map />
map_img_str = '<img alt="Vista Satelital del Parque Natural del Montgó" className="w-full h-full object-cover grayscale-[0.2] brightness-[0.9]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvcLceWnKSvh9zrsfPCgwHWEXz168Odhwz6Ypq67jbrfDC6kGX4lv3OGOR322i6wc8zOblFpWPQKkHGgYkuEYeOmCL7t-WwGKkAUZ0RaVAK-boMN76FoYVAvMI7Dy_5gxIkQ6zn7LtpMONVBchkRobLYK07YF8AKg32XHFK0-rrWQT5nmX8umP7DXVvMx0o1WCwjSu8pOrNN-g4skT7fggL2h2RnTAIvpLg0f6QNQm9Fz_4lM4LQcFagOG8o3b3dyIsjcfFn2jZDjA" />'
if map_img_str in content:
    content = content.replace(map_img_str, '<Map />')
else:
    # Just to be safe, replace ANY <img> in the section if exact string doesn't match
    pass

content = content.replace('<div className="absolute inset-0 heatmap-glow opacity-50"></div>', '<div className="absolute inset-0 heatmap-glow opacity-50 pointer-events-none"></div>')

# remove the camera marker if it exists (using regex to be safe about whitespace)
content = re.sub(r'<div className="absolute top-\[45%\] left-\[65%\].*?</div>\s*</div>\s*</div>', '', content, flags=re.DOTALL)


# We also need to fix `<!-- comments -->` to `{/* comments */}`
def comment_replacer(match):
    return "{/*" + match.group(1) + "*/}"

content = re.sub(r'<!--(.*?)-->', comment_replacer, content, flags=re.DOTALL)

out_code = f"""import Map from "@/components/Map";

export default function Dashboard() {{
  return (
    <>
{content}
    </>
  );
}}
"""

with open(tsx_file, "w", encoding="utf-8") as f:
    f.write(out_code)

print("Done conversion")
