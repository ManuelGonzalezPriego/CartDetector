import { useState, useEffect } from 'react';
import CameraUpload from "../components/CamarUpload"; 
import Cards from "../components/Card";
import { getAllCards } from "../services/api"; 
import type { Card } from "../interfaces/Card"; 

export default function Home() {
    const [detectedCards, setDetectedCards] = useState<Card[]>([]);

    // Carga inicial del historial
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const history = await getAllCards();
                if (history && Array.isArray(history)) {
                    setDetectedCards(history);
                }
            } catch (error) {
                console.error(error);
            }
        };
        loadHistory();
    }, []);

    const handleDetection = (newCards: Card[]) => {
        setDetectedCards(prevCards => [...prevCards, ...newCards]); 
    };

    return (
        <div className="flex flex-col lg:flex-row gap-4 p-4 bg-purple-950 min-h-screen">
            <div className="lg:w-1/3">
                <CameraUpload onDetection={handleDetection} /> 
            </div>
            
            <div className="lg:w-2/3">
                <Cards detectedCards={detectedCards} />
            </div>
        </div>
    );
}