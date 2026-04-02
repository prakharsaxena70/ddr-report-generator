export function extractJsonFromText(rawText) {
  if (!rawText) {
    return null;
  }

  const fencedMatch = rawText.match(/```json\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1] : rawText;
  const trimmed = candidate.trim();
  const firstBrace = trimmed.indexOf("{");
  const firstBracket = trimmed.indexOf("[");

  let startIndex = -1;
  if (firstBrace === -1) {
    startIndex = firstBracket;
  } else if (firstBracket === -1) {
    startIndex = firstBrace;
  } else {
    startIndex = Math.min(firstBrace, firstBracket);
  }

  if (startIndex === -1) {
    return null;
  }

  const fragment = trimmed.slice(startIndex);
  for (let end = fragment.length; end > 0; end -= 1) {
    const segment = fragment.slice(0, end).trim();
    try {
      return JSON.parse(segment);
    } catch (_error) {
      continue;
    }
  }

  return null;
}
