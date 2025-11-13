from flask import Flask, request, jsonify, abort
import boto3, os, base64
from dotenv import load_dotenv
from update_image import upload_to_s3
from detect_text import detect_text_in_image

load_dotenv()

accessKeyId = os.environ.get('ACCESS_KEY_ID')
secretKey = os.environ.get('ACCESS_SECRET_KEY')
bucket_source = os.environ.get('BUCKET_SOURCE')
bucket_dest = os.environ.get('BUCKET_DEST')

application = Flask(__name__)

s3 = boto3.Session(
    aws_access_key_id=accessKeyId,
    aws_secret_access_key=secretKey).resource('s3')

@application.route('/api/analyze-text', methods=['POST'])
def analyze_text():
    try:
        filename = "uploaded_image.jpg"

        # Archivo enviado como multipart/form-data
        if 'file' in request.files:
            file = request.files['file']
            filename = file.filename or filename
            image_bytes = file.read()

        # Imagen enviada en Base64 (JSON)
        elif request.is_json and 'image_base64' in request.json:
            image_b64 = request.json['image_base64']
            image_bytes = base64.b64decode(image_b64)
            filename = request.json.get('filename', filename)

        else:
            abort(400)  # Bad Request si no hay imagen

        # Subir a S3
        upload_to_s3(s3, bucket_source, image_bytes, filename)

        # Detectar texto
        response = detect_text_in_image(filename)

        # Procesar resultados
        detected_texts = [
            {'Text': d['DetectedText'], 'Confidence': d['Confidence'], 'Type': d['Type']}
            for d in response['TextDetections']
        ]

        # Guardar resultado JSON en bucket destino
        result_key = f"result_{os.path.splitext(filename)[0]}.json"
        s3.Object(bucket_dest, result_key).put(Body=str(detected_texts).encode('utf-8'))
        print(f"Resultado guardado en {result_key}")

        # Devuelve JSON OK
        return jsonify({
            'message': 'Texto detectado correctamente',
            'detected_texts': detected_texts,
            'result_key': result_key
        }), 200

    except Exception as e:
        print(f"Error: {e}")
        abort(500)  # Internal Server Error

if __name__ == "__main__":
    application.debug = True
    application.run()
