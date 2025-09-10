import { QUESTIONS } from '../data/questions';
import type { Answers, Archetype } from '../types';

export function buildPrompt(archetype: Archetype, includeSelfie: boolean): string {
  // Simplified and strict prompt to avoid rounded masks and unwanted decorations
  const base = `Create a high-quality 2x2 inch sticker image (square) that fills the canvas. Use color palette: ${archetype.colorPalette}. Background: ${archetype.backgroundStyle}. Subject inspiration: ${archetype.descriptor}. Do NOT include any text, logos, white borders, or rounded/circular masks. Produce a full-bleed square image suitable for printing.`;
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

  let prompt = `Create a single high-quality, square (1:1) sticker image sized for 2x2 inches. Use palette ${archetype.colorPalette} and background style ${archetype.backgroundStyle}. Visual tone: ${archetype.descriptor}. ${traitsLine} Do NOT include text, labels, borders, or rounded/circular masks. Output a full-bleed PNG suitable for printing.`;

  if (variant) prompt += ` VariantToken:${variant}`;
  return prompt;
}
