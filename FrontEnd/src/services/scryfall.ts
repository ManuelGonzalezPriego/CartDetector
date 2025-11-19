
// Interfaz para los datos que nos importan de Scryfall
export interface ScryfallCardData {
    name: string;
    image_uris: {
        normal: string;
    };
}

export async function searchScryfall(cardName: string): Promise<ScryfallCardData | null> {
    // Usamos 'fuzzy' para permitir coincidencias aproximadas
    const apiURL = `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cardName)}`;
    
    try {
        const response = await fetch(apiURL);

        if (response.status === 404) {
            // La carta no fue encontrada con ese nombre
            return null;
        }

        if (!response.ok) {
            // Manejar otros errores HTTP (ej. 500)
            throw new Error(`Error en Scryfall: ${response.statusText}`);
        }

        const data: ScryfallCardData = await response.json();
        return data;

    } catch (error) {
        console.error(`Error buscando "${cardName}" en Scryfall:`, error);
        return null;
    }
}