from fastapi import APIRouter, UploadFile, File, HTTPException
import pypdf
import io

router = APIRouter(tags=["files"])

@router.post("/extract-pdf")
async def extract_pdf(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    try:
        content = await file.read()
        pdf_reader = pypdf.PdfReader(io.BytesIO(content))
        text_pages = []
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_pages.append(page_text)
        
        extracted_text = "\n".join(text_pages).strip()
        
        if not extracted_text:
            raise HTTPException(status_code=400, detail="Could not extract text from PDF. Ensure it is not an image-based PDF without OCR.")
            
        return {"filename": file.filename, "text": extracted_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")
