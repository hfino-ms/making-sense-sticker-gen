import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from '../../api/send-to-n8n.js';

describe('send-to-n8n handler', () => {
  beforeEach(() => {
    process.env.N8N_WEBHOOK_URL = 'https://example.com/webhook';
    delete process.env.N8N_WEBHOOK_AUTH;
    // Mock global fetch used by handler
    (globalThis as any).fetch = vi.fn(() => Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify({ received: true })) }));
  });

  afterEach(() => {
    vi.resetAllMocks();
    try { delete (globalThis as any).fetch; } catch (e) {}
  });

  it('returns 400 when required fields missing', async () => {
    const req: any = { method: 'POST', body: { name: 'Alice' } };
    const res: any = {
      status(code: number) { this._status = code; return this; },
      json(obj: any) { this._json = obj; return this; }
    };

    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._json).toHaveProperty('error');
  });

  it('posts payload to N8N webhook and returns success', async () => {
    const req: any = { method: 'POST', body: { email: 'a@b.com', name: 'Alice', sticker: 'data:sticker' } };
    const res: any = {
      status(code: number) { this._status = code; return this; },
      json(obj: any) { this._json = obj; return this; }
    };

    await handler(req, res);
    expect(res._status).toBe(200);
    expect(res._json).toEqual({ ok: true, status: 200, body: { received: true } });
  });
});
