import type { Answers, Archetype } from '../types';

const API_KEY = import.meta.env.VITE_API_KEY_IMAGE_GENERATION as string | undefined;

async function callPaLM(promptText: string): Promise<string> {
  if (!API_KEY) throw new Error('No API key for LLM available');
  const url = `https://generativeai.googleapis.com/v1/models/text-bison-001:generateText?key=${API_KEY}`;
  const body = {
    prompt: { text: promptText },
    temperature: 0.7,
    maxOutputTokens: 800,
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`LLM error ${res.status} ${txt}`);
  }
  const data = await res.json();
  const content = data?.candidates?.[0]?.content;
  if (!content) throw new Error('LLM returned no content');
  return content;
}

function safeParseJsonFromString(s: string) {
  try {
    return JSON.parse(s);
  } catch (e) {
    // try to extract the first JSON object substring
    const match = s.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {}
    }
    throw new Error('Failed to parse JSON from LLM output');
  }
}

export async function generateArchetypeWithLLM(answers: Answers, variant?: string): Promise<{ archetype: Archetype; prompt: string }> {
  const lines = Object.entries(answers)
    .map(([k, v]) => `- ${k}: ${v.choice}${v.intensity ? ` (intensity: ${v.intensity})` : ''}`)
    .join('\n');
  const varNote = variant ? `StyleToken: ${variant}.` : '';

  const instruction = `You are an assistant that maps a user's short answers into a creative AI archetype and a short, creative image prompt for a circular sticker. ${varNote}

Be creative and free: do NOT produce rigid, prescriptive layout instructions. Instead, create a concise, imaginative prompt (1-2 sentences) that inspires diverse sticker outputs. The prompt should mention the archetype name and the general mood or palette inspiration derived from the user's answers, but leave detailed composition, background, and character interpretation to the image generator.

User answers (each includes optional intensity from 1-10):
${lines}

Return a JSON object ONLY with the following fields:
- name (string): short archetype name (e.g., "Trailblazer")
- descriptor (string): one-sentence descriptor
- valueLine (string): a short value/benefit line
- prompt (string): final short prompt (1-2 sentences) to send to an image generation API. Make it creative and non-prescriptive; the goal is to maximize visual variety across calls.

Example output (JSON):
{
  "name": "Trailblazer",
  "descriptor": "You challenge the status quo and architect bold futures.",
  "valueLine": "You ignite industry shifts with decisive, high-impact moves.",
  "prompt": "An expressive circular sticker evoking bold innovation and kinetic motion, featuring a charismatic futuristic explorer in electric blue and violet tones, with dynamic lighting and friendly personality."
}

Do not include any additional text outside the JSON object.`;

  const output = await callPaLM(instruction);
  const json = safeParseJsonFromString(output);

  // Validate minimal fields
  const required = ['name', 'descriptor', 'valueLine', 'backgroundStyle', 'robotType', 'robotPose', 'colorPalette', 'prompt'];
  for (const r of required) {
    if (!(r in json)) throw new Error(`LLM output missing field ${r}`);
  }

  const archetype: Archetype = {
    name: String(json.name),
    descriptor: String(json.descriptor),
    valueLine: String(json.valueLine),
    backgroundStyle: String(json.backgroundStyle),
    robotType: String(json.robotType),
    robotPose: String(json.robotPose),
    colorPalette: String(json.colorPalette),
  };

  return { archetype, prompt: String(json.prompt) };
}
