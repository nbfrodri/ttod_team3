import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { loadRenderers } from 'astro:container';
import { getContainerRenderer } from '@astrojs/react';
import { JSDOM } from 'jsdom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { WisdomEntry } from '../types/domain';

import SlugRoute from '../pages/[locale]/wisdom/[slug].astro';

const entry: WisdomEntry = {
  id: 'arch-001', section: 'architecture', level: 'advanced', tags: ['boundaries'],
  text: 'The module that knows its boundaries serves the whole.',
  teaches: 'Boundaries', related: [], origin: 'human', lang: 'en',
  rights: { license: 'CC-BY-NC-SA-4.0', holder: 'ruvebal@crea-comm.net' },
};
const student = { id: 'usr-002', email: 'student@example.com', roles: ['student'] };

afterEach(() => vi.restoreAllMocks());

// Each backend route answers on its own, so a test fails if the page asks for something unexpected.
const mockBackend = (favorites: unknown, session: unknown = student) =>
  vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
    const url = String(input);
    if (url.includes('/api/v1/auth/session')) return Response.json(session, { status: session ? 200 : 401 });
    if (url.includes('/api/v1/favorites')) return Response.json(favorites);
    return Response.json([entry]);
  });

const renderDetail = async (headers: Record<string, string> = {}) => {
  const renderers = await loadRenderers([getContainerRenderer()]);
  const container = await AstroContainer.create({ renderers });
  const html = await container.renderToString(SlugRoute, {
    params: { locale: 'en', slug: 'arch-001' },
    request: new Request('http://localhost/en/wisdom/arch-001/', { headers }),
  });
  const main = new JSDOM(html).window.document.querySelector('main');
  if (!main) throw new Error('route rendered no <main>');
  return main;
};

const cookie = 'ttod_session=signed-session-token';

describe('favorite button on the quote detail page', () => {
  it('without a session: the quote renders and no favorite control is emitted', async () => {
    const fetchSpy = mockBackend([]);
    const main = await renderDetail();

    expect(main.querySelector('article.ttod-card blockquote')?.textContent).toBe(entry.text);
    expect(main.querySelector('astro-island')).toBeNull();
    expect(main.querySelector('button')).toBeNull();
    expect(fetchSpy.mock.calls.some(([input]) => String(input).includes('/api/v1/favorites'))).toBe(false);
  });

  it('with a session and the quote not saved yet: offers to save it', async () => {
    mockBackend([]);
    const button = (await renderDetail({ cookie })).querySelector('astro-island button');

    expect(button?.getAttribute('aria-pressed')).toBe('false');
    expect(button?.getAttribute('aria-label')).toBe('Save quote arch-001 to favorites');
  });

  it('with a session and the quote already in the library: shows it as saved', async () => {
    mockBackend([{ userId: 'usr-002', quoteId: 'arch-001', savedAt: '2026-10-01T10:00:00Z' }]);
    const button = (await renderDetail({ cookie })).querySelector('astro-island button');

    expect(button?.getAttribute('aria-pressed')).toBe('true');
  });

  it('a session the backend rejects is treated as anonymous', async () => {
    mockBackend([], null);
    const main = await renderDetail({ cookie });

    expect(main.querySelector('astro-island')).toBeNull();
  });
});
