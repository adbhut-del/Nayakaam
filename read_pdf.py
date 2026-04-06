import sys
import PyPDF2

def read_pdf(file_path):
    try:
        with open(file_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            for page_num in range(len(reader.pages)):
                page = reader.pages[page_num]
                text += f"\n--- Page {page_num + 1} ---\n"
                text += page.extract_text() or ""
            return text
    except Exception as e:
        return f"Error reading PDF: {e}"

if __name__ == "__main__":
    if len(sys.argv) > 1:
        pdf_path = sys.argv[1]
        out_path = sys.argv[2]
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(read_pdf(pdf_path))
        print("Done writing to", out_path)
    else:
        print("Please provide a PDF path and output path.")
