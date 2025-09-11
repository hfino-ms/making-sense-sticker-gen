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

    let prompt = `Create an original, unique image that represents the archetype "${agent.name}" using only the predefined traits and archetype description as inspiration.
Style:
- Flat, clean, simple, modern illustration style.
- One central stylized character placed in the middle, with proportionate eyes, mouth, ears, and nose.
- The character should look neutral-to-positive, never angry.
- The background must be a single solid color: white, blue, or purple.
- Use only the following palette for character and elements: green, blue, purple, white, black.
- Add small, abstract illustrations in the background to suggest the archetype's traits and personality (e.g., balance, transformation, vision, collaboration, opportunity spotting).
- Avoid cultural or identity-specific symbols.
- Do not include any text, copy, archetype name, labels, logos, brands, or decorative borders.
- Do not use transparent or green backgrounds.
Archetype Guidelines:
- Archetype name: ${agent.name}
- Do not literalize the name (e.g., no hunters, no weapons). Instead, represent personality and strengths conceptually:
  • The Deal Hunter → abstract elements of agility, market scanning, opportunity-finding.
  • The Risk Balancer → balance, stability, protective shapes.
  • The Transformer → motion, change, gears, progress.
  • The Visionary → guiding light rays, dynamic upward trajectories, stylized celestial patterns, and unfolding future-forward pathways.
  • The Integrator → connected shapes, networks, collaboration.
Traits (predefined inputs to inspire the concept):
- Decision-making: ${q1}
- Tech response: ${q2}
- Risk tolerance: ${q3}
- Team style: ${q4}
- Growth priority: ${q5}
Optional Photo:
- If a photo is provided and consented, use only the silhouette or pose as loose inspiration.
- Render the character in a stylized, flat manner with abstract tones, not realistic likeness or skin color.
- Do not copy distinctive features, clothing logos, or backgrounds from the photo.
- If a photo is not provided, do not use "skin tone" color for the character's skin.
Do not literalize the name (e.g., no hunters, no weapons). Instead, represent personality and strengths conceptually
Output:
Produce one high-quality, visually engaging image that combines the archetype's conceptual personality with the selected traits, in the defined style and palette.`;

    if (variant) prompt += ` VariantToken:${variant}`;

    const { generateImageFromPrompt } = await import(
      "./services/openaiService.js"
    );
    const photoData = body.photo || null;
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
