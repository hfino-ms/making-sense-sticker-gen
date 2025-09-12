import fetch from "node-fetch";
import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });
  try {
    const body = req.body || {};
    const { agent, survey, variant } = body;

    if (!agent || !agent.name)
      return res
        .status(400)
        .json({ error: "Missing required field: agent.name" });

    const { getOpenAIKey } = await import("./services/configService.js");
    const OPENAI_KEY = getOpenAIKey();
    if (!OPENAI_KEY)
      return res.status(500).json({ error: "Server missing OPENAI_API_KEY" });

    // Build a prompt inspired by the previous implementation
    const q1 = (survey && survey.answer_1) || "";
    const q2 = (survey && survey.answer_2) || "";
    const q3 = (survey && survey.answer_3) || "";
    const q4 = (survey && survey.answer_4) || "";
    const q5 = (survey && survey.answer_5) || "";

    // Build unified prompt via shared utility to avoid duplication
    const { buildPromptShared } = await import('../src/utils/promptShared.js');
    const photoData = body.photo || null;
    const includeSelfie = Boolean(photoData);
    let prompt = buildPromptShared(agent.name, q1, q2, q3, q4, q5, includeSelfie, variant);

    if (variant) prompt += ` VariantToken:${variant}`;

    const { generateImageFromPrompt } = await import(
      "./services/openaiService.js"
    );
    console.log(
      "generate-sticker: photo present?",
      Boolean(photoData),
      "length:",
      photoData ? String(photoData).length : 0
    );

    try {
      const gen = await generateImageFromPrompt(prompt, OPENAI_KEY, photoData);
      // Return the raw generation result to the client for further composition
      return res.status(200).json({ ok: true, gen, photoReceived: Boolean(photoData), photoLength: photoData ? String(photoData).length : 0 });
    } catch (genErr) {
      console.error('generate-sticker: generation error', genErr);
      // Handle OpenAI billing or user errors gracefully
      const code = genErr?.code || genErr?.error?.code || null;
      const message = genErr?.message || genErr?.error?.message || 'Image generation failed';
      if (code === 'billing_hard_limit_reached' || /billing/i.test(message)) {
        return res.status(402).json({ error: 'OpenAI billing limit reached', code, message });
      }
      // For rate limits or bad requests surface proper status
      if (code === 'rate_limit_exceeded' || /rate limit/i.test(message)) {
        return res.status(429).json({ error: 'OpenAI rate limit exceeded', code, message });
      }
      // Otherwise return a generic 500 with minimal info
      return res.status(500).json({ error: message });
    }
  } catch (err) {
    console.error("generate-sticker error", err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
}
