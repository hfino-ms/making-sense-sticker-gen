import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from '../../api/upload-composed.js';

vi.mock('../../api/services/supabaseService.js', () => ({
  uploadBufferToSupabase: vi.fn(async (url: string, key: string, bucket: string, buffer: Buffer, contentType: string, filename: string) => {
    return `https://cdn.example.com/${filename}`;
  })
}));

describe('upload-composed handler', () => {
  beforeEach(() => {
    process.env.SUPABASE_URL = 'https://supabase.test';
    process.env.SUPABASE_SERVICE_KEY = 'service-key';
    process.env.SUPABASE_BUCKET = 'stickers';
  });
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns 400 when missing required fields', async () => {
    const req: any = { method: 'POST', body: {} };
    const res: any = { status(code: number) { this._status = code; return this; }, json(obj: any) { this._json = obj; return this; } };
    await handler(req, res);
    expect(res._status).toBe(400);
  });

  it('uploads composed data and returns imageUrl', async () => {
    const dataUrl = 'data:image/png;base64,' + Buffer.from('test').toString('base64');
    const req: any = { method: 'POST', body: { email: 'a@b.com', name: 'Bob', agent: { name: 'X' }, composedDataUrl: dataUrl } };
    const res: any = { status(code: number) { this._status = code; return this; }, json(obj: any) { this._json = obj; return this; } };
    await handler(req, res);
    expect(res._status).toBe(200);
    expect(res._json).toHaveProperty('imageUrl');
  });
});
