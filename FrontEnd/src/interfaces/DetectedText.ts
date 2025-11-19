import type { Card } from "./Card";

export interface DetectedText {
  file: string;
  detected_texts: Card[];
}