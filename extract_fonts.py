import fitz # PyMuPDF
import sys
from collections import Counter

def extract_info(pdf_path):
    doc = fitz.open(pdf_path)
    page = doc[0]
    
    # Get fonts
    fonts = page.get_fonts()
    print("Fonts:")
    for f in fonts:
        print(f"  {f}")
    
    # Get text dict
    text_dict = page.get_text("dict")
    colors = Counter()
    sizes = Counter()
    font_names = Counter()
    
    for block in text_dict.get("blocks", []):
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                text = span.get("text", "").strip()
                if text:
                    color = hex(span.get("color", 0))
                    colors[color] += 1
                    sizes[round(span.get("size", 0), 1)] += 1
                    font_names[span.get("font", "")] += 1
                    
    print("\nMost common colors:")
    for c, count in colors.most_common(5):
        print(f"  {c}: {count} occurrences")
        
    print("\nMost common sizes:")
    for s, count in sizes.most_common(5):
        print(f"  {s}: {count} occurrences")
        
    print("\nMost common fonts:")
    for f, count in font_names.most_common(5):
        print(f"  {f}: {count} occurrences")

    # Check for drawings (lines, rects, which might be watermarks)
    drawings = page.get_drawings()
    print(f"\nDrawings on page: {len(drawings)}")

if __name__ == "__main__":
    extract_info(sys.argv[1])
