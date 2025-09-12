export function buildPromptShared(agentName, q1, q2, q3, q4, q5, includeSelfie, variant) {
  const optionalPhotoNote = `Optional Photo:
- If a photo is provided and consented, use only the silhouette or pose as loose inspiration.
- Render the character in a stylized, flat manner with abstract tones, not realistic likeness or skin color.
- Do not copy distinctive features, clothing logos, or backgrounds from the photo.
- If a photo is not provided, do not use "skin tone" color for the character's skin.`;

  const selfieNote = includeSelfie ? "If a selfie is provided, integrate the person's facial features subtly and respectfully into the composition while preserving the sticker style." : '';

  const prompt = `Create an original, unique image that represents the archetype "${agentName}" using only the predefined traits and archetype description as inspiration.

Style:
- Flat, clean, simple, modern illustration style.
- One central stylized character placed in the middle, with proportionate eyes, mouth, ears, and nose.
- The character should look neutral-to-positive, never angry.
- BACKGROUND REQUIREMENT: The background MUST be solid WHITE (#ffffff). Do NOT use gradients, textures, patterns, colored, transparent, or green backgrounds. This is essential for printing.
- Use only the following palette for character and elements: green, blue, purple, white, black. Use SUBDUED, desaturated tones—avoid oversaturated, neon, or highly saturated colors.
- Add small, abstract illustrations in the background to suggest the archetype's traits and personality (e.g., balance, transformation, vision, collaboration, opportunity spotting), but keep them minimal and lightly colored so they do not read as background color.
- Avoid cultural or identity-specific symbols.
- Do not include any text, copy, archetype name, labels, logos, brands, or decorative borders.

Archetype Guidelines:
- Archetype name: ${agentName}
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

Hard Requirements (must follow exactly):
- Background: SOLID WHITE only. No gradients, textures, or patterns.
- Colors: Avoid oversaturated/neon colors; prefer muted/desaturated tones for elements.
- No text, labels, logos, or decorative borders.
- Do not literalize archetype names into weapons, animals, or logos.

Output:
Produce one high-quality, visually engaging image that combines the archetype's conceptual personality with the selected traits, in the defined style and palette.`;

  return variant ? `${prompt}\nVariantToken:${variant}` : prompt;
}
