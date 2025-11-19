import type { ScryfallCardData } from "../services/scryfall";
import type { Card } from "./Card";

export interface MatchedCard extends Card {
    scryfallData: ScryfallCardData | null; // Permitimos null para mostrar errores visuales
}

export interface CardsProps {
    detectedCards: Card[]; 
}