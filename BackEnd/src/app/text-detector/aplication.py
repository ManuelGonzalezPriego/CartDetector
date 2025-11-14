from flask_cors import CORS
from flask import Flask, request, jsonify, abort
import boto3, os
from dotenv import load_dotenv
from update_image import upload_to_s3
from detect_text import detect_text_in_image
from datetime import datetime
import json

load_dotenv()

accessKeyId = os.environ.get('ACCESS_KEY_ID')
secretKey = os.environ.get('ACCESS_SECRET_KEY')
bucket_source = os.environ.get('BUCKET_SOURCE')
bucket_dest = os.environ.get('BUCKET_DEST')

application = Flask(__name__)
CORS(application, origins=["http://localhost:5173"])
# CORS(application, origins=["http://localhost:3000"])

s3 = boto3.Session(
    aws_access_key_id=accessKeyId,
    aws_secret_access_key=secretKey).resource('s3')

@application.route('/api/analyze-text', methods=['POST'])
def analyze_text():
    try:
        filename = f"uploaded_image_{datetime.now()}.jpg"

        # Archivo enviado como imagen
        if 'file' in request.files:
            file = request.files['file']
            filename = file.filename or filename
            image_bytes = file.read()
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

        # detected_texts = []
        #
        # for item in response['TextDetections']:
        #     text_info = {
        #         'Text': item.get('DetectedText'),
        #         'Confidence': item.get('Confidence'),
        #         'Type': item.get('Type')
        #     }
        #
        #     detected_texts.append(text_info)

        # Guardar resultado JSON en bucket destino
        result_key = f"result_{os.path.splitext(filename)[0]}.json"
        s3.Object(bucket_dest, result_key).put(Body=json.dumps(detected_texts, ensure_ascii=False, indent=2).encode('utf-8'))


        # Devuelve JSON OK
        return jsonify({
            'message': 'Texto detectado correctamente',
            'detected_texts': detected_texts,
            'result_key': result_key
        }), 200
    except Exception as e:
        print(f"{e}, {abort(500)}")

@application.route('/api/get_all_cards', methods=['GET'])
def get_all_cards():
    try:
        results = []
        bucket = s3.Bucket(bucket_dest)

        for obj in bucket.objects.all():
            file_obj = s3.Object(bucket_dest, obj.key)

            raw_json = file_obj.get()['Body'].read().decode('utf-8')
            data = json.loads(raw_json)

            first_text = data[0].get('Text') if isinstance(data, list) and len(data) > 0 else None

            results.append({
                'file': obj.key,
                'text': first_text
            })

        return results
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"{e}, {abort(500)}")


if __name__ == "__main__":
    application.debug = True
    application.run()
