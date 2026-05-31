import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteCandidateCv, openProtectedCv, tokenStore } from './api';

describe('openProtectedCv', () => {
  beforeEach(() => {
    tokenStore.set('test-access-token');
    vi.useFakeTimers();
  });

  afterEach(() => {
    tokenStore.set(null);
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('fetches PDFs with the authorization header and opens them in a new tab', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(new Blob(['pdf'], { type: 'application/pdf' }), {
        status: 200,
        headers: { 'content-type': 'application/pdf' },
      }),
    );
    const openMock = vi.fn().mockReturnValue({});
    const anchorClick = vi.fn();
    const createElementMock = vi.fn().mockReturnValue({
      click: anchorClick,
      href: '',
      download: '',
      rel: '',
    });
    const createObjectURLMock = vi.fn().mockReturnValue('blob:pdf');
    const revokeObjectURLMock = vi.fn();

    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('window', { open: openMock, setTimeout });
    vi.stubGlobal('document', { createElement: createElementMock });
    vi.stubGlobal('URL', {
      createObjectURL: createObjectURLMock,
      revokeObjectURL: revokeObjectURLMock,
    });

    await openProtectedCv('resume.pdf');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain('/files/cv/resume.pdf');
    expect(new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get('Authorization')).toBe(
      'Bearer test-access-token',
    );
    expect(openMock).toHaveBeenCalledWith('blob:pdf', '_blank', 'noopener,noreferrer');
    expect(anchorClick).not.toHaveBeenCalled();

    vi.advanceTimersByTime(60_000);
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:pdf');
  });

  it('downloads non-PDF CV files through a temporary anchor', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        new Blob(['docx'], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        }),
        {
          status: 200,
          headers: {
            'content-type':
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          },
        },
      ),
    );
    const anchor = {
      click: vi.fn(),
      href: '',
      download: '',
      rel: '',
    };

    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('window', { open: vi.fn(), setTimeout });
    vi.stubGlobal('document', { createElement: vi.fn().mockReturnValue(anchor) });
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue('blob:docx'),
      revokeObjectURL: vi.fn(),
    });

    await openProtectedCv('resume.docx');

    expect(anchor.href).toBe('blob:docx');
    expect(anchor.download).toBe('resume.docx');
    expect(anchor.rel).toBe('noopener noreferrer');
    expect(anchor.click).toHaveBeenCalledTimes(1);
  });

  it('surfaces API errors from the protected files route', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'Missing or invalid authorization header' }), {
          status: 401,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );
    vi.stubGlobal('window', { open: vi.fn(), setTimeout });
    vi.stubGlobal('document', { createElement: vi.fn() });
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(),
      revokeObjectURL: vi.fn(),
    });

    await expect(openProtectedCv('resume.pdf')).rejects.toEqual(
      expect.objectContaining({
        message: 'Missing or invalid authorization header',
        status: 401,
      }),
    );
  });
});

describe('deleteCandidateCv', () => {
  beforeEach(() => {
    tokenStore.set('test-access-token');
  });

  afterEach(() => {
    tokenStore.set(null);
    vi.restoreAllMocks();
  });

  it('calls the candidate CV delete endpoint with authorization', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));

    vi.stubGlobal('fetch', fetchMock);

    await deleteCandidateCv();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain('/candidates/profile/cv');
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('DELETE');
    expect(new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get('Authorization')).toBe(
      'Bearer test-access-token',
    );
  });
});
