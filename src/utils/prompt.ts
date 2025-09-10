import { QUESTIONS } from '../data/questions';
import type { Answers, Archetype } from '../types';

export function buildPrompt(archetype: Archetype, includeSelfie: boolean): string {
  // Updated prompt with new specifications
  const base = `Create an original, unique sticker that embodies the concept "${archetype.name}". Avoid using 
- any label 
- any text into the image
- white borders
- transparent background
Produce a high-quality, visually engaging sticker concept — be creative with composition, colors should be green, blue, purple, white and black
The design should feature a character in the middle with small illustrations in the background. The character should have proportionally sized eyes, mouth, ears, and nose on its face. The background should fill the complete image and should be only one color. The style should be clean, simple, flat, with no text on it.`;
  const selfie = includeSelfie
    ? " If a selfie is provided, integrate the person's facial features subtly and respectfully into the composition while preserving the sticker style; do not crop the person with circular masks."
    : '';
  return base + selfie;
}

export function buildPromptFromAnswers(archetype: Archetype, answers: Answers, variant?: string): string {
  // Build concise prompt from archetype + answers (avoid verbose robot-specific templates)
  const traits: string[] = [];
  for (const q of QUESTIONS) {
    const a = answers[q.id];
    if (a) {
      const opt = q.options.find(o => o.id === a.choice);
      const label = opt ? opt.label : String(a.choice);
      traits.push(`${q.title}: ${label}`);
    }
  }

  const traitsLine = traits.length ? `Traits: ${traits.join('; ')}.` : '';

  let prompt = `Create an original, unique sticker that embodies the concept "${archetype.name}". Avoid using 
- any label 
- any text into the image
- white borders
- transparent background
Draw inspiration from the following traits: ${traitsLine} 
Produce a high-quality, visually engaging sticker concept — be creative with composition, colors should be green, blue, purple, white and black
The design should feature a character in the middle with small illustrations in the background. The character should have proportionally sized eyes, mouth, ears, and nose on its face. The background should fill the complete image and should be only one color. The style should be clean, simple, flat, with no text on it.`;

  if (variant) prompt += ` VariantToken:${variant}`;
  return prompt;
}
