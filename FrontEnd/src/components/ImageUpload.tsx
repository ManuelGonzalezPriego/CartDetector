import React, { useState } from "react";
import type { DetectedText } from "../interfaces/DetectedText";
import type { ImageUploadProps } from "../interfaces/ImageUploadProps";



export default function ImageUpload({ onResult }: ImageUploadProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        if (file) {
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            const res = await fetch("http://localhost:5000/api/analyze-text", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Error subiendo la imagen");

            const data = await res.json();
            onResult(data.detected_texts as DetectedText[]);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            {preview && <img src={preview} alt="Preview" width={300} />}
            <button onClick={handleUpload} disabled={!selectedFile}>
                Analizar
            </button>
        </div>
    );
}
