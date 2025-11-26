FROM python:3.11

# Establecemos el directorio de trabajo en /app
WORKDIR /src/app

# Copiamos requirements e instalamos
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /app/requirements.txt

# Copiamos la carpeta src entera dentro de /app/src
COPY src /app/src

# Configuración de entorno para Flask
ENV PYTHONPATH=/app/src
ENV FLASK_APP=app.text_detector.aplication
ENV FLASK_RUN_HOST=0.0.0.0

CMD ["flask", "run"]