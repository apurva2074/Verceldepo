import cv2
import pytesseract
from PIL import Image
import os
import re
import sys
import time
import fitz  # PyMuPDF  

# ---------- SETUP ----------
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# Folder containing uploaded documents
folder_path = "documents"


# ---------- 1. IMAGE QUALITY CHECK ----------
def check_image_quality(image_path):
    if not os.path.exists(image_path):
        return False, "Image file not found."

    img = cv2.imread(image_path)
    if img is None:
        return False, "Unable to read image."

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()

    if blur_score < 50:
        return False, "Image is blurry"
    return True, "Image quality OK"


# ---------- 2. FACE DETECTION ----------
def detect_face(image_path):
    try:
        # Try to load Haar cascade - handle missing file gracefully
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        # Check if cascade loaded properly
        if face_cascade.empty():
            print("Warning: Haar cascade file not found, skipping face detection")
            return "Needs Review", "Face detection unavailable"

        img = cv2.imread(image_path)
        if img is None:
            return False, "Cannot read image"

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)

        if len(faces) == 0:
            return "Needs Review", "Face not clearly detected"
        return True, "Face detected"
    except Exception as e:
        print(f"Face detection error: {str(e)}")
        return "Needs Review", "Face detection failed"


# ---------- 3. OCR TEXT EXTRACTION ----------
def extract_text(image_path):
    img = Image.open(image_path)
    return pytesseract.image_to_string(img)


# ---------- 4. TEXT VALIDATION ----------
def validate_text(text):
    if len(text.strip()) < 10:
        return False, "Insufficient readable text"
    return True, "Text OK"


# ---------- 5. DOCUMENT TYPE DETECTION ----------
def detect_document_type(text):
    if "Aadhaar" in text or "Government of India" in text:
        return "Aadhaar"
    elif "Permanent Account Number" in text or "Income Tax Department" in text:
        return "PAN"
    elif "Passport" in text:
        return "Passport"
    elif "Driving Licence" in text or "Transport" in text:
        return "Driving License"
    else:
        return "Unknown"


# ---------- 6. ID VALIDATION FUNCTIONS ----------
def validate_aadhaar(text):
    clean_text = re.sub(r'\D', '', text)
    match = re.search(r'\d{12}', clean_text)
    return (True, f"Aadhaar detected: {match.group()}") if match else (False, "Invalid Aadhaar format")

def validate_pan(text):
    match = re.search(r'[A-Z]{5}[0-9]{4}[A-Z]', text)
    return (True, f"PAN detected: {match.group()}") if match else (False, "Invalid PAN format")

def validate_passport(text):
    match = re.search(r'[A-Z][0-9]{7}', text)
    return (True, f"Passport detected: {match.group()}") if match else (False, "Invalid Passport format")

def validate_dl(text):
    match = re.search(r'[A-Z]{2}[0-9]{2}\s?[0-9]{11,13}', text)
    return (True, f"DL detected: {match.group()}") if match else (False, "Invalid Driving License format")


# ---------- 7. DOCUMENT VERIFICATION ----------
def verify_document(image_path):
    quality_ok, quality_msg = check_image_quality(image_path)
    if not quality_ok:
        return "Rejected", quality_msg

    face_ok, face_msg = detect_face(image_path)
    # STEP 1: FACE DETECTION - Already returns "Needs Review" if no face detected
    if isinstance(face_ok, str) and face_ok == "Needs Review":
        return "Needs Review", face_msg

    text = extract_text(image_path)

    # STEP 2: TEXT LENGTH CHECK - Reduced from 20 to 10 characters
    valid_text, text_msg = validate_text(text)
    if not valid_text:
        return "Needs Review", text_msg

    doc_type = detect_document_type(text)

    # STEP 3: DOCUMENT TYPE - More lenient detection for Aadhaar
    if doc_type == "Aadhaar":
        ok, msg = validate_aadhaar(text)
    elif doc_type == "PAN":
        ok, msg = validate_pan(text)
    elif doc_type == "Passport":
        ok, msg = validate_passport(text)
    elif doc_type == "Driving License":
        ok, msg = validate_dl(text)
    else:
        # STEP 4: FINAL DECISION - Only reject if completely blank or no valid pattern
        return "Needs Review", "Document type unclear"

    # STEP 5: RETURN STATUS - Only reject for completely invalid formats
    if ok:
        return "Approved", msg
    else:
        # Check if there's any valid ID pattern at all
        if doc_type == "Aadhaar" and ("Aadhaar" in text or "Government of India" in text):
            return "Needs Review", "Aadhaar detected but format unclear"
        elif doc_type == "PAN" and ("Permanent Account Number" in text or "Income Tax Department" in text):
            return "Needs Review", "PAN detected but format unclear"
        else:
            return "Rejected", msg


# ---------- ADDED: PDF CONVERSION ----------
def pdf_to_images(pdf_path):
    try:
        # Open PDF using PyMuPDF
        doc = fitz.open(pdf_path)
        image_paths = []

        for i, page in enumerate(doc):
            # Convert page to pixmap
            pix = page.get_pixmap()
            img_path = f"temp_page_{i}.png"
            pix.save(img_path)
            image_paths.append(img_path)

        doc.close()  # Close PDF document
        return image_paths
    except Exception as e:
        print(f"PDF processing error: {str(e)}")
        return []


# ---------- 8. MULTIPLE DOCUMENT VERIFICATION ----------
def verify_multiple_documents(folder_path):
    results = []

    for file in os.listdir(folder_path):
        path = os.path.join(folder_path, file)

        # IMAGE FILES 
        if file.lower().endswith(('.png', '.jpg', '.jpeg')):
            status, reason = verify_document(path)
            results.append((file, status, reason))

        # PDF FILES 
        elif file.lower().endswith('.pdf'):
            image_pages = pdf_to_images(path)
            if not image_pages:  # PDF processing failed
                results.append((file, "Needs Review", "PDF processing failed"))
            else:
                # Check each page - if ANY page is valid, consider document valid
                page_statuses = []
                for img in image_pages:
                    status, reason = verify_document(img)
                    page_statuses.append((status, reason))
                
                # Cleanup temp images after processing
                for img in image_pages:
                    try:
                        os.remove(img)
                    except:
                        pass  # Ignore cleanup errors
                
                # If any page is Approved, overall document is Approved
                if any(s == "Approved" for s, r in page_statuses):
                    results.append((file, "Approved", "PDF contains valid document"))
                # If any page is Needs Review, overall is Needs Review
                elif any(s == "Needs Review" for s, r in page_statuses):
                    results.append((file, "Needs Review", "PDF requires manual review"))
                # If all pages are Rejected, overall is Rejected
                elif all(s == "Rejected" for s, r in page_statuses):
                    results.append((file, "Rejected", "All PDF pages failed verification"))
                else:
                    results.append((file, "Needs Review", "PDF mixed verification results"))

    return results


# ---------- RUN SYSTEM ----------
if __name__ == "__main__":
    # Check if command line argument provided
    if len(sys.argv) > 1:
        # Single file mode - for backend integration
        file_path = sys.argv[1]
        print(f"\nSINGLE DOCUMENT VERIFICATION")
        
        if not os.path.exists(file_path):
            print(f"Error: File not found: {file_path}")
            sys.exit(1)
        
        # Check if file is PDF and convert first
        if file_path.lower().endswith('.pdf'):
            print("Processing PDF file...")
            image_paths = pdf_to_images(file_path)
            if not image_paths:
                print(f"Error: PDF conversion failed")
                sys.exit(1)
            
            # Process first page (or you could process all pages)
            status, reason = verify_document(image_paths[0])
            
            # Cleanup temp images
            for img in image_paths:
                try:
                    os.remove(img)
                except:
                    pass
        else:
            # Process as image directly
            status, reason = verify_document(file_path)
        
        print(f"\nDocument: {os.path.basename(file_path)}")
        print("Status  :", status)
        print("Reason  :", reason)
    else:
        # Batch mode - existing functionality
        results = verify_multiple_documents(folder_path)
        
        print("\nMULTI-DOCUMENT VERIFICATION RESULT")
        for file, status, reason in results:
            print(f"\nDocument: {file}")
            print("Status  :", status)
            print("Reason  :", reason)
