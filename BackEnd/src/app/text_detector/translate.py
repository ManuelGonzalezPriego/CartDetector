from googletrans import Translator
translate_client = Translator()

# La función debe llamarse de otra manera, por ejemplo, check_and_translate_simple
def check_and_translate_simple(text):
    
    # ... (código para manejar espacios es correcto) ...
    if not text or text.isspace():
        return {
            'original_text': text,
            'detected_language': 'und',
            'translation_text': text,
            'translated': False
        }

    try:
        # 1. Llamar a translate con la sintaxis de googletrans
        # 'dest' es el idioma destino (inglés)
        resultado = translate_client.translate(
            text,
            dest='en' 
        )
        
        # 2. Extraer los datos de la respuesta de googletrans
        detected_lang = resultado.src     # Idioma de origen
        translated_text = resultado.text  # Texto traducido
        
        # Ya no necesitas limpiar la codificación HTML, googletrans lo maneja.
        
        # 3. Determinar si se realizó una traducción real
        was_translated = detected_lang != 'en'

        return {
            'original_text': text,
            'detected_language': detected_lang,
            'translation_text': translated_text,
            'translated': was_translated
        }
            
    except Exception as e:
        # ... (manejo de errores es correcto) ...
        print(f"Error al traducir/detectar el texto con googletrans: {e}")
        return {
            'original_text': text,
            'detected_language': 'error',
            'translation_text': text,
            'translated': False
        }