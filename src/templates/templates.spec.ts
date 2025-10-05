import { beforeEach, describe, it, expect, vi } from 'vitest';
import { Maxclicks } from '../maxclicks';

// Mock fetch globally
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('Templates', () => {
  let maxclicks: Maxclicks;

  beforeEach(() => {
    fetchMock.mockClear();
    maxclicks = new Maxclicks('test_api_key');
  });

  const mockSuccessResponse = (data: any, status = 200) => {
    fetchMock.mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      json: async () => ({ success: true, data }),
      headers: new Headers({ 'content-type': 'application/json' }),
    });
  };

  describe('send', () => {
    it('should send template with data successfully', async () => {
      mockSuccessResponse({}, 201); // Template sending should return 201 Created

      const result = await maxclicks.templates.send('template_123', {
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          plan: 'premium',
        },
      });

      expect(result.error).toBeNull();
      expect(result.data).toEqual({});

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/v1/template/template_123/send'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.any(Headers),
          body: JSON.stringify({
            data: {
              name: 'John Doe',
              email: 'john@example.com',
              plan: 'premium',
            },
          }),
        })
      );
    });

    it('should handle missing template ID', async () => {
      const result = await maxclicks.templates.send('', {
        data: { name: 'John' },
      });

      expect(result.data).toBeNull();
      expect(result.error?.error.code).toBe('invalid_parameter');
      expect(result.error?.error.message).toBe('Template ID is required');
      expect(result.error?.error.details).toEqual({
        field: 'id',
        suggestions: ['Provide a valid template ID'],
      });

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should handle missing data', async () => {
      const result = await maxclicks.templates.send('template_123', {
        data: null as any,
      });

      expect(result.data).toBeNull();
      expect(result.error?.error.code).toBe('validation_error');
      expect(result.error?.error.message).toBe('Template data must be a valid object');
      expect(result.error?.error.details).toEqual({
        field: 'data',
        suggestions: ['Provide template data as an object with merge fields'],
      });

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should handle invalid data type', async () => {
      const result = await maxclicks.templates.send('template_123', {
        data: 'invalid_string' as any,
      });

      expect(result.data).toBeNull();
      expect(result.error?.error.code).toBe('validation_error');
      expect(result.error?.error.message).toBe('Template data must be a valid object');
      expect(result.error?.error.details).toEqual({
        field: 'data',
        suggestions: ['Provide template data as an object with merge fields'],
      });

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should URL encode template ID', async () => {
      mockSuccessResponse({});

      await maxclicks.templates.send('template with spaces', {
        data: { test: 'value' },
      });

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/v1/template/template%20with%20spaces/send'),
        expect.any(Object)
      );
    });
  });
});
