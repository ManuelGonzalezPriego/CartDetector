import type { DetectedText } from '../interfaces/DetectedText';

export default function DetectedTextList({ texts }: { texts: DetectedText[] }) {
  if (!texts || texts.length === 0) return null;

  return (
    <ul>
      {texts.map((item, index) => (
        <li key={index}>
          <strong>{item.Text}</strong> - {item.Confidence.toFixed(2)}% ({item.Type})
        </li>
      ))}
    </ul>
  );
}