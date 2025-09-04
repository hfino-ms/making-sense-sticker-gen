import type { Answers, Archetype } from '../types';

const BASE_ARCHETYPES: Record<string, Omit<Archetype, 'name' | 'descriptor' | 'valueLine'>> = {
  Trailblazer: {
    backgroundStyle: 'neon gradient with subtle circuit patterns',
    robotType: 'sleek explorer android',
    robotPose: 'dynamic forward-leaning stance',
    colorPalette: 'electric blue, vibrant violet, and white',
  },
  Strategist: {
    backgroundStyle: 'geometric grid with depth and soft glow',
    robotType: 'analytical advisor bot',
    robotPose: 'confident hands-on-hips stance',
    colorPalette: 'cool blues with soft indigo and white',
  },
  Collaborator: {
    backgroundStyle: 'soft mesh gradients with converging nodes',
    robotType: 'friendly companion robot',
    robotPose: 'welcoming wave',
    colorPalette: 'violet, blue, and soft white highlights',
  },
  Opportunist: {
    backgroundStyle: 'bold radial bursts with motion blur',
    robotType: 'agile scout bot',
    robotPose: 'ready-to-sprint stance',
    colorPalette: 'violet, magenta, and cool gray accents',
  },
};

export function deriveArchetype(answers: Answers): Archetype {
  const innovation = answers['innovation']?.choice;
  const risk = answers['risk']?.choice;
  const decision = answers['decision_style']?.choice;
  const collaboration = answers['collaboration']?.choice;
  const vision = answers['vision']?.choice;

  if (innovation === 'disruptive' && risk === 'high' && vision === 'industry_transformation') {
    return {
      name: 'Trailblazer',
      descriptor: 'You challenge the status quo and architect bold futures.',
      valueLine: 'You ignite industry shifts with decisive, high-impact moves.',
      ...BASE_ARCHETYPES.Trailblazer,
    };
  }

  if (decision === 'analytical' && (innovation === 'conservative' || vision === 'operational_efficiency')) {
    return {
      name: 'Strategist',
      descriptor: 'You optimize with precision and deliver measurable outcomes.',
      valueLine: 'You turn insight into systems that scale.',
      ...BASE_ARCHETYPES.Strategist,
    };
  }

  if (collaboration === 'team_player' || collaboration === 'xfunctional_lead') {
    return {
      name: 'Collaborator',
      descriptor: 'You align teams and amplify collective intelligence.',
      valueLine: 'You transform complexity into coordinated momentum.',
      ...BASE_ARCHETYPES.Collaborator,
    };
  }

  if (decision === 'opportunistic' || innovation === 'early_adopter') {
    return {
      name: 'Opportunist',
      descriptor: 'You spot openings early and move with speed.',
      valueLine: 'You convert emerging signals into advantage.',
      ...BASE_ARCHETYPES.Opportunist,
    };
  }

  // Balanced default: infer from risk
  if (risk === 'medium') {
    return {
      name: 'Strategist',
      descriptor: 'You optimize with precision and deliver measurable outcomes.',
      valueLine: 'You turn insight into systems that scale.',
      ...BASE_ARCHETYPES.Strategist,
    };
  }

  if (risk === 'low') {
    return {
      name: 'Collaborator',
      descriptor: 'You align teams and amplify collective intelligence.',
      valueLine: 'You transform complexity into coordinated momentum.',
      ...BASE_ARCHETYPES.Collaborator,
    };
  }

  return {
    name: 'Trailblazer',
    descriptor: 'You challenge the status quo and architect bold futures.',
    valueLine: 'You ignite industry shifts with decisive, high-impact moves.',
    ...BASE_ARCHETYPES.Trailblazer,
  };
}
