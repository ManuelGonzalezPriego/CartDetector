import { useRef, useState, useEffect, useCallback } from "react";
import { analyzeText } from "../services/api";
import type { Card } from "../interfaces/Card";

interface CameraCaptureProps {
    onDetection: (detectedCards: Card[]) => void;
}

export default function CameraCaptureComponent({ onDetection }: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [facingMode,] = useState<"user" | "environment">("environment");
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const displayMessage = useCallback((text: string, duration: number = 3000) => {
        setMessage(text);
        setTimeout(() => setMessage(null), duration);
    }, []);

    const startCamera = useCallback(async () => {
        if (!navigator.mediaDevices || !videoRef.current) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: isMobile ? { facingMode: facingMode } : true,
            });
            videoRef.current.srcObject = stream;
            videoRef.current.play();
        } catch (err) {
            console.error(err);
        }
    }, [isMobile, facingMode]);

    useEffect(() => {
        setIsMobile(/Mobi|Android/i.test(navigator.userAgent));
    }, []);

    useEffect(() => {
        startCamera();
    }, [facingMode, isMobile, startCamera]);

    const takePhoto = () => {
        if (!canvasRef.current || !videoRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        setLoading(true);
        
        canvas.toBlob(async (blob) => {
            if (!blob) {
                setLoading(false);
                return;
            }
            
            const fileName = `photo${Date.now()}.jpg`;
            const file = new File([blob], fileName, { type: "image/jpeg" });

            try {
                // analyzeText ya devuelve un objeto Card simple
                const newCard = await analyzeText(file); 
                
                // Si la Card se recibió correctamente (y no tiene un error)
                if (newCard && newCard.original_text) { 
                    displayMessage("¡Imagen procesada!");
                    
                    // onDetection espera un array de Cards, así que pasamos [newCard]
                    onDetection([newCard]); // <-- CAMBIO CLAVE: Envía el objeto en un array
                } else {
                    // Si el back-end devolvió algo sin original_text (ej: 'No text detected')
                    displayMessage("No se detectó texto legible o el servidor falló en el formato.");
                }

			} catch (err) {
				displayMessage("Error al conectar con el servidor.");
				console.error(err);
			} finally {
                setLoading(false);
            }
        }, "image/jpeg", 0.9);
    };

    return (
        <div className="flex flex-col items-center p-4 bg-gray-800 rounded-xl shadow-2xl border border-purple-800/50 relative">
             <h2 className="text-xl font-bold mb-4 text-white border-b border-purple-600 pb-2 w-full text-center">Captura de Carta</h2>
            
            <div className="relative w-full max-w-lg aspect-video overflow-hidden rounded-xl shadow-2xl border-2 border-gray-700 mb-6">
                <video ref={videoRef} className="w-full h-full object-cover bg-black" autoPlay playsInline muted />
                
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <button 
                        onClick={takePhoto} 
                        disabled={loading} 
                        className="w-16 h-16 bg-purple-600 rounded-full border-4 border-white flex items-center justify-center shadow-lg hover:bg-purple-700 active:scale-95 disabled:opacity-50 transition-all"
                    >
                        {loading ? <span className="animate-spin h-6 w-6 border-4 border-white border-t-transparent rounded-full"></span> : <span className="text-white text-2xl"></span>}
                    </button>
                </div>
            </div>

            {message && (
                <div className="fixed top-20 right-4 md:right-10 bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl z-[9999] animate-bounce font-bold border-2 border-white">
                    {message}
                </div>
            )}
             <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}