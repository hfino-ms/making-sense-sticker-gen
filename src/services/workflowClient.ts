import { exportAgentResult } from '../utils/agent';
import { buildPromptFromAnswers } from '../utils/prompt';

export async function preparePromptAndAgent(answers: any, includeSelfie?: boolean) {
  const ar = exportAgentResult(answers || {});
  const prompt = buildPromptFromAnswers(ar.agent, answers || {}, Boolean(includeSelfie));
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
