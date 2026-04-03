import cv2
import pytesseract
from PIL import Image
import os
import re
from pdf2image import convert_from_path  

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
    face_cascade = cv2.CascadeClassifier("haarcascade_frontalface_default.xml")

    img = cv2.imread(image_path)
    if img is None:
        return False, "Cannot read image"

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)

    if len(faces) == 0:
        return False, "No human face detected"
    return True, "Face detected"


# ---------- 3. OCR TEXT EXTRACTION ----------
def extract_text(image_path):
    img = Image.open(image_path)
    return pytesseract.image_to_string(img)


# ---------- 4. TEXT VALIDATION ----------
def validate_text(text):
    if len(text.strip()) < 20:
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
    if not face_ok:
        return "Needs Review", face_msg

    text = extract_text(image_path)

    valid_text, text_msg = validate_text(text)
    if not valid_text:
        return "Needs Review", text_msg

    doc_type = detect_document_type(text)

    if doc_type == "Aadhaar":
        ok, msg = validate_aadhaar(text)
    elif doc_type == "PAN":
        ok, msg = validate_pan(text)
    elif doc_type == "Passport":
        ok, msg = validate_passport(text)
    elif doc_type == "Driving License":
        ok, msg = validate_dl(text)
    else:
        return "Needs Review", "Document type unclear"

    return ("Approved", msg) if ok else ("Rejected", msg)


# ---------- ADDED: PDF CONVERSION ----------
def pdf_to_images(pdf_path):
    pages = convert_from_path(
        pdf_path,
        poppler_path=r"C:\Users\ASUS\Downloads\Release-25.12.0-0\poppler-25.12.0\Library\bin"
    )
    image_paths = []
    for i, page in enumerate(pages):
        img_path = f"temp_page_{i}.jpg"
        page.save(img_path, 'JPEG')
        image_paths.append(img_path)
    return image_paths


    image_paths = []
    for i, page in enumerate(pages):
        img_path = f"temp_page_{i}.jpg"
        page.save(img_path, 'JPEG')
        image_paths.append(img_path)
    return image_paths


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
            for img in image_pages:
                status, reason = verify_document(img)
                results.append((file + " (PDF page)", status, reason))

    return results


# ---------- RUN SYSTEM ----------
results = verify_multiple_documents(folder_path)

print("\nMULTI-DOCUMENT VERIFICATION RESULT")
for file, status, reason in results:
    print(f"\nDocument: {file}")
    print("Status  :", status)
    print("Reason  :", reason)
