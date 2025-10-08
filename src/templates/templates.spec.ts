import { vi, describe, beforeEach, it, expect } from 'vitest';
import { Maxclicks } from '../maxclicks';
import type { SendTemplateResponse } from './interfaces/template-interface';
import type { ErrorResponse } from '../interfaces';

const fetchMock = vi.fn();
global.fetch = fetchMock as unknown as typeof fetch;

const mockSuccessResponse = (data: any, status = 200) => {
  fetchMock.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => ({ success: true, data }),
    headers: new Headers({ 'content-type': 'application/json' }),
  });
};

const mockErrorResponse = (error: ErrorResponse, status = 422) => {
  fetchMock.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(error),
    json: async () => error,
    headers: new Headers({ 'content-type': 'application/json' }),
  });
};

describe('Templates', () => {
  let maxclicks: Maxclicks;

  beforeEach(() => {
    fetchMock.mockReset();
    maxclicks = new Maxclicks('333c3f39-b3aa-4f00-add0-cd107e2f3a64');
  });

  describe('send', () => {
    const templateIdFromApp = '123e4567-e89b-12d3-a456-426614174000';

    it('should send a template with contact data successfully', async () => {
      const mockResponse: SendTemplateResponse = {};

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.templates.send(templateIdFromApp, {
        data: {
          recipient: 'user@example.com',
          orderNumber: 'ORD-12345',
          items: [
            { name: 'Product 1', price: 29.99 },
            { name: 'Product 2', price: 49.99 },
          ],
          total: 79.98,
        },
      });

      expect(fetchMock).toHaveBeenCalledWith(
        `https://api.maxclicks.ai/v1/template/${templateIdFromApp}/send`,
        expect.objectContaining({
          method: 'POST',
          body: expect.any(String),
        })
      );

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(callArgs[1].body as string);
      expect(body.data.recipient).toBe('user@example.com');
      expect(body.data.orderNumber).toBe('ORD-12345');
      expect(body.data.items).toHaveLength(2);
      expect(body.data.total).toBe(79.98);

      expect(result.error).toBe(null);
      expect(result.data).toEqual({});
    });

    it('should send a template with simple data', async () => {
      const mockResponse: SendTemplateResponse = {};

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.templates.send(templateIdFromApp, {
        data: {
          firstName: 'John',
          lastName: 'Doe',
          verificationCode: '123456',
        },
      });

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(callArgs[1].body as string);
      expect(body.data.firstName).toBe('John');
      expect(body.data.verificationCode).toBe('123456');

      expect(result.error).toBe(null);
      expect(result.data).toEqual({});
    });

    it('should send a template with nested object data', async () => {
      const mockResponse: SendTemplateResponse = {};

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.templates.send(templateIdFromApp, {
        data: {
          user: {
            id: 'user-123',
            email: 'john@example.com',
            profile: {
              firstName: 'John',
              lastName: 'Doe',
            },
          },
          event: {
            type: 'purchase',
            timestamp: new Date().toISOString(),
          },
        },
      });

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(callArgs[1].body as string);
      expect(body.data.user.email).toBe('john@example.com');
      expect(body.data.user.profile.firstName).toBe('John');

      expect(result.error).toBe(null);
    });

    it('should handle template ID with whitespace', async () => {
      const mockResponse: SendTemplateResponse = {};

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.templates.send(`  ${templateIdFromApp}  `, {
        data: {
          message: 'Hello',
        },
      });

      expect(fetchMock).toHaveBeenCalledWith(
        `https://api.maxclicks.ai/v1/template/${templateIdFromApp}/send`,
        expect.anything()
      );

      expect(result.error).toBe(null);
    });

    describe('UUID validation', () => {
      it('should accept valid UUID v1', async () => {
        const uuidV1 = '123e4567-e89b-12d3-a456-426614174000';
        mockSuccessResponse({});

        const result = await maxclicks.templates.send(uuidV1, {
          data: { test: 'value' },
        });

        expect(result.error).toBe(null);
      });

      it('should accept valid UUID v4', async () => {
        const uuidV4 = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
        mockSuccessResponse({});

        const result = await maxclicks.templates.send(uuidV4, {
          data: { test: 'value' },
        });

        expect(result.error).toBe(null);
      });

      it('should accept valid UUID v5', async () => {
        const uuidV5 = 'a6edc906-2f9f-5fb2-a373-efac406f0ef2';
        mockSuccessResponse({});

        const result = await maxclicks.templates.send(uuidV5, {
          data: { test: 'value' },
        });

        expect(result.error).toBe(null);
      });

      it('should reject invalid UUID format - missing hyphens', async () => {
        const result = await maxclicks.templates.send('123e4567e89b12d3a456426614174000', {
          data: { test: 'value' },
        });

        expect(fetchMock).not.toHaveBeenCalled();
        expect(result.data).toBe(null);
        expect(result.error?.error.code).toBe('invalid_parameter');
        expect(result.error?.error.message).toContain('Invalid template ID format');
      });

      it('should reject invalid UUID format - wrong segment lengths', async () => {
        const result = await maxclicks.templates.send('123e4567-e89b-12d3-a456-42661417400', {
          data: { test: 'value' },
        });

        expect(fetchMock).not.toHaveBeenCalled();
        expect(result.data).toBe(null);
        expect(result.error?.error.code).toBe('invalid_parameter');
      });

      it('should reject invalid UUID format - invalid characters', async () => {
        const result = await maxclicks.templates.send('123e4567-e89b-12d3-a456-42661417400g', {
          data: { test: 'value' },
        });

        expect(fetchMock).not.toHaveBeenCalled();
        expect(result.data).toBe(null);
        expect(result.error?.error.code).toBe('invalid_parameter');
      });

      it('should reject non-UUID string', async () => {
        const result = await maxclicks.templates.send('not-a-uuid', {
          data: { test: 'value' },
        });

        expect(fetchMock).not.toHaveBeenCalled();
        expect(result.data).toBe(null);
        expect(result.error?.error.code).toBe('invalid_parameter');
        expect(result.error?.error.message).toContain('Invalid template ID format');
      });

      it('should reject empty string', async () => {
        const result = await maxclicks.templates.send('', {
          data: { test: 'value' },
        });

        expect(fetchMock).not.toHaveBeenCalled();
        expect(result.data).toBe(null);
        expect(result.error?.error.code).toBe('invalid_parameter');
        expect(result.error?.error.message).toBe('Template ID is required');
      });

      it('should reject whitespace-only string', async () => {
        const result = await maxclicks.templates.send('   ', {
          data: { test: 'value' },
        });

        expect(fetchMock).not.toHaveBeenCalled();
        expect(result.data).toBe(null);
        expect(result.error?.error.code).toBe('invalid_parameter');
        expect(result.error?.error.message).toBe('Template ID is required');
      });
    });

    describe('data validation', () => {
      it('should reject missing data object', async () => {
        const result = await maxclicks.templates.send(templateIdFromApp, {} as any);

        expect(fetchMock).not.toHaveBeenCalled();
        expect(result.data).toBe(null);
        expect(result.error?.error.code).toBe('validation_error');
        expect(result.error?.error.message).toContain('Template data must be a valid object');
      });

      it('should reject null data', async () => {
        const result = await maxclicks.templates.send(templateIdFromApp, {
          data: null as any,
        });

        expect(fetchMock).not.toHaveBeenCalled();
        expect(result.data).toBe(null);
        expect(result.error?.error.code).toBe('validation_error');
        expect(result.error?.error.message).toBe('Template data must be a valid object');
      });

      it('should reject array as data', async () => {
        const result = await maxclicks.templates.send(templateIdFromApp, {
          data: [] as any,
        });

        expect(fetchMock).not.toHaveBeenCalled();
        expect(result.data).toBe(null);
        expect(result.error?.error.code).toBe('validation_error');
        expect(result.error?.error.message).toContain('Template data must be a valid object');
      });

      it('should reject string as data', async () => {
        const result = await maxclicks.templates.send(templateIdFromApp, {
          data: 'string' as any,
        });

        expect(fetchMock).not.toHaveBeenCalled();
        expect(result.data).toBe(null);
        expect(result.error?.error.code).toBe('validation_error');
      });

      it('should reject number as data', async () => {
        const result = await maxclicks.templates.send(templateIdFromApp, {
          data: 123 as any,
        });

        expect(fetchMock).not.toHaveBeenCalled();
        expect(result.data).toBe(null);
        expect(result.error?.error.code).toBe('validation_error');
      });

      it('should accept empty object as data', async () => {
        mockSuccessResponse({});

        const result = await maxclicks.templates.send(templateIdFromApp, {
          data: {},
        });

        expect(result.error).toBe(null);
      });
    });

    describe('error handling', () => {
      it('should handle template not found error', async () => {
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: 'not_found',
            message: 'Template not found',
          },
          requestId: 'req_not_found',
          timestamp: new Date().toISOString(),
        };

        mockErrorResponse(errorResponse, 404);

        const result = await maxclicks.templates.send(templateIdFromApp, {
          data: {
            recipient: 'user@example.com',
          },
        });

        expect(result.data).toBe(null);
        expect(result.error).toEqual(errorResponse);
      });

      it('should handle validation error for missing required fields', async () => {
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: 'validation_error',
            message: 'Missing required field: recipient',
            details: {
              field: 'recipient',
              suggestions: ['Provide a recipient email or contact ID'],
            },
          },
          requestId: 'req_validation',
          timestamp: new Date().toISOString(),
        };

        mockErrorResponse(errorResponse, 422);

        const result = await maxclicks.templates.send(templateIdFromApp, {
          data: {
            orderNumber: 'ORD-123',
          },
        });

        expect(result.data).toBe(null);
        expect(result.error).toEqual(errorResponse);
      });

      it('should handle schema mismatch error', async () => {
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: 'validation_error',
            message: 'Template data does not match schema',
            details: {
              field: 'data',
              suggestions: ['Check template schema and provide matching data'],
            },
          },
          requestId: 'req_schema',
          timestamp: new Date().toISOString(),
        };

        mockErrorResponse(errorResponse, 422);

        const result = await maxclicks.templates.send(templateIdFromApp, {
          data: {
            invalidField: 'value',
          },
        });

        expect(result.data).toBe(null);
        expect(result.error).toEqual(errorResponse);
      });

      it('should handle rate limiting', async () => {
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: 'rate_limit_exceeded',
            message: 'Too many template sends',
          },
          requestId: 'req_rate_limit',
          timestamp: new Date().toISOString(),
        };

        mockErrorResponse(errorResponse, 429);

        const result = await maxclicks.templates.send(templateIdFromApp, {
          data: {
            recipient: 'user@example.com',
          },
        });

        expect(result.data).toBe(null);
        expect(result.error).toEqual(errorResponse);
      });

      it('should handle server errors', async () => {
        const errorResponse: ErrorResponse = {
          success: false,
          error: {
            code: 'internal_server_error',
            message: 'Internal server error',
          },
          requestId: 'req_server_error',
          timestamp: new Date().toISOString(),
        };

        mockErrorResponse(errorResponse, 500);

        const result = await maxclicks.templates.send(templateIdFromApp, {
          data: {
            recipient: 'user@example.com',
          },
        });

        expect(result.data).toBe(null);
        expect(result.error).toEqual(errorResponse);
      });

      it('should handle network errors', async () => {
        fetchMock.mockRejectedValueOnce(new Error('Network error'));

        const result = await maxclicks.templates.send(templateIdFromApp, {
          data: {
            recipient: 'user@example.com',
          },
        });

        expect(result.data).toBe(null);
        expect(result.error?.error.code).toBe('application_error');
      });

      it('should handle timeout errors', async () => {
        fetchMock.mockRejectedValueOnce(new Error('Request timeout'));

        const result = await maxclicks.templates.send(templateIdFromApp, {
          data: {
            recipient: 'user@example.com',
          },
        });

        expect(result.data).toBe(null);
        expect(result.error?.error.code).toBe('application_error');
      });
    });

    describe('complex data scenarios', () => {
      it('should handle template with array of complex objects', async () => {
        mockSuccessResponse({});

        const result = await maxclicks.templates.send(templateIdFromApp, {
          data: {
            recipient: 'customer@example.com',
            order: {
              id: 'ORD-12345',
              date: '2025-01-15',
              items: [
                {
                  id: 'item-1',
                  name: 'Premium Widget',
                  quantity: 2,
                  price: 29.99,
                  subtotal: 59.98,
                  attributes: {
                    color: 'blue',
                    size: 'large',
                  },
                },
                {
                  id: 'item-2',
                  name: 'Standard Widget',
                  quantity: 1,
                  price: 19.99,
                  subtotal: 19.99,
                  attributes: {
                    color: 'red',
                    size: 'medium',
                  },
                },
              ],
              shipping: {
                method: 'express',
                cost: 9.99,
                address: {
                  street: '123 Main St',
                  city: 'San Francisco',
                  state: 'CA',
                  zip: '94102',
                },
              },
              total: 89.96,
            },
          },
        });

        expect(result.error).toBe(null);
      });

      it('should handle template with boolean and null values', async () => {
        mockSuccessResponse({});

        const result = await maxclicks.templates.send(templateIdFromApp, {
          data: {
            recipient: 'user@example.com',
            isPremium: true,
            hasSubscription: false,
            middleName: null,
            preferences: {
              notifications: true,
              marketing: false,
              newsletter: null,
            },
          },
        });

        expect(result.error).toBe(null);
      });

      it('should handle template with numeric data types', async () => {
        mockSuccessResponse({});

        const result = await maxclicks.templates.send(templateIdFromApp, {
          data: {
            recipient: 'user@example.com',
            accountBalance: 1234.56,
            pointsEarned: 150,
            transactionCount: 42,
            averageOrderValue: 89.99,
            discountPercentage: 0.15,
            taxRate: 0.0825,
          },
        });

        const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
        const body = JSON.parse(callArgs[1].body as string);
        expect(body.data.accountBalance).toBe(1234.56);
        expect(body.data.pointsEarned).toBe(150);
        expect(body.data.discountPercentage).toBe(0.15);

        expect(result.error).toBe(null);
      });

      it('should handle template with date strings', async () => {
        mockSuccessResponse({});

        const now = new Date().toISOString();
        const result = await maxclicks.templates.send(templateIdFromApp, {
          data: {
            recipient: 'user@example.com',
            createdAt: now,
            expiresAt: '2025-12-31T23:59:59Z',
            lastLogin: '2025-01-15T10:30:00Z',
          },
        });

        expect(result.error).toBe(null);
      });
    });
  });
});
