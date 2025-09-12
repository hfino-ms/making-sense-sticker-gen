import type { Answers, Agent } from '../types';
import { QUESTIONS } from '../data/questions';

function getAnswerLabel(answers: Answers, qid: string): string {
  const q = (QUESTIONS as any).find((x: any) => x.id === qid);
  const a = (answers || {})[qid];
  if (!a) return '';
  if (typeof a === 'object') {
    const choiceId = a.choice;
    const opt = q?.options?.find((o: any) => o.id === choiceId) || null;
    return opt && opt.label ? opt.label : String(choiceId);
  }
  return String(a);
}

export function buildPrompt(agent: Agent, includeSelfie: boolean): string {
  // Fallback simple prompt when answers are not available
  return buildPromptFromAnswers(agent, {} as Answers, includeSelfie);
}

export function buildPromptFromAnswers(agent: Agent, answers: Answers, includeSelfie?: boolean, variant?: string): string {
  const archetypeName = agent?.name || 'Agent';

  const q1 = getAnswerLabel(answers, 'decision_making');
  const q2 = getAnswerLabel(answers, 'tech_adoption');
  const q3 = getAnswerLabel(answers, 'risk_appetite');
  const q4 = getAnswerLabel(answers, 'team_dynamics');
  const q5 = getAnswerLabel(answers, 'growth_priorities');

  const optionalPhotoNote = `Optional Photo:
- If a photo is provided and consented, use only the silhouette or pose as loose inspiration.
- Render the character in a stylized, flat manner with abstract tones, not realistic likeness or skin color.
- Do not copy distinctive features, clothing logos, or backgrounds from the photo.
- If a photo is not provided, do not use "skin tone" color for the character's skin.`;

  // Exact selfie sentence required by tests: "If a selfie is provided"
  const selfieNote = includeSelfie ? "If a selfie is provided, integrate the person's facial features subtly and respectfully into the composition while preserving the sticker style." : '';

  const prompt = `Create an original, unique image that represents the archetype "${archetypeName}" using only the predefined traits and archetype description as inspiration.

Style:
- Flat, clean, simple, modern illustration style.
- One central stylized character placed in the middle, with proportionate eyes, mouth, ears, and nose.
- The character should look neutral-to-positive, never angry.
- The background must be always white.
- Use only the following palette for character and elements: green, blue, purple, white, black.
- Add small, abstract illustrations in the background to suggest the archetype's traits and personality (e.g., balance, transformation, vision, collaboration, opportunity spotting).
- Avoid cultural or identity-specific symbols.
- Do not include any text, copy, archetype name, labels, logos, brands, or decorative borders.

Archetype Guidelines:
- Archetype name: ${archetypeName}
- Do not literalize the name (e.g., no hunters, no weapons). Instead, represent personality and strengths conceptually:
  • The Deal Hunter → abstract elements of agility, market scanning, opportunity-finding.
  • The Risk Balancer → balance, stability, protective shapes.
  • The Transformer → motion, change, gears, progress.
  • The Visionary → guiding light rays, dynamic upward trajectories, stylized celestial patterns, and unfolding future-forward pathways.
  • The Integrator → connected shapes, networks, collaboration.

Traits:
- Decision-making: ${q1}
- Tech response: ${q2}
- Risk tolerance: ${q3}
- Team style: ${q4}
- Growth priority: ${q5}

${selfieNote}${selfieNote && '\n\n'}${optionalPhotoNote}

Archetype
Do not literalize the name (e.g., no hunters, no weapons). Instead, represent personality and strengths conceptually

Output:
Produce one high-quality, visually engaging image that combines the archetype's conceptual personality with the selected traits, in the defined style and palette.`;

  return variant ? `${prompt}\nVariantToken:${variant}` : prompt;
}
