import { QUESTIONS } from '../data/questions';
import type { Answers, Archetype } from '../types';

export function buildPrompt(archetype: Archetype, includeSelfie: boolean): string {
  // Core prompt for gpt-image-1 generation: 2x2 inch sticker, no text, photorealistic/illustrative guidance
  const base = `Create a high-quality 2x2 inch sticker image (square) suitable for printing. The composition should be centered and fill the canvas. Use the following visual guidance: color palette - ${archetype.colorPalette}; background style - ${archetype.backgroundStyle}; subject - a ${archetype.robotType} in a ${archetype.robotPose}. Avoid any textual elements, labels, or logos in the image. Produce a single, clean image with no borders or rounded masks.`;
  const selfie = includeSelfie
    ? " If a selfie is provided, subtly integrate the person's facial features into the design (e.g., hairstyle or glasses) while keeping the overall sticker aesthetic and respecting likeness."
    : '';
  return base + selfie;
}

export function buildPromptFromAnswers(archetype: Archetype, answers: Answers, variant?: string): string {
  // Build human-readable answers summary
  const lines: string[] = [];
  for (const q of QUESTIONS) {
    const a = answers[q.id];
    if (a) {
      const opt = q.options.find(o => o.id === a.choice);
      const label = opt ? opt.label : String(a.choice);
      const intensity = a.intensity ? ` (intensity ${a.intensity}/10)` : '';
      lines.push(`${q.title}: ${label}${intensity}`);
    }
  }

  const inspiration = `Background / Color palette: ${archetype.colorPalette}. Background style: ${archetype.backgroundStyle}. Robot type: ${archetype.robotType}. Robot pose: ${archetype.robotPose}. Tone: ${archetype.descriptor} ${archetype.valueLine}`;

  // Build detailed prompt following the requested template, but do NOT include the archetype name literally and avoid textual elements in the image.
  let prompt = `Create a high-quality image of a futuristic robot sized 2x2 inches showcasing the following characteristics. Use the archetype traits as inspiration but do not mention the archetype name in the image or include any text in the design.

Primary description:
- A ${archetype.robotType} in a ${archetype.robotPose}.
- Visual texture and detail: metallic surfaces with ${archetype.backgroundStyle}, ${archetype.colorPalette} color accents.

Stylistic guidance and inspiration:
${inspiration}

Traits derived from responses: ${lines.join('; ')}.

Robot type / pose guidance:
- Visionary: looking ahead, viewfinder, connecting lines.
- Strategist: with gears, planning board.
- Innovator: gadgets and sparks of energy.
- Connector: antennas and subtle network icons.
- Trailblazer: holding a beacon or illuminating a path.

Texture and detail guidance:
- Metallic / smooth; sparks or glowing elements for energetic variants; network lines for connector-like variants.

Additional constraints:
- No text should appear anywhere in the image.
- Do not include or print the archetype name or any label.
- Focus on a clean composition suitable for a circular sticker.

Output: produce a single, high-quality image suitable for a 2x2 inch sticker.`;

  if (variant) prompt += ` VariantToken:${variant}`;
  return prompt;
}
