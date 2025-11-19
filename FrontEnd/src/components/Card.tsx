import { useEffect, useState } from "react";
import type { Card } from "../interfaces/Card";
import { getAllCards } from "../services/api";
import { searchScryfall, type ScryfallCardData } from "../services/scryfall"; // 💡 NUEVA IMPORTACIÓN DEL SERVICIO

// 💡 Interfaz extendida para la carta que se mostrará en el frontend
interface MatchedCard extends Card {
    scryfallData: ScryfallCardData; // Datos de Scryfall (imagen, estilo, etc.)
}

export default function Cards() {

    const [detectedCards, setDetectedCards] = useState<Card[]>([]);
    const [matchedCard, setMatchedCard] = useState<MatchedCard | null>(null); // 💡 NUEVO ESTADO para la carta encontrada

    useEffect(() => {
        cargarDetecciones();
    }, []);

    async function cargarDetecciones() {
        try {
            const loadedCards = await getAllCards(); // { file, original_text, translated_text, ... }
            setDetectedCards(loadedCards);
            // Intenta buscar la primera carta detectada tan pronto como se carguen
            if (loadedCards.length > 0) {
                // Solo buscamos la primera por ahora
                for (const card of loadedCards) {
                    await searchCardInApi(card);
                }
            }

        } catch (error) {
            console.error("Fallo al cargar las tarjetas:", error);
        }
    }

    // 💡 FUNCIÓN CLAVE: Lógica de búsqueda con fallback (Scryfall)
    async function searchCardInApi(detectedCard: Card) {
        
        const originalText = detectedCard.original_text;
        const translatedText = detectedCard.translated_text;
        
        let scryfallData: ScryfallCardData | null = null;

        // 1. INTENTO: Buscar con el texto ORIGINAL (puede estar en español)
        scryfallData = await searchScryfall(originalText);

        // 2. FALLBACK: Si no se encuentra y la traducción es diferente, intentar con la TRADUCCIÓN (inglés)
        if (!scryfallData && originalText !== translatedText) {
            console.log(`No encontrado. Intentando buscar con traducción: ${translatedText}`);
            scryfallData = await searchScryfall(translatedText);
        }

        // 3. Establecer el resultado
        if (scryfallData) {
            
            // Combinar los datos de la detección con los datos de Scryfall
            const fullCard: MatchedCard = {
                ...detectedCard,
                scryfallData: scryfallData 
            };
            setMatchedCard(fullCard);
        } else {
            console.log(`No se encontró ninguna carta para: ${originalText}`);
            setMatchedCard(null);
        }
    }
    
    // Aquí puedes añadir tu JSX para renderizar la MatchedCard
    // ...
    return (
        <div>
            <h2>Tarjetas Detectadas</h2>
            {/* Mostrar información de la búsqueda */}
            {matchedCard ? (
                <div>
                    <img 
                        src={matchedCard.scryfallData.image_uris.normal} 
                        alt={matchedCard.scryfallData.name} 
                        style={{ maxWidth: '300px' }} 
                    />
                </div>
            ) : (
                <p>Buscando o no se encontró ninguna carta...</p>
            )}
        </div>
    );
}