import type { DetectedText } from "./DetectedText";

export interface ImageUploadProps {
  onResult: (texts: DetectedText[]) => void;
}