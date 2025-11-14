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
