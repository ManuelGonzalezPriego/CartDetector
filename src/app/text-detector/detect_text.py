import numpy as np
import cv2

def anonymize_face(buffer,response):
    # Leer la imagen del buffer
    nparr = np.fromstring(buffer, np.uint8)

    img = cv2.imdecode(nparr,cv2.IMREAD_COLOR)

    height, width, _ = img.shape

    for faceDetail in response['FaceDetails']:
        box = faceDetail['BoundingBox']
        x = int(width * box['Left'])
        y = int(height * box['Top'])
        w = int(width * box['Width'])
        h = int(height * box['Height'])

        # Obtener region of interest (ROI)
        roi = img[y:y+h, x:x+w]

        # Aplicamos filtro gausiano
        roi = cv2.GaussianBlur(roi, (83, 83), 30)

        # Para mantener proporciones usamos y de roi y x de roi, ya que estos se encuentran en la poss 0 y 1 de la matriz
        img[y:y+roi.shape[0], x:x+roi.shape[1]] = roi

    print("La tarea de difunidado se a realiado con exito")

    # Encode image and return image with blurred faces es decir pasamos de matriz a imagen normal
    _, res_buffer = cv2.imencode('.jpg', img)
    return res_buffer