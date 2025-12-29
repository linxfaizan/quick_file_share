import os
import random
import string
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__, static_url_path='', static_folder='.')

# Create 'uploads' folder if it doesn't exist
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# In-memory database: { '1234': 'my_photo.jpg' }
db = {}

def generate_code():
    return ''.join(random.choices(string.digits, k=4))

@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        # Save file locally
        save_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(save_path)
        
        # Generate code
        code = generate_code()
        db[code] = file.filename
        
        print(f"✅ Saved: {file.filename} | Code: {code}")
        return jsonify({"code": code})

    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/get', methods=['POST'])
def get_file_link():
    data = request.json
    code = data.get('code')
    
    if code in db:
        # We now create a link using the CODE, not the filename.
        # This helps us identify which code to delete later.
        return jsonify({"link": f"/download/{code}"})
    else:
        return jsonify({"error": "Invalid code"}), 404

# --- THE NEW SELF-DESTRUCT LOGIC ---
@app.route('/download/<code>')
def download_file(code):
    # 1. Find the filename using the code
    filename = db.get(code)
    
    if not filename:
        return "Error: File expired or does not exist", 404

    file_path = os.path.join(UPLOAD_FOLDER, filename)

    # 2. Define the cleanup function (The Self-Destruct Button)
    def cleanup():
        try:
            print(f"💥 Self-destructing file: {filename}")
            # Remove file from disk
            if os.path.exists(file_path):
                os.remove(file_path)
            # Remove code from memory
            if code in db:
                del db[code]
        except Exception as e:
            print(f"Error during cleanup: {e}")

    # 3. Send the file
    try:
        response = send_from_directory(UPLOAD_FOLDER, filename, as_attachment=True)
        
        # 4. Schedule the cleanup to happen AFTER the request is done
        response.call_on_close(cleanup)
        
        return response
    except Exception as e:
        return f"Error sending file: {e}", 404

if __name__ == '__main__':
    print(f"🚀 Server running on http://127.0.0.1:5000")
    app.run(debug=True, port=5000)