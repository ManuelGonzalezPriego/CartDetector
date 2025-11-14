import { useRef, useState } from "react";
import { analyzeText } from "../services/api";
import type { DetectedText } from "../interfaces/DetectedText";

export default function CameraCapture() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [camera, setCamera] = useState<"user" | "environment">("environment");
  const [message, setMessage] = useState<string | null>(null);
  const [results, setResults] = useState<DetectedText[]>([]);
  const [loading, setLoading] = useState(false);
  const [streamStarted, setStreamStarted] = useState(false);

  // Encender la cámara
  const startCamera = async () => {
    if (!navigator.mediaDevices || !videoRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: camera },
      });

      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setStreamStarted(true);
    } catch (err) {
      console.error(err);
      setMessage("❌ No se pudo acceder a la cámara");
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

    setLoading(true); // Mover aquí para que se active antes del callback

    canvasRef.current.toBlob(async (blob) => {
      if (!blob) {
        setMessage("❌ Error capturando la imagen");
        setLoading(false);
        setTimeout(() => setMessage(null), 3000);
        return;
      }

      const file = new File([blob], "photo.jpg", { type: "image/jpeg" });

      try {
        const data = await analyzeText(file);

        if (data && Array.isArray(data.detected_texts)) {
          if (data.detected_texts.length > 0) {
            setMessage("✅ Imagen subida y texto detectado correctamente");
            setResults(data.detected_texts);
          } else {
            setMessage("⚠️ Imagen subida pero no se detectó texto");
            setResults([]);
          }
        } else {
          setMessage("❌ Respuesta de la API no válida");
          setResults([]);
        }
      } catch (err) {
        console.error(err);
        setMessage("❌ Error subiendo la imagen");
        setResults([]);
      } finally {
        setLoading(false);
        setTimeout(() => setMessage(null), 3000);
      }
    }, "image/jpeg");
  };

  return (
    <div>
      <div style={{ marginBottom: "10px" }}>
        <label>Seleccionar cámara: </label>
        <select
          value={camera}
          onChange={(e) => setCamera(e.target.value as "user" | "environment")}
        >
          <option value="environment">Trasera</option>
          <option value="user">Delantera</option>
        </select>
        <button
          onClick={startCamera}
          style={{ marginLeft: "10px", padding: "5px 10px" }}
        >
          {streamStarted ? "Reiniciar cámara" : "Iniciar cámara"}
        </button>
      </div>

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
        style={{ display: "block", marginTop: 10, padding: "5px 10px" }}
        disabled={loading}
      >
        {loading ? "Cargando..." : "Tomar foto"}
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

      {results.length > 0 && (
        <ul style={{ marginTop: 10 }}>
          {results.map((item, idx) => (
            <li key={idx}>
              <strong>{item.Text}</strong> - {item.Confidence.toFixed(2)}% (
              {item.Type})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
