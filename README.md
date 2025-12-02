# Instalación del proyecto
1. Clonamos el repositorio con : ``git clone https://github.com/ManuelGonzalezPriego/CartDetector.git``
2. Instalaremos docker de su pagina oficial : https://www.docker.com/products/docker-desktop/
3. Crear un .env dentro de la raiz backend con las siguientes carcateristicas:
   ``
  ACCESS_KEY_ID=
  ACCESS_SECRET_KEY=
  BUCKET_SOURCE=
  BUCKET_DEST=
  REGION=
  FLASK_ENV=development
   ``
4. Y ejecutaremos en la raiz del proyecto el comando : ``docker-compose up --build -d``

# Documentación

*Este documento describe la arquitectura y el proceso técnico completo, desde la captura de la imagen por parte del usuario hasta la entrega de la información detallada de la carta.*

   1. Recepción y Almacenamiento de la Imagen
      - Esta fase asegura que la entrada del usuario sea capturada y persistida de manera segura antes del procesamiento.
      - Comunicación Cliente-Servidor: El Frontend (aplicación web o móvil) transmite la imagen capturada al Backend de la aplicación (gestionado a través de un API Gateway o instancia EC2/Lambda).
      - Persistencia de Datos: El Backend guarda la imagen original en un Bucket de AWS S3 dedicado exclusivamente a imágenes de entrada. Esto garantiza la escalabilidad y evita la pérdida de datos.
      - Inicio del Procesamiento: Una vez almacenada la imagen, se dispara automáticamente una solicitud al servicio de IA de AWS (ej. AWS Rekognition u OCR personalizado) para iniciar la detección.


   2. Procesamiento de Texto (OCR) y Generación de Datos
      - El sistema transforma la información visual en datos estructurados procesables.
      - Extracción por IA: El servicio de inteligencia artificial analiza la imagen para extraer texto clave, identificando elementos como el Nombre de la Carta y el posible idioma.
      - Estructuración (JSON): Los resultados del análisis (texto extraído y coordenadas espaciales) se compilan en un archivo formato JSON.
      - Almacenamiento de Metadatos: Este archivo JSON resultante se guarda en un segundo Bucket de AWS S3, destinado a los resultados de IA, manteniendo una separación clara entre la imagen cruda y los datos procesados.


   3. Búsqueda de la Carta y Lógica de Negocio

      - El núcleo lógico del sistema utiliza los datos extraídos para obtener información enriquecida de fuentes externas.
      - Consulta Inicial: El Backend lee el JSON del bucket S3 y utiliza el texto extraído para formular una petición (query) a la API pública de Scryfall.
      - Gestión de Excepciones y Reintentos:
           En caso de que la búsqueda inicial falle (debido a errores de OCR o cartas en idiomas distintos al inglés), el sistema ejecuta el siguiente protocolo:
            + Fallo de Búsqueda: La API de Scryfall no devuelve resultados con el texto original.
            + Traducción Automática: El Backend detecta el idioma (posiblemente vía Amazon Translate) y traduce el nombre de la carta al inglés (idioma nativo de la base de datos de Scryfall).
            + Segundo Intento: Se lanza una nueva consulta a la API con el nombre traducido.
            + Fallo Definitivo: Si la búsqueda en inglés también falla, el sistema genera un objeto predefinido de "Carta no Encontrada" o un objeto vacío para evitar errores en el cliente.


   4. Finalización y Presentación de Datos
      - La etapa final prepara la información para que sea consumida por el usuario final.
      - Normalización de Datos: El Backend recibe la respuesta cruda de Scryfall y aplica un proceso de formateo: limpia campos, estandariza estructuras y selecciona solo la información relevante.
      - Entrega al Cliente: La información procesada se envía de vuelta al Frontend en formato JSON.
      - Visualización: El Frontend renderiza los datos, mostrando al usuario la imagen de la carta junto con sus detalles técnicos, precios y reglas actualizadas
