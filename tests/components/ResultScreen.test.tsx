import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { JSDOM } from 'jsdom';
import ResultScreen from '../../src/components/ResultScreen';

// Minimal mock result with data URL
const mockResult = {
  imageDataUrl: 'data:image/png;base64,AAAA',
  agent: { name: 'The Integrator', key: 'integrator' }
} as any;

describe('ResultScreen auto-submit guard', () => {
  let dom: JSDOM | null = null;

  beforeEach(() => {
    // create a fresh JSDOM environment for each test so testing-library has document/window
    dom = new JSDOM('<!doctype html><html><body></body></html>');
    (globalThis as any).window = dom.window as any;
    (globalThis as any).document = dom.window.document as any;
    (globalThis as any).navigator = dom.window.navigator as any;

    // clear global guard
    (globalThis as any).__submittedStickerUrls = undefined;
  });

  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
    (globalThis as any).__submittedStickerUrls = undefined;
    if (dom) {
      try { dom.window.close(); } catch (e) {}
      dom = null;
    }
    try {
      delete (globalThis as any).window;
      delete (globalThis as any).document;
      delete (globalThis as any).navigator;
    } catch (e) {}
  });

  it('calls onShare only once even if mounted twice with same sticker', async () => {
    const onShare = vi.fn();
    const { unmount } = render(<ResultScreen result={mockResult} onShare={onShare} onPrint={() => {}} /> as any);

    // first mount should call onShare once
    expect(onShare).toHaveBeenCalledTimes(1);

    // unmount and remount with same result
    unmount();
    render(<ResultScreen result={mockResult} onShare={onShare} onPrint={() => {}} /> as any);

    // still only called once
    expect(onShare).toHaveBeenCalledTimes(1);
  });
});
