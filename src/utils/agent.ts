import type { Answers } from '../types';
import { AGENT_COMBINATIONS } from '../data/agent-combinations';

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

// Question order is important for creating the lookup key.
const QUESTION_ORDER = [
  'decision_making',
  'tech_adoption',
  'risk_appetite',
  'team_dynamics',
  'growth_priorities',
];

export function determineAgent(answers: Answers) {
  const keyParts: string[] = [];
  for (const q of QUESTION_ORDER) {
    const choice = answers[q]?.choice;
    if (!choice) {
      // The UI should prevent this, but as a fallback, we can return a default agent.
      console.warn(`Missing answer for question: ${q}. Falling back to default agent.`);
      return { key: 'integrator' as AgentKey, name: AGENT_DISPLAY.integrator, scores: {} };
    }
    keyParts.push(choice);
  }

  const lookupKey = keyParts.join(':');
  const agentKey = AGENT_COMBINATIONS[lookupKey];

  if (!agentKey) {
    console.warn(`No agent found for combination: ${lookupKey}. Falling back to default agent.`);
    // Fallback to a default agent if the combination is not found in the map.
    return { key: 'integrator' as AgentKey, name: AGENT_DISPLAY.integrator, scores: {} };
  }

  // The `scores` property is no longer calculated but is kept for type consistency.
  // It can be removed if you verify it's not used anywhere downstream.
  return { key: agentKey, name: AGENT_DISPLAY[agentKey], scores: {} };
}

export function exportAgentResult(answers: Answers) {
  const result = determineAgent(answers);
  return { agent: { key: result.key, name: result.name }, answers };
}
