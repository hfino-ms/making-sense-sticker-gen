import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from '../../api/generate-sticker.js';

vi.mock('../../api/services/openaiService.js', () => ({
  generateImageFromPrompt: vi.fn(async (prompt: string, key: string, photo: any) => ({
    data: [{ url: 'https://example.com/gen.png' }],
    promptReceived: prompt,
    photoReceived: Boolean(photo),
  }))
}));

describe('generate-sticker handler', () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'sk-test';
  });
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns 400 when agent missing', async () => {
    const req: any = { method: 'POST', body: {} };
    const res: any = { status(code: number) { this._status = code; return this; }, json(obj: any) { this._json = obj; return this; } };

    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._json).toHaveProperty('error');
  });

  it('calls openai service and returns gen', async () => {
    const req: any = { method: 'POST', body: { agent: { name: 'Tester' }, survey: { answer_1: 'a' } } };
    const res: any = { status(code: number) { this._status = code; return this; }, json(obj: any) { this._json = obj; return this; } };

    await handler(req, res);
    expect(res._status).toBe(200);
    expect(res._json).toHaveProperty('gen');
    expect(res._json.gen.promptReceived).toContain('Tester');
  });
});
