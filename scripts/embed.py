import sys
import json
from sentence_transformers import SentenceTransformer

def main():
    try:
        # Read text from stdin to support any length and avoid shell escaping issues
        input_data = json.load(sys.stdin)
        text = input_data.get("text", "")
        if not text:
            print(json.dumps({"error": "No text provided"}))
            sys.exit(1)
            
        model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        embedding = model.encode(text, convert_to_numpy=True)
        print(json.dumps({"embedding": embedding.tolist()}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
