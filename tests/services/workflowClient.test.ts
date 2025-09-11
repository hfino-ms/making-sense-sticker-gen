import { describe, it, expect } from 'vitest';
import { preparePromptAndAgent } from '../../src/services/workflowClient';

describe('workflowClient.preparePromptAndAgent', () => {
  it('builds a prompt including traits and selfie note when includeSelfie is true', async () => {
    const answers: any = {};
    // minimal answers to let exportAgentResult pick something
    answers['decision_making'] = { choice: 'data_driven' };
    const out = await preparePromptAndAgent(answers, true);
    expect(out).toHaveProperty('agent');
    expect(typeof out.prompt).toBe('string');
    expect(out.prompt).toContain('If a selfie is provided');
  });

  it('builds prompt without selfie note when includeSelfie is false', async () => {
    const answers: any = {};
    answers['decision_making'] = { choice: 'data_driven' };
    const out = await preparePromptAndAgent(answers, false);
    expect(out.prompt).not.toContain('If a selfie is provided');
  });
});
