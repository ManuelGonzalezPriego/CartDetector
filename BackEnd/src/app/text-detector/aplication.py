from flask_cors import CORS
from flask import Flask, request, jsonify, abort
import boto3, os
from dotenv import load_dotenv
from update_image import upload_to_s3
from detect_text import detect_text_in_image
from datetime import datetime
import json
from translate import check_and_translate_simple
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
        processed_texts = [] # Usaremos una nueva lista para los resultados enriquecidos
        
        for d in response['TextDetections']:
            original_text = d['DetectedText']
            
            # Llamada a la función de Google Translate (debe estar definida globalmente)
            translation_info = check_and_translate_simple(original_text) 
            
            # Crear el objeto final con los datos de traducción
            text_info = {
                'Text': original_text,
                'Translation': translation_info['translation_text'], # Texto traducido (o el original si ya era inglés)
                'DetectedLang': translation_info['detected_language'], # Idioma detectado
                'Confidence': d['Confidence'],
                'Type': d['Type']
            }
            
            processed_texts.append(text_info)

        result_key = f"result_{os.path.splitext(filename)[0]}.json"
        s3.Object(bucket_dest, result_key).put(Body=json.dumps(processed_texts, ensure_ascii=False, indent=2).encode('utf-8'))

        return jsonify({
            'message': 'Texto detectado y traducido a inglés si fue necesario.',
            'detected_texts': processed_texts,
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
            if obj.key.endswith('.json'):
                file_obj = s3.Object(bucket_dest, obj.key)

                raw_json = file_obj.get()['Body'].read().decode('utf-8')
                data = json.loads(raw_json)
                
                # --- 💡 MODIFICACIÓN CLAVE AQUÍ ---
                
                # Aseguramos que hay datos para procesar
                if isinstance(data, list) and len(data) > 0:
                    first_item = data[0]
                    
                    # Extraer el texto original (campo 'Text')
                    original_text = first_item.get('Text')
                    
                    # Extraer el texto traducido (campo 'Translation')
                    translated_text = first_item.get('Translation')
                else:
                    original_text = None
                    translated_text = None

                # Añadir AMBOS textos al resultado
                results.append({
                    'file': obj.key,
                    'original_text': original_text,    # Nuevo campo para el texto original
                    'translated_text': translated_text  # Campo para el texto traducido
                })

        return jsonify(results) 
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Error al obtener tarjetas: " + str(e)}), 500

if __name__ == "__main__":
    application.debug = True
    application.run()
