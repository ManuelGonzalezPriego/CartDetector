from flask import Flask, request, Response
import boto3, os, base64
from dotenv import load_dotenv
from update_image import upload_to_s3
from detect_text import detect_text_in_image

# Load env variables from .env file
load_dotenv()

# Get env variables
accessKeyId = os.environ.get('ACCESS_KEY_ID')
secretKey = os.environ.get('ACCESS_SECRET_KEY')
bucket_source = os.environ.get('BUCKET_SOURCE')
bucket_dest = os.environ.get('BUCKET_DEST')

# Create Flask application
application = Flask(__name__)

# Create the s3 service and assign credentials
s3 = boto3.Session(
    aws_access_key_id=accessKeyId,
    aws_secret_access_key=secretKey).resource('s3')

@application.route('/api/analyze-text', methods=['POST'])
def analyze_text():

    # Endpoint que recibe una imagen local o en base64, la sube a S3 y devuelve los textos detectados.

    try:
        filename = "uploaded_image.jpg"

        # Si viene como archivo (multipart/form-data)
        if 'file' in request.files:
            file = request.files['file']
            filename = file.filename or filename
            image_bytes = file.read()

        #Si viene como base64 (JSON)
        elif request.is_json and 'image_base64' in request.json:
            image_b64 = request.json['image_base64']
            image_bytes = base64.b64decode(image_b64)
            filename = request.json.get('filename', filename)

        else:
            return os.abort(400)

        # Subir imagen al bucket origen
        upload_to_s3(s3,bucket_source,image_bytes, filename);

        # Detectar texto
        response = detect_text_in_image(filename)

        # Procesar resultados
        detected_texts = [
            {
                'Text': d['DetectedText'],
                'Confidence': d['Confidence'],
                'Type': d['Type']
            }
            for d in response['TextDetections']
        ]

        # Guardar resultado JSON en el bucket destino
        result_key = f"result_{os.path.splitext(filename)[0]}.json"
        s3.Object(bucket_dest, result_key).put(Body=str(detected_texts).encode('utf-8'))
        print(f"Resultado guardado en {result_key}")

        return os.abort(200)
    except Exception as e:
        return os.abort(500)
# Run the app
if __name__ == "__main__":
    application.debug = True
    application.run() # Running on http://127.0.0.1:5000/
