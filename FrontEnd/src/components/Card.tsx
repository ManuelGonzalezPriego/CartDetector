import { useEffect, useState, useRef } from "react";
import type { Card } from "../interfaces/Card";
import { searchScryfall, type ScryfallCardData } from "../services/scryfall";

interface MatchedCard extends Card {
    scryfallData: ScryfallCardData | null; // Permitimos null para mostrar errores visuales
}

interface CardsProps {
    detectedCards: Card[]; 
}

export default function Cards({ detectedCards }: CardsProps) {
    const [matchedCards, setMatchedCards] = useState<MatchedCard[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    
    const processedFiles = useRef(new Set<string>());

    const cleanCardName = (text: string): string => {
        if (!text) return "";
        return text.split(/[,:.]/)[0].trim();
    };

    useEffect(() => {
        const fetchNewCards = async () => {
            // Filtro de seguridad: procesamos si no está en el Set O si el Set está vacío (primer carga)
            const newCardsToProcess = detectedCards.filter(card => {
                if (!card.file) return true; // Si no hay archivo, procesar siempre por seguridad
                return !processedFiles.current.has(card.file);
            });

            if (newCardsToProcess.length === 0) return;

            setIsSearching(true);

            for (const card of newCardsToProcess) {
                if (card.file) processedFiles.current.add(card.file);

                const originalClean = cleanCardName(card.original_text);
                const translatedClean = cleanCardName(card.translated_text);

                let scryfallData: ScryfallCardData | null = null;

                // Intento 1: Texto Original
                if (originalClean) {
                    scryfallData = await searchScryfall(originalClean);
                }
                // Intento 2: Texto Traducido
                if (!scryfallData && translatedClean && originalClean !== translatedClean) {
                    scryfallData = await searchScryfall(translatedClean);
                }

                

                setMatchedCards(prev => {
                    // Evitar duplicados visuales exactos si ya existen
                    const exists = prev.some(c => c.file === card.file && c.original_text === card.original_text);
                    if (exists) return prev;
                    // Añadimos la nueva carta AL PRINCIPIO
                    return [{ ...card, scryfallData }, ...prev];
                });
            }
            
            setIsSearching(false);
        };

        fetchNewCards();
    }, [detectedCards]);

    return (
        <div className="relative bg-gray-800 rounded-xl shadow-2xl h-full min-h-[400px] max-h-[80vh] border border-purple-800/50 flex flex-col overflow-hidden">
            
            <div className="sticky top-0 z-40 bg-gray-800 border-b border-purple-600 p-4 shadow-md">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        Colección ({matchedCards.length})
                    </h2>
                    
                    {isSearching && (
                        <div className="flex items-center gap-2 text-sm text-purple-300 bg-purple-900/50 px-3 py-1 rounded-full animate-pulse">
                            <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                            Buscando...
                        </div>
                    )}
                </div>
            </div>

            <div className="overflow-y-auto p-4 flex-grow custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {matchedCards.map((card, index) => (
                        <div key={`${card.file}-${index}`} className="bg-gray-700 p-3 rounded-xl shadow-lg border-t-4 border-purple-500 animate-fade-in hover:scale-[1.02] transition-transform duration-200">
                            <h3 className="text-md font-bold text-purple-300 mb-2 truncate" title={card.scryfallData?.name}>
                                {card.scryfallData?.name || "Sin nombre"}
                            </h3>
                            
                            <div className="relative aspect-[2.5/3.5] w-full overflow-hidden rounded-lg bg-black shadow-inner group">
                                 <img 
                                    src={card.scryfallData?.image_uris?.normal} 
                                    alt={card.scryfallData?.name} 
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                                
                            </div>
                            
                            <div className="mt-3 pt-2 border-t border-gray-600 text-xs text-gray-400 flex justify-between">
                                <span className="truncate max-w-[80%] text-white" title={card.original_text}>
                                    OCR: {cleanCardName(card.original_text) || "..."}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
                
                {!isSearching && matchedCards.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500 opacity-60">
                        <p className="text-lg font-medium">Lista vacía</p>
                        <p className="text-sm">Escanea una carta para comenzar</p>
                    </div>
                )}
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(147, 51, 234, 0.3); border-radius: 10px; }
            `}</style>
        </div>
    );
}