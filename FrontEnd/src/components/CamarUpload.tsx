import { useRef, useState, useEffect } from "react";
import { analyzeText, getAllCards } from "../services/api";
import type { DetectedText } from "../interfaces/DetectedText";
import type { Card } from "../interfaces/Card";
export default function CameraCapture() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [camera, setCamera] = useState<"user" | "environment">("environment");
  const [message, setMessage] = useState<string | null>(null);
  const [results, setResults] = useState<DetectedText[]>([]);
  const [loading, setLoading] = useState(false);
  // Detectar si es móvil
  useEffect(() => {
    setIsMobile(/Mobi|Android/i.test(navigator.userAgent));
    startCamera();
  }, []);

  // Encender la cámara
  const startCamera = async () => {
    if (!navigator.mediaDevices || !videoRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isMobile ? { facingMode: camera } : true,
      });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    } catch (err) {
      console.error(err);
      setMessage("No se pudo acceder a la cámara");
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Tomar foto y enviar al backend
  const takePhoto = () => {
    if (!canvasRef.current || !videoRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);

    setLoading(true);

    canvasRef.current.toBlob(async (blob) => {
      if (!blob) {
        setMessage("Error capturando la imagen");
        setLoading(false);
        setTimeout(() => setMessage(null), 3000);
        return;
      }

      const file = new File([blob], `photo${Date.now()}.jpg`, { type: "image/jpeg" });

      try {
        const data = await analyzeText(file);

        if (data && Array.isArray(data.detected_texts)) {
          if (data.detected_texts.length > 0) {
            setMessage("Imagen subida y texto detectado correctamente");
            setResults(data.detected_texts);
          } else {
            setMessage("Imagen subida pero no se detectó texto");
            setResults([]);
          }
        } else {
          setMessage("Respuesta de la API no válida");
          setResults([]);
        }
      } catch (err) {
        console.error(err);
        setMessage("Error subiendo la imagen");
        setResults([]);
      } finally {
        setLoading(false);
        setTimeout(() => setMessage(null), 3000);
      }
    }, "image/jpeg");
  };

  return (
    <div>
      
      {isMobile && (
        <div style={{ marginBottom: 10 }}>
          <label>Seleccionar cámara: </label>
          <select
            value={camera}
            onChange={(e) =>
              setCamera(e.target.value as "user" | "environment")
            }
          >
            <option value="environment">Trasera</option>
            <option value="user">Delantera</option>
          </select>
        </div>
      )}

      <video
        ref={videoRef}
        style={{
          width: 300,
          marginTop: 10,
          border: "1px solid #ccc",
          backgroundColor: "#000",
        }}
      />

      <button
        onClick={takePhoto}
        disabled={loading}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginTop: 10,
          width: 70,
          height: 70,
          borderRadius: "50%",
          border: "none",
          backgroundColor: "#007bff",
          cursor: "pointer",
          position: "relative",
        }}
      >
        {loading && (
          <div
            style={{
              width: 30,
              height: 30,
              border: "4px solid rgba(255,255,255,0.3)",
              borderTop: "4px solid #fff",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
        )}
      </button>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      {message && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            backgroundColor: "#333",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: "8px",
            zIndex: 1000,
          }}
        >
          {message}
        </div>
      )}


      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg);}
          100% { transform: rotate(360deg);}
        }
      `}</style>
    </div>
  );
}
