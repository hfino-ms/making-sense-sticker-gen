import { describe, it, expect } from 'vitest';
import { buildPromptFromAnswers } from '../../src/utils/prompt';
import { QUESTIONS } from '../../src/data/questions';

describe('buildPromptFromAnswers', () => {
  it('includes traits line based on answers and selfie note when requested', () => {
    const agent = { name: 'TestAgent' };
    const answers: any = {};
    // Use first two questions to form answers
    answers[QUESTIONS[0].id] = { choice: QUESTIONS[0].options?.[0].id };
    answers[QUESTIONS[1].id] = { choice: QUESTIONS[1].options?.[1].id };

    const prompt = buildPromptFromAnswers(agent as any, answers, true);
    expect(prompt).toContain('Traits:');
    expect(prompt).toContain('TestAgent');
    expect(prompt).toContain("If a selfie is provided");
  });
});
