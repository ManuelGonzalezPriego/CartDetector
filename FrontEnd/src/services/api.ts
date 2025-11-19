import type { Card } from "../interfaces/Card";

export async function analyzeText(file:File) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://localhost:5000/api/analyze-text", {
        method: "POST",
        body: formData,
    });

    if (!res.ok) throw new Error("Error subiendo la imagen");

    return res.json();
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


