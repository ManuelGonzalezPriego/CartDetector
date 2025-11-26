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
