import { vi, describe, beforeEach, it, expect } from 'vitest';
import { Maxclicks } from '../maxclicks';
import type {
  CreateAttributeResponse,
  ListAttributesResponse,
  DeleteAttributeResponse,
  BatchCreateAttributesResponse,
} from './interfaces';
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

describe('Attributes', () => {
  let maxclicks: Maxclicks;

  beforeEach(() => {
    fetchMock.mockReset();
    maxclicks = new Maxclicks('333c3f39-b3aa-4f00-add0-cd107e2f3a64');
  });

  describe('create', () => {
    it('should create a contact attribute successfully', async () => {
      const mockResponse: CreateAttributeResponse = {
        attribute: {
          key: 'subscription_plan',
          label: 'Subscription Plan',
          description: 'Customer subscription tier',
          type: 'string',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.attributes.create({
        target: { type: 'contact' },
        data: {
          key: 'subscription_plan',
          label: 'Subscription Plan',
          description: 'Customer subscription tier',
          type: 'string',
        },
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.maxclicks.ai/v1/attributes',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(String),
          headers: expect.any(Headers),
        })
      );

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(callArgs[1].body as string);
      expect(body.target.type).toBe('contact');
      expect(body.data.key).toBe('subscription_plan');

      expect(result.error).toBe(null);
      expect(result.data).toEqual(mockResponse);
      expect(result.data?.attribute.key).toBe('subscription_plan');
      expect(result.data?.attribute.type).toBe('string');
    });

    it('should create an object attribute successfully', async () => {
      const mockResponse: CreateAttributeResponse = {
        attribute: {
          key: 'product_price',
          label: 'Product Price',
          description: '',
          type: 'number',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.attributes.create({
        target: { type: 'object', objectSchemaId: 'products' },
        data: {
          key: 'product_price',
          label: 'Product Price',
          description: '',
          type: 'number',
        },
      });

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(callArgs[1].body as string);
      expect(body.target.type).toBe('object');
      expect(body.target.objectSchemaId).toBe('products');

      expect(result.error).toBe(null);
      expect(result.data).toEqual(mockResponse);
    });

    it('should handle validation error for missing target.type', async () => {
      const result = await maxclicks.attributes.create({
        target: {} as any,
        data: {
          key: 'test_key',
          label: 'Test Label',
          description: '',
          type: 'string',
        },
      });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('validation_error');
      expect(result.error?.error.message).toContain('target.type is required');
    });

    it('should handle validation error for missing data.key', async () => {
      const result = await maxclicks.attributes.create({
        target: { type: 'contact' },
        data: {
          key: '',
          label: 'Test Label',
          description: '',
          type: 'string',
        },
      });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('validation_error');
      expect(result.error?.error.message).toContain('data.key is required');
    });

    it('should handle validation error for missing data.label', async () => {
      const result = await maxclicks.attributes.create({
        target: { type: 'contact' },
        data: {
          key: 'test_key',
          label: '',
          description: '',
          type: 'string',
        },
      });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('validation_error');
      expect(result.error?.error.message).toContain('data.label is required');
    });

    it('should handle validation error for missing data.type', async () => {
      const result = await maxclicks.attributes.create({
        target: { type: 'contact' },
        data: {
          key: 'test_key',
          label: 'Test Label',
          description: '',
          type: '' as any,
        },
      });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('validation_error');
      expect(result.error?.error.message).toContain('data.type is required');
    });

    it('should handle validation error for missing objectSchemaId when target is object', async () => {
      const result = await maxclicks.attributes.create({
        target: { type: 'object' } as any,
        data: {
          key: 'test_key',
          label: 'Test Label',
          description: '',
          type: 'string',
        },
      });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('validation_error');
      expect(result.error?.error.message).toContain('objectSchemaId is required');
    });

    it('should handle duplicate key error from API', async () => {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'validation_error',
          message: 'Attribute with key "subscription_plan" already exists',
        },
        requestId: 'req_duplicate',
        timestamp: new Date().toISOString(),
      };

      mockErrorResponse(errorResponse, 422);

      const result = await maxclicks.attributes.create({
        target: { type: 'contact' },
        data: {
          key: 'subscription_plan',
          label: 'Subscription Plan',
          description: '',
          type: 'string',
        },
      });

      expect(result.data).toBe(null);
      expect(result.error).toEqual(errorResponse);
    });

    it('should handle invalid attribute type error', async () => {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'validation_error',
          message: 'Invalid attribute type',
        },
        requestId: 'req_invalid_type',
        timestamp: new Date().toISOString(),
      };

      mockErrorResponse(errorResponse, 422);

      const result = await maxclicks.attributes.create({
        target: { type: 'contact' },
        data: {
          key: 'test_key',
          label: 'Test Label',
          description: '',
          type: 'invalid_type' as any,
        },
      });

      expect(result.data).toBe(null);
      expect(result.error).toEqual(errorResponse);
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await maxclicks.attributes.create({
        target: { type: 'contact' },
        data: {
          key: 'test_key',
          label: 'Test Label',
          description: '',
          type: 'string',
        },
      });

      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('application_error');
    });
  });

  describe('createBatch', () => {
    it('should create multiple attributes successfully', async () => {
      const mockResponse: BatchCreateAttributesResponse = {
        results: [
          {
            success: true,
            attribute: {
              key: 'subscription_plan',
              label: 'Subscription Plan',
              description: 'Customer subscription tier',
              type: 'string',
            },
          },
          {
            success: true,
            attribute: {
              key: 'signup_date',
              label: 'Signup Date',
              description: '',
              type: 'date time',
            },
          },
        ],
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.attributes.createBatch({
        operations: [
          {
            target: { type: 'contact' },
            data: {
              key: 'subscription_plan',
              label: 'Subscription Plan',
              description: 'Customer subscription tier',
              type: 'string',
            },
          },
          {
            target: { type: 'contact' },
            data: {
              key: 'signup_date',
              label: 'Signup Date',
              type: 'date time',
            },
          },
        ],
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.maxclicks.ai/v1/attributes/batch',
        expect.objectContaining({
          method: 'POST',
        })
      );

      expect(result.error).toBe(null);
      expect(result.data).toEqual(mockResponse);
      expect(result.data?.results).toHaveLength(2);
      expect(result.data?.results[0].success).toBe(true);
      expect(result.data?.results[1].success).toBe(true);
    });

    it('should handle partial success in batch operation', async () => {
      const mockResponse: BatchCreateAttributesResponse = {
        results: [
          {
            success: true,
            attribute: {
              key: 'subscription_plan',
              label: 'Subscription Plan',
              description: '',
              type: 'string',
            },
          },
          {
            success: false,
            error: 'Attribute with key "duplicate_key" already exists',
          },
        ],
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.attributes.createBatch({
        operations: [
          {
            target: { type: 'contact' },
            data: {
              key: 'subscription_plan',
              label: 'Subscription Plan',
              type: 'string',
            },
          },
          {
            target: { type: 'contact' },
            data: {
              key: 'duplicate_key',
              label: 'Duplicate Key',
              type: 'string',
            },
          },
        ],
      });

      expect(result.error).toBe(null);
      expect(result.data?.results[0].success).toBe(true);
      expect(result.data?.results[1].success).toBe(false);
      if (result.data && !result.data.results[1].success) {
        expect(result.data.results[1].error).toContain('already exists');
      }
    });

    it('should handle validation error for empty operations array', async () => {
      const result = await maxclicks.attributes.createBatch({
        operations: [],
      });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('validation_error');
      expect(result.error?.error.message).toContain('non-empty array');
    });

    it('should handle validation error for missing target.type in operation', async () => {
      const result = await maxclicks.attributes.createBatch({
        operations: [
          {
            target: {} as any,
            data: {
              key: 'test_key',
              label: 'Test Label',
              type: 'string',
            },
          },
        ],
      });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('validation_error');
      expect(result.error?.error.message).toContain('operations[0].target.type is required');
    });

    it('should handle validation error for missing objectSchemaId in operation', async () => {
      const result = await maxclicks.attributes.createBatch({
        operations: [
          {
            target: { type: 'object' } as any,
            data: {
              key: 'test_key',
              label: 'Test Label',
              type: 'string',
            },
          },
        ],
      });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('validation_error');
      expect(result.error?.error.message).toContain('objectSchemaId is required');
    });

    it('should handle validation error for missing data.key in operation', async () => {
      const result = await maxclicks.attributes.createBatch({
        operations: [
          {
            target: { type: 'contact' },
            data: {
              key: '',
              label: 'Test Label',
              type: 'string',
            },
          },
        ],
      });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('validation_error');
      expect(result.error?.error.message).toContain('operations[0].data.key is required');
    });

    it('should handle validation error for missing data.label in operation', async () => {
      const result = await maxclicks.attributes.createBatch({
        operations: [
          {
            target: { type: 'contact' },
            data: {
              key: 'test_key',
              label: '',
              type: 'string',
            },
          },
        ],
      });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('validation_error');
      expect(result.error?.error.message).toContain('operations[0].data.label is required');
    });

    it('should handle validation error for missing data.type in operation', async () => {
      const result = await maxclicks.attributes.createBatch({
        operations: [
          {
            target: { type: 'contact' },
            data: {
              key: 'test_key',
              label: 'Test Label',
              type: '' as any,
            },
          },
        ],
      });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('validation_error');
      expect(result.error?.error.message).toContain('operations[0].data.type is required');
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await maxclicks.attributes.createBatch({
        operations: [
          {
            target: { type: 'contact' },
            data: {
              key: 'test_key',
              label: 'Test Label',
              type: 'string',
            },
          },
        ],
      });

      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('application_error');
    });
  });

  describe('list', () => {
    it('should list contact attributes successfully', async () => {
      const mockResponse: ListAttributesResponse = {
        attributes: [
          {
            key: 'subscription_plan',
            label: 'Subscription Plan',
            description: 'Customer subscription tier',
            type: 'string',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
          },
          {
            key: 'signup_date',
            label: 'Signup Date',
            description: '',
            type: 'date time',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
          },
        ],
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.attributes.list({
        target_type: 'contact',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.maxclicks.ai/v1/attributes?target_type=contact',
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result.error).toBe(null);
      expect(result.data).toEqual(mockResponse);
      expect(result.data?.attributes).toHaveLength(2);
    });

    it('should list object attributes successfully', async () => {
      const mockResponse: ListAttributesResponse = {
        attributes: [
          {
            key: 'product_price',
            label: 'Product Price',
            description: 'Price in USD',
            type: 'number',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
          },
        ],
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.attributes.list({
        target_type: 'object',
        objectSchemaId: 'products',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.maxclicks.ai/v1/attributes?target_type=object&objectSchemaId=products',
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result.error).toBe(null);
      expect(result.data).toEqual(mockResponse);
      expect(result.data?.attributes).toHaveLength(1);
    });

    it('should return empty array when no attributes exist', async () => {
      const mockResponse: ListAttributesResponse = {
        attributes: [],
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.attributes.list({
        target_type: 'contact',
      });

      expect(result.error).toBe(null);
      expect(result.data?.attributes).toHaveLength(0);
    });

    it('should handle validation error for missing target_type', async () => {
      const result = await maxclicks.attributes.list({} as any);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('invalid_parameter');
    });

    it('should handle validation error for missing objectSchemaId when target_type is object', async () => {
      const result = await maxclicks.attributes.list({
        target_type: 'object',
      });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('invalid_parameter');
    });

    it('should handle not found error for invalid object schema', async () => {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'not_found',
          message: 'Object schema not found',
        },
        requestId: 'req_not_found',
        timestamp: new Date().toISOString(),
      };

      mockErrorResponse(errorResponse, 404);

      const result = await maxclicks.attributes.list({
        target_type: 'object',
        objectSchemaId: 'non_existent',
      });

      expect(result.data).toBe(null);
      expect(result.error).toEqual(errorResponse);
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await maxclicks.attributes.list({
        target_type: 'contact',
      });

      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('application_error');
    });
  });

  describe('delete', () => {
    it('should delete a contact attribute successfully', async () => {
      const mockResponse: DeleteAttributeResponse = {};

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.attributes.delete('subscription_plan', {
        target: { type: 'contact' },
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.maxclicks.ai/v1/attributes/subscription_plan',
        expect.objectContaining({
          method: 'DELETE',
        })
      );

      expect(result.error).toBe(null);
      expect(result.data).toEqual(mockResponse);
    });

    it('should delete an object attribute successfully', async () => {
      const mockResponse: DeleteAttributeResponse = {};

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.attributes.delete('product_price', {
        target: { type: 'object', objectSchemaId: 'products' },
      });

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(callArgs[1].body as string);
      expect(body.target.type).toBe('object');
      expect(body.target.objectSchemaId).toBe('products');

      expect(result.error).toBe(null);
      expect(result.data).toEqual(mockResponse);
    });

    it('should handle validation error for missing attributeKey', async () => {
      const result = await maxclicks.attributes.delete('', {
        target: { type: 'contact' },
      });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('validation_error');
      expect(result.error?.error.message).toContain('attributeKey is required');
    });

    it('should handle validation error for missing target.type', async () => {
      const result = await maxclicks.attributes.delete('test_key', {
        target: {} as any,
      });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('validation_error');
      expect(result.error?.error.message).toContain('target.type is required');
    });

    it('should handle validation error for missing objectSchemaId when target is object', async () => {
      const result = await maxclicks.attributes.delete('test_key', {
        target: { type: 'object' } as any,
      });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('validation_error');
      expect(result.error?.error.message).toContain('objectSchemaId is required');
    });

    it('should handle not found error for non-existent attribute', async () => {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'not_found',
          message: 'Attribute not found',
        },
        requestId: 'req_not_found',
        timestamp: new Date().toISOString(),
      };

      mockErrorResponse(errorResponse, 404);

      const result = await maxclicks.attributes.delete('non_existent', {
        target: { type: 'contact' },
      });

      expect(result.data).toBe(null);
      expect(result.error).toEqual(errorResponse);
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await maxclicks.attributes.delete('test_key', {
        target: { type: 'contact' },
      });

      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('application_error');
    });
  });

  describe('target (fluent builder)', () => {
    it('should create contact attribute using fluent API', async () => {
      const mockResponse: CreateAttributeResponse = {
        attribute: {
          key: 'subscription_plan',
          label: 'Subscription Plan',
          description: 'Customer subscription tier',
          type: 'string',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.attributes
        .target('contact')
        .create()
        .key('subscription_plan')
        .label('Subscription Plan')
        .type('string')
        .description('Customer subscription tier')
        .execute();

      expect(result.error).toBe(null);
      expect(result.data).toEqual(mockResponse);
    });

    it('should create object attribute using fluent API', async () => {
      const mockResponse: CreateAttributeResponse = {
        attribute: {
          key: 'product_price',
          label: 'Product Price',
          description: '',
          type: 'number',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.attributes
        .target({ object: 'products' })
        .create()
        .key('product_price')
        .label('Product Price')
        .type('number')
        .description(null)
        .execute();

      expect(result.error).toBe(null);
      expect(result.data).toEqual(mockResponse);
    });

    it('should generate key from label using keyFromLabel()', async () => {
      const mockResponse: CreateAttributeResponse = {
        attribute: {
          key: 'subscription_plan',
          label: 'Subscription Plan',
          description: '',
          type: 'string',
        },
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.attributes
        .target('contact')
        .create()
        .label('Subscription Plan')
        .keyFromLabel()
        .type('string')
        .description(null)
        .execute();

      expect(result.error).toBe(null);
      expect(result.data).toEqual(mockResponse);
    });

    it('should validate before executing', async () => {
      const result = await maxclicks.attributes
        .target('contact')
        .create()
        .label('Test Label')
        .type('string')
        .execute();

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('validation_error');
      expect(result.error?.error.message).toContain('key');
    });

    it('should preview request without executing', () => {
      const preview = maxclicks.attributes
        .target('contact')
        .create()
        .key('test_key')
        .label('Test Label')
        .type('string')
        .description(null)
        .preview();

      expect(preview.target.type).toBe('contact');
      expect(preview.data.key).toBe('test_key');
      expect(preview.data.label).toBe('Test Label');
      expect(preview.data.type).toBe('string');
    });

    it('should validate without executing', () => {
      const validation = maxclicks.attributes
        .target('contact')
        .create()
        .label('Test Label')
        .type('string')
        .validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toHaveLength(1);
      expect(validation.errors[0].field).toBe('key');
    });
  });
});
