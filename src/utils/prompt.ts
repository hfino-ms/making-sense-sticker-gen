import { QUESTIONS } from '../data/questions';
import type { Answers, Agent } from '../types';

export function buildPrompt(agent: Agent, includeSelfie: boolean): string {
  const base = `Create an original, unique sticker that embodies the concept "${agent?.name || 'Agent'}". Avoid using any text, borders, or masks. Produce a clean, flat, character-focused sticker.`;
  const selfie = includeSelfie
    ? " If a selfie is provided, integrate the person's facial features subtly and respectfully into the composition while preserving the sticker style."
    : '';
  return base + selfie;
}

export function buildPromptFromAnswers(agent: Agent, answers: Answers, includeSelfie?: boolean, variant?: string): string {
  const traits: string[] = [];
  for (const q of QUESTIONS) {
    const a = answers[q.id];
    if (a) {
      const opt = q.options.find(o => o.id === a.choice);
      const label = opt ? opt.label : String(a.choice);
      traits.push(`${q.title.split('\n')[0]}: ${label}`);
    }
  }

  const traitsLine = traits.length ? `Traits: ${traits.join('; ')}.` : '';
  let prompt = `Create an original, unique sticker that embodies the concept "${agent?.name || 'Agent'}". Draw inspiration from: ${traitsLine} Keep the style clean, flat, and character-focused.`;
  if (includeSelfie) {
    prompt += " If a selfie is provided, integrate the person's facial features subtly and respectfully into the composition while preserving the sticker style.";
  }
  if (variant) prompt += ` VariantToken:${variant}`;
  return prompt;
}
