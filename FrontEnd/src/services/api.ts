import type { Card } from "../interfaces/Card";

export async function analyzeText(file: File): Promise<Card> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://localhost:5000/api/analyze-text", {
        method: "POST",
        body: formData,
    });

    if (!res.ok) throw new Error("Error subiendo la imagen");

    // Devolvemos el JSON, que ahora es directamente una Card
    const data: Card = await res.json();
    
    // Si tu lógica asume que puede haber un error o no-Card, podrías revisarlo aquí
    if ('error' in data) {
        throw new Error(`API Error: ${data.error}`);
    }
    
    return data; 
}

export async function getAllCards(): Promise<Card[]> {
    const res = await fetch("http://localhost:5000/api/get_all_cards", {
        method: "GET"
    });

    if (!res.ok) throw new Error("Error al obtner los datos de las imagenes");
    const data:Card[] = await res.json();

    return data;
}

export async function getCardsByName(name:String): Promise<Card[]> {
    const res = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${name}`, {
        method: "GET"
    });

    if (!res.ok) throw new Error("Error al obtner los datos de las imagenes");
    
    const data:Card[] = await res.json();
    return data;
}


