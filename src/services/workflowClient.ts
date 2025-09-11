import { exportAgentResult } from '../utils/agent';
import { QUESTIONS } from '../data/questions';

export async function preparePromptAndAgent(answers: any, includeSelfie?: boolean) {
  // Determine agent from answers
  const ar = exportAgentResult(answers || {});

  // Build traits line from answers (same logic as src/utils/prompt.ts)
  const traits: string[] = [];
  for (const q of QUESTIONS) {
    const a = answers[q.id];
    if (a) {
      const opt = q.options?.find((o: any) => o.id === a.choice);
      const label = opt ? opt.label : String(a.choice);
      traits.push(`${q.title.split('\n')[0]}: ${label}`);
    }
  }

  const traitsLine = traits.length ? `Traits: ${traits.join('; ')}.` : '';
  let prompt = `Create an original, unique sticker that embodies the concept \"${ar.agent?.name || 'Agent'}\". Draw inspiration from: ${traitsLine} Keep the style clean, flat, and character-focused.`;
  if (includeSelfie) {
    prompt += " If a selfie is provided, integrate the person's facial features subtly and respectfully into the composition while preserving the sticker style.";
  }

  return { agent: ar.agent, prompt };
}

export async function generateAndCompose(agent: any, survey: any, photo?: string) {
  const { generateStickerAndCompose } = await import('./stickerClient');
  return generateStickerAndCompose({ agent, survey, photo });
}

export async function submitComposed({ email, name, timestamp, agent, survey, photo, composedDataUrl, filename }: { email:string; name:string; timestamp:string; agent:any; survey:any; photo?:string; composedDataUrl:string; filename?:string }) {
  const { uploadComposedToServer } = await import('./submitClient');
  return uploadComposedToServer({ email, name, timestamp, agent, survey, photo, composedDataUrl, filename });
}
