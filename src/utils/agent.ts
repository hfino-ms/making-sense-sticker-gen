import type { Answers } from '../types';

export type AgentKey = 'deal_hunter' | 'risk_balancer' | 'transformer' | 'visionary' | 'integrator';

export const AGENT_DISPLAY: Record<AgentKey, string> = {
  deal_hunter: 'The Deal Hunter',
  risk_balancer: 'The Risk Balancer',
  transformer: 'The Transformer',
  visionary: 'The Visionary',
  integrator: 'The Integrator',
};

export const AGENT_META: Record<AgentKey, { descriptor: string; valueLine: string }> = {
  deal_hunter: { descriptor: 'You pursue high-opportunity deals with speed and conviction.', valueLine: 'You move fast to capture market openings.' },
  risk_balancer: { descriptor: 'You prioritize stability and measured decisions.', valueLine: 'You balance risk and return with prudence.' },
  transformer: { descriptor: 'You focus on operational excellence and scaling.', valueLine: 'You transform businesses through systems and process.' },
  visionary: { descriptor: 'You imagine and build future-defining products.', valueLine: 'You drive growth through vision and innovation.' },
  integrator: { descriptor: 'You strengthen teams and operational capabilities.', valueLine: 'You align people and processes to execute strategy.' },
};

// Question order matters for tiebreaker
const QUESTION_ORDER = [
  'decision_making',
  'tech_adoption',
  'risk_appetite',
  'team_dynamics',
  'growth_priorities',
];

// Scoring rules mapping question id -> option id -> agent keys to increment
const SCORING: Record<string, Record<string, AgentKey[]>> = {
  decision_making: {
    data_driven: ['risk_balancer', 'transformer'],
    hybrid: ['deal_hunter', 'risk_balancer'],
    balanced_mix: ['visionary', 'integrator'],
    intuition: ['deal_hunter', 'visionary'],
  },
  tech_adoption: {
    disruptor: ['deal_hunter', 'visionary'],
    tester: ['deal_hunter', 'transformer'],
    observer: ['risk_balancer', 'integrator'],
    late_adopter: ['risk_balancer'],
  },
  risk_appetite: {
    high: ['visionary', 'deal_hunter'],
    moderate_high: ['transformer', 'visionary'],
    moderate_low: ['integrator', 'risk_balancer'],
    low: ['risk_balancer'],
  },
  team_dynamics: {
    hands_on: ['transformer'],
    collaborative: ['transformer', 'integrator'],
    advisory: ['risk_balancer', 'integrator'],
    delegative: ['integrator'],
  },
  growth_priorities: {
    operational_efficiency: ['transformer', 'risk_balancer'],
    market_expansion: ['deal_hunter', 'visionary'],
    innovation: ['visionary'],
    talent_strengthening: ['integrator'],
  },
};

export function determineAgent(answers: Answers) {
  // Initialize scores
  const scores: Record<AgentKey, number> = {
    deal_hunter: 0,
    risk_balancer: 0,
    transformer: 0,
    visionary: 0,
    integrator: 0,
  };

  // Track which question contributed to which agent (for tiebreaker)
  const contributions: Record<string, Set<AgentKey>> = {};

  for (const q of QUESTION_ORDER) {
    const ans = answers[q]?.choice;
    if (!ans) continue;
    const mapping = SCORING[q] || {};
    const agents = mapping[ans] || [];
    contributions[q] = new Set(agents);
    for (const a of agents) scores[a] = (scores[a] || 0) + 1;
  }

  // Find max score
  let maxScore = -Infinity;
  for (const k of Object.keys(scores) as AgentKey[]) {
    if (scores[k] > maxScore) maxScore = scores[k];
  }

  // Candidates with max score
  const candidates = (Object.keys(scores) as AgentKey[]).filter(k => scores[k] === maxScore);

  if (candidates.length === 1) {
    const key = candidates[0];
    return { key, name: AGENT_DISPLAY[key], scores };
  }

  // Tie-breaker: iterate questions in order and see which candidate(s) got a point for that question
  for (const q of QUESTION_ORDER) {
    const contrib = contributions[q] || new Set<AgentKey>();
    // intersect contrib with candidates
    const intersects = candidates.filter(c => contrib.has(c));
    if (intersects.length === 1) {
      const key = intersects[0];
      return { key, name: AGENT_DISPLAY[key], scores };
    }
    if (intersects.length > 1) {
      // reduce candidates to intersects and continue to next question
      candidates.splice(0, candidates.length, ...intersects);
    }
  }

  // If still tied, pick deterministic first by candidate order: deal_hunter, risk_balancer, transformer, visionary, integrator
  const order: AgentKey[] = ['deal_hunter', 'risk_balancer', 'transformer', 'visionary', 'integrator'];
  for (const o of order) if (candidates.includes(o)) return { key: o, name: AGENT_DISPLAY[o], scores };

  // Fallback
  return { key: 'transformer' as AgentKey, name: AGENT_DISPLAY.transformer, scores };
}

export function exportAgentResult(answers: Answers) {
  const result = determineAgent(answers);
  return { agent: { key: result.key, name: result.name }, answers };
}
