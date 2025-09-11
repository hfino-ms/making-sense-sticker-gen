import fetch from 'node-fetch';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const body = req.body || {};
    const { agent, survey, variant } = body;

    if (!agent || !agent.name) return res.status(400).json({ error: 'Missing required field: agent.name' });

    const { getOpenAIKey } = await import('./services/configService.js');
    const OPENAI_KEY = getOpenAIKey();
    if (!OPENAI_KEY) return res.status(500).json({ error: 'Server missing OPENAI_API_KEY' });

    // Build a prompt inspired by the previous implementation
    const q1 = (survey && survey.answer_1) || '';
    const q2 = (survey && survey.answer_2) || '';
    const q3 = (survey && survey.answer_3) || '';
    const q4 = (survey && survey.answer_4) || '';
    const q5 = (survey && survey.answer_5) || '';

    let prompt = `Create an original, unique sticker that embodies the concept "${agent.name}". Avoid using any label, any text in the image, white borders, or transparent background. Draw inspiration from the following traits: When evaluating a potential investment, how do you typically approach decision-making?: ${q1}; When a new technology emerges in the market, how do you respond?: ${q2}; When considering a new opportunity, what best describes your risk tolerance?: ${q3}; When working with portfolio company teams, what's your default style?: ${q4}; When defining a growth plan for a portfolio company, which area do you prioritize first?: ${q5}. Produce a high-quality, visually engaging sticker concept — be creative with composition. Colors should be green, blue, purple, white and black. The design should feature a character in the middle with small illustrations in the background. The character should have proportionally sized eyes, mouth, ears, and nose on its face. The background should fill the complete image and should be only one color. The style should be clean, simple, flat, with no text on it.`;

    if (variant) prompt += ` VariantToken:${variant}`;

    const { generateImageFromPrompt } = await import('./services/openaiService.js');
    const photoData = body.photo || null;
    console.log('generate-sticker: photo present?', Boolean(photoData), 'length:', photoData ? String(photoData).length : 0);

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
    console.error('generate-sticker error', err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
}
