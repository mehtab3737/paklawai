import os
import sys
import glob
from pypdf import PdfReader

def main():
    data_dir = "/Users/mhmahtab/Desktop/Projects/Chatbot/paklawaiguide/pakistan-law-chat/data"
    if not os.path.exists(data_dir):
        print(f"❌ Data directory {data_dir} does not exist!")
        sys.exit(1)

    pdf_files = glob.glob(os.path.join(data_dir, "**/*.pdf"), recursive=True)
    if not pdf_files:
        print("ℹ️ No PDF files found in data folder.")
        sys.exit(0)

    print(f"📂 Found {len(pdf_files)} PDF file(s) in data folder.")

    for pdf_path in pdf_files:
        filename = os.path.basename(pdf_path)
        txt_path = os.path.splitext(pdf_path)[0] + ".txt"
        txt_filename = os.path.basename(txt_path)

        # Skip if text file already exists and is not empty
        if os.path.exists(txt_path) and os.path.getsize(txt_path) > 0:
            print(f"⏭️  Skipping {filename} (TXT representation already exists)")
            continue

        print(f"📄 Extracting text from {filename}...")
        try:
            reader = PdfReader(pdf_path)
            text_content = []
            
            for i, page in enumerate(reader.pages):
                text = page.extract_text()
                if text:
                    text_content.append(text)
                
            full_text = "\n\n".join(text_content)
            
            with open(txt_path, "w", encoding="utf-8") as f:
                f.write(full_text)
                
            print(f"  ✅ Saved text to {txt_filename} ({len(full_text)} characters)")
        except Exception as e:
            print(f"  ❌ Error processing {filename}: {str(e)}")

    print("\n✅ PDF Text extraction complete!")

if __name__ == "__main__":
    main()
