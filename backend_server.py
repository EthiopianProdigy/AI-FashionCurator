from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os
import base64

# Add the components directory to the path so we can import the backend script
sys.path.append(os.path.join(os.path.dirname(__file__), 'components'))

# Try to import generate_outfit_image
try:
    from clothing_recommend_backend import generate_outfit_image
    HAS_GENERATE_FUNCTION = True
except ImportError as e:
    HAS_GENERATE_FUNCTION = False
    print(f"Warning: generate_outfit_image function not found: {e}")

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

@app.route('/api/save-person-image', methods=['POST'])
def save_person_image():
    """
    API endpoint to save uploaded person image to components/icons/person/person_image.jpg
    Expects JSON body with 'image_base64' and optional 'mimeType' fields.
    Overwrites the existing file if it exists.
    """
    try:
        data = request.get_json()
        if not data or 'image_base64' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing image_base64 in request'
            }), 400
        
        image_base64 = data['image_base64']
        mime_type = data.get('mimeType', 'image/jpeg')
        
        # Decode base64 image
        image_data = base64.b64decode(image_base64)
        
        # Ensure components/icons/person directory exists
        project_dir = os.path.dirname(os.path.abspath(__file__))
        person_dir = os.path.join(project_dir, 'components', 'icons', 'person')
        os.makedirs(person_dir, exist_ok=True)
        
        # Save to components/icons/person/person_image.jpg (overwrites if exists)
        person_image_path = os.path.join(person_dir, 'person_image.jpg')
        with open(person_image_path, 'wb') as f:
            f.write(image_data)
        
        return jsonify({
            'success': True,
            'path': person_image_path,
            'message': f'Image saved to {person_image_path}'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f"Error saving image: {str(e)}"
        }), 500

@app.route('/api/generate-outfit', methods=['POST'])
def generate_outfit():
    """
    API endpoint to generate an outfit image.
    Expects JSON body with optional 'prompt' field.
    """
    if not HAS_GENERATE_FUNCTION:
        return jsonify({
            'success': False,
            'error': 'generate_outfit_image function not available. The backend script needs to be converted to use functions.'
        }), 503
    
    try:
        data = request.get_json()
        user_prompt = data.get('prompt', '') if data else ''
        
        if not user_prompt:
            return jsonify({
                'success': False,
                'error': 'Prompt is required'
            }), 400
        
        result = generate_outfit_image(user_prompt)
        
        if result['success']:
            return jsonify({
                'success': True,
                'image_base64': result['image_base64'],
                'format': result.get('format', 'PNG')
            })
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Unknown error')
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f"Server error: {str(e)}"
        }), 500

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    print("Starting Flask server on http://localhost:5000")
    print("API endpoint: http://localhost:5000/api/generate-outfit")
    app.run(port=5000, debug=True)

