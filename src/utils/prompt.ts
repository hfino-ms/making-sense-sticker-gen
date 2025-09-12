import type { Answers, Agent } from '../types';
import { QUESTIONS } from '../data/questions';
import { buildPromptShared } from './promptShared';

function getAnswerLabel(answers: Answers, qid: string): string {
  const q = (QUESTIONS as any).find((x: any) => x.id === qid);
  const a = (answers || {})[qid];
  if (!a) return '';
  if (typeof a === 'object') {
    const choiceId = a.choice;
    const opt = q?.options?.find((o: any) => o.id === choiceId) || null;
    return opt && opt.label ? opt.label : String(choiceId);
  }
  return String(a);
}

export function buildPrompt(agent: Agent, includeSelfie: boolean): string {
  return buildPromptFromAnswers(agent, {} as Answers, includeSelfie);
}

export function buildPromptFromAnswers(agent: Agent, answers: Answers, includeSelfie?: boolean, variant?: string): string {
  const archetypeName = agent?.name || 'Agent';

  const q1 = getAnswerLabel(answers, 'decision_making');
  const q2 = getAnswerLabel(answers, 'tech_adoption');
  const q3 = getAnswerLabel(answers, 'risk_appetite');
  const q4 = getAnswerLabel(answers, 'team_dynamics');
  const q5 = getAnswerLabel(answers, 'growth_priorities');

  return buildPromptShared(archetypeName, q1, q2, q3, q4, q5, Boolean(includeSelfie), variant);
}
