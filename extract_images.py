import fitz # PyMuPDF
import sys

def extract_images(pdf_path):
    doc = fitz.open(pdf_path)
    for i in range(len(doc)):
        page = doc[i]
        image_list = page.get_images(full=True)
        print(f"Page {i}: {len(image_list)} images found")
        for img_index, img in enumerate(image_list):
            xref = img[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            ext = base_image["ext"]
            image_filename = f"image_p{i}_{img_index}.{ext}"
            with open(image_filename, "wb") as f:
                f.write(image_bytes)
            print(f"Saved {image_filename}")

if __name__ == "__main__":
    extract_images(sys.argv[1])
