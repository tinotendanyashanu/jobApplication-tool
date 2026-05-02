import fitz

def get_layout(pdf_path):
    doc = fitz.open(pdf_path)
    page = doc[0]
    blocks = page.get_text("blocks")
    # sort by y0
    blocks.sort(key=lambda b: b[1])
    for b in blocks:
        # b = (x0, y0, x1, y1, "text", block_no, block_type)
        print(f"[{b[0]:.1f}, {b[1]:.1f}] -> [{b[2]:.1f}, {b[3]:.1f}]: {b[4][:50].strip().replace(chr(10), ' ')}")

get_layout("sampleCvs/Tinotenda Nyashanu integration.pdf")
