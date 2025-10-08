import { vi, describe, beforeEach, it, expect } from 'vitest';
import { Maxclicks } from '../maxclicks';
import type {
  Object as ObjectType,
  CreateObjectResponse,
  CreateObjectsBatchResponse,
  CreateObjectSchemaResponse,
  UpdateObjectResponse,
  UpdateObjectSchemaResponse,
  DeleteObjectResponse,
  DeleteObjectByIdResponse,
  ListObjectsResponse,
  ListObjectSchemasResponse,
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

describe('Objects', () => {
  let maxclicks: Maxclicks;

  beforeEach(() => {
    fetchMock.mockReset();
    maxclicks = new Maxclicks('333c3f39-b3aa-4f00-add0-cd107e2f3a64');
  });

  describe('createSchema', () => {
    it('should create an object schema successfully', async () => {
      const mockResponse: CreateObjectSchemaResponse = {
        schemaId: '06e592cd-8f3d-4efe-9f9e-0a31b1e245ab23',
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.objects.createSchema({
        schema: {
          slug: 'products',
          name: 'Products',
          description: 'Product catalog',
        },
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.maxclicks.ai/v1/objects/schema',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(String),
        })
      );

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(callArgs[1].body as string);
      expect(body.schema.slug).toBe('products');
      expect(body.schema.name).toBe('Products');

      expect(result.error).toBe(null);
      expect(result.data?.schemaId).toBe('06e592cd-8f3d-4efe-9f9e-0a31b1e245ab23');
    });

    it('should create a minimal schema with only slug', async () => {
      const mockResponse: CreateObjectSchemaResponse = {
        schemaId: '14818473-2615-4c1a-bcaf-65dae243ccb0',
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.objects.createSchema({
        schema: {
          slug: 'customers',
        },
      });

      expect(result.error).toBe(null);
      expect(result.data?.schemaId).toBe('14818473-2615-4c1a-bcaf-65dae243ccb0');
    });

    it('should handle validation error for missing slug', async () => {
      const result = await maxclicks.objects.createSchema({
        schema: {
          name: 'Test Schema',
        } as any,
      });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('invalid_parameter');
    });

    it('should handle duplicate schema error', async () => {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'validation_error',
          message: 'Schema with slug "products" already exists',
        },
        requestId: 'req_duplicate',
        timestamp: new Date().toISOString(),
      };

      mockErrorResponse(errorResponse, 422);

      const result = await maxclicks.objects.createSchema({
        schema: {
          slug: 'products',
        },
      });

      expect(result.data).toBe(null);
      expect(result.error).toEqual(errorResponse);
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await maxclicks.objects.createSchema({
        schema: {
          slug: 'test-schema',
        },
      });

      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('application_error');
    });
  });

  describe('listSchemas', () => {
    it('should list object schemas with pagination', async () => {
      const mockResponse: ListObjectSchemasResponse = {
        objects: [
          {
            id: '06e592cd-8f3d-4efe-9f9e-0a31b1e245ab',
            name: 'Products',
            slug: 'products',
            description: 'Product catalog',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
            objectsCount: 100,
          },
          {
            id: '34ac25d4-faa0-45ce-b95a-b0802d21449b',
            name: 'Customers',
            slug: 'customers',
            description: null,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
            objectsCount: 250,
          },
        ],
        pagination: {
          page: 1,
          per_page: 25,
          total_count: 2,
          total_pages: 1,
        },
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.objects.listSchemas();

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.maxclicks.ai/v1/objects/schema',
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result.error).toBe(null);
      expect(result.data?.objects).toHaveLength(2);
      expect(result.data?.pagination.total_count).toBe(2);
    });

    it('should support pagination options', async () => {
      const mockResponse: ListObjectSchemasResponse = {
        objects: [],
        pagination: {
          page: 2,
          per_page: 50,
          total_count: 100,
          total_pages: 2,
        },
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.objects.listSchemas({ page: 2, per_page: 50 });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.maxclicks.ai/v1/objects/schema?page=2&per_page=50',
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result.error).toBe(null);
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await maxclicks.objects.listSchemas();

      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('application_error');
    });
  });

  describe('updateSchema', () => {
    it('should update an object schema successfully', async () => {
      const mockResponse: UpdateObjectSchemaResponse = {
        schemaUpdatedAt: 1704153600000,
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.objects.updateSchema({
        schemaId: '06e592cd-8f3d-4efe-9f9e-0a31b1e245ab23',
        schemaUpdates: {
          name: 'Updated Products',
          description: 'Updated product catalog',
        },
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.maxclicks.ai/v1/objects/schema',
        expect.objectContaining({
          method: 'PUT',
          body: expect.any(String),
        })
      );

      expect(result.error).toBe(null);
      expect(result.data?.schemaUpdatedAt).toBe(1704153600000);
    });

    it('should handle validation error for missing schemaId', async () => {
      const result = await maxclicks.objects.updateSchema({
        schemaId: '',
        schemaUpdates: {
          name: 'Updated Name',
        },
      });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('invalid_parameter');
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await maxclicks.objects.updateSchema({
        schemaId: '06e592cd-8f3d-4efe-9f9e-0a31b1e245ab23',
        schemaUpdates: {
          name: 'Updated Name',
        },
      });

      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('application_error');
    });
  });

  describe('create', () => {
    it('should create an object successfully', async () => {
      const mockResponse: CreateObjectResponse = {
        objectId: '281cfdf5-c593-4c6c-a5d0-b51b813c217a',
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.objects.create('products', {
        objectId: '379fcc3b-5068-415f-877b-4ef1280d2bbd',
        attributeValuesByKey: {
          name: 'Premium Widget',
          price: 99.99,
          category: 'electronics',
        },
        tags: ['premium', 'featured'],
        notes: 'Special product',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.maxclicks.ai/v1/objects/products',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(String),
        })
      );

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(callArgs[1].body as string);
      expect(body.objectId).toBe('379fcc3b-5068-415f-877b-4ef1280d2bbd');
      expect(body.attributeValuesByKey.name).toBe('Premium Widget');
      expect(body.tags).toEqual(['premium', 'featured']);

      expect(result.error).toBe(null);
      expect(result.data?.objectId).toBe('281cfdf5-c593-4c6c-a5d0-b51b813c217a');
    });

    it('should create an object with minimal data', async () => {
      const mockResponse: CreateObjectResponse = {
        objectId: 'cadaff8e-4d85-42d6-9a52-c40239f9cb5e',
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.objects.create('products', {
        attributeValuesByKey: {
          name: 'Basic Widget',
        },
      });

      expect(result.error).toBe(null);
      expect(result.data?.objectId).toBe('cadaff8e-4d85-42d6-9a52-c40239f9cb5e');
    });

    it('should handle validation error for missing schemaSlug', async () => {
      const result = await maxclicks.objects.create('', {
        attributeValuesByKey: { name: 'Test' },
      });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('invalid_parameter');
    });

    it('should handle schema not found error', async () => {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'not_found',
          message: 'Schema not found',
        },
        requestId: 'req_not_found',
        timestamp: new Date().toISOString(),
      };

      mockErrorResponse(errorResponse, 404);

      const result = await maxclicks.objects.create('non-existent', {
        attributeValuesByKey: { name: 'Test' },
      });

      expect(result.data).toBe(null);
      expect(result.error).toEqual(errorResponse);
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await maxclicks.objects.create('products', {
        attributeValuesByKey: { name: 'Test' },
      });

      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('application_error');
    });
  });

  describe('createBatch', () => {
    it('should create multiple objects successfully', async () => {
      const mockResponse: CreateObjectsBatchResponse = {
        objectIds: [
          'df55b88d-4eac-499e-a156-fe15c731f249',
          'b0789650-0347-4e6d-9487-e861fe4c1183',
          '5542897b-844e-46c3-a8aa-2de1908f91c0',
        ],
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.objects.createBatch('products', [
        {
          objectId: 'prod-1',
          attributeValuesByKey: { name: 'Widget 1', price: 29.99 },
        },
        {
          objectId: 'prod-2',
          attributeValuesByKey: { name: 'Widget 2', price: 49.99 },
        },
        {
          objectId: 'prod-3',
          attributeValuesByKey: { name: 'Widget 3', price: 99.99 },
        },
      ]);

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.maxclicks.ai/v1/objects/products/batch',
        expect.objectContaining({
          method: 'POST',
        })
      );

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(callArgs[1].body as string);
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(3);

      expect(result.error).toBe(null);
      expect(result.data?.objectIds).toEqual([
        'df55b88d-4eac-499e-a156-fe15c731f249',
        'b0789650-0347-4e6d-9487-e861fe4c1183',
        '5542897b-844e-46c3-a8aa-2de1908f91c0',
      ]);
    });

    it('should handle validation error for missing schemaSlug', async () => {
      const result = await maxclicks.objects.createBatch('', [
        { attributeValuesByKey: { name: 'Test' } },
      ]);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('invalid_parameter');
    });

    it('should handle validation error for empty array', async () => {
      const result = await maxclicks.objects.createBatch('products', []);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('invalid_parameter');
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await maxclicks.objects.createBatch('products', [
        { attributeValuesByKey: { name: 'Test' } },
      ]);

      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('application_error');
    });
  });

  describe('list', () => {
    it('should list objects in a schema with pagination', async () => {
      const mockResponse: ListObjectsResponse = {
        objects: [
          {
            id: 'df55b88d-4eac-499e-a156-fe15c731f249',
            objectId: '379fcc3b-5068-415f-877b-4ef1280d2bbd',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
            notes: 'Test product',
            tags: ['premium'],
            name: 'Premium Widget',
            price: 99.99,
          },
        ],
        pagination: {
          page: 1,
          per_page: 25,
          total_count: 1,
          total_pages: 1,
        },
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.objects.list('products');

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.maxclicks.ai/v1/objects/products',
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result.error).toBe(null);
      expect(result.data?.objects).toHaveLength(1);
      expect(result.data?.pagination.total_count).toBe(1);
    });

    it('should support pagination options', async () => {
      const mockResponse: ListObjectsResponse = {
        objects: [],
        pagination: {
          page: 2,
          per_page: 50,
          total_count: 100,
          total_pages: 2,
        },
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.objects.list('products', { page: 2, per_page: 50 });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.maxclicks.ai/v1/objects/products?page=2&per_page=50',
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result.error).toBe(null);
    });

    it('should handle validation error for missing schemaSlug', async () => {
      const result = await maxclicks.objects.list('');

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('invalid_parameter');
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await maxclicks.objects.list('products');

      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('application_error');
    });
  });

  describe('get / getById', () => {
    it('should retrieve an object by ID', async () => {
      const mockResponse: ObjectType = {
        id: '281cfdf5-c593-4c6c-a5d0-b51b813c217a',
        objectId: '379fcc3b-5068-415f-877b-4ef1280d2bbd',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        notes: 'Premium product',
        tags: ['premium', 'featured'],
        name: 'Premium Widget',
        price: 99.99,
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.objects.get(
        'products',
        '281cfdf5-c593-4c6c-a5d0-b51b813c217a'
      );

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.maxclicks.ai/v1/objects/products/281cfdf5-c593-4c6c-a5d0-b51b813c217a',
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result.error).toBe(null);
      expect(result.data?.id).toBe('281cfdf5-c593-4c6c-a5d0-b51b813c217a');
      expect(result.data?.objectId).toBe('379fcc3b-5068-415f-877b-4ef1280d2bbd');
    });

    it('should retrieve using getById alias', async () => {
      const mockResponse: ObjectType = {
        id: 'cadaff8e-4d85-42d6-9a52-c40239f9cb5e',
        objectId: '0177d778-caa6-4b5c-a33c-047adb12c25a',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        notes: null,
        tags: [],
        name: 'Basic Widget',
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.objects.getById(
        'products',
        'cadaff8e-4d85-42d6-9a52-c40239f9cb5e'
      );

      expect(result.error).toBe(null);
      expect(result.data?.id).toBe('cadaff8e-4d85-42d6-9a52-c40239f9cb5e');
    });

    it('should handle validation error for missing parameters', async () => {
      const result = await maxclicks.objects.get('', '281cfdf5-c593-4c6c-a5d0-b51b813c217a');

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('invalid_parameter');
    });

    it('should handle not found error', async () => {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'not_found',
          message: 'Object not found',
        },
        requestId: 'req_not_found',
        timestamp: new Date().toISOString(),
      };

      mockErrorResponse(errorResponse, 404);

      const result = await maxclicks.objects.get('products', 'non-existent');

      expect(result.data).toBe(null);
      expect(result.error).toEqual(errorResponse);
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await maxclicks.objects.get(
        'products',
        '281cfdf5-c593-4c6c-a5d0-b51b813c217a'
      );

      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('application_error');
    });
  });

  describe('update / updateById', () => {
    it('should update an object successfully', async () => {
      const mockResponse: UpdateObjectResponse = {
        updatedAt: '2025-01-02T00:00:00Z',
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.objects.update(
        'products',
        '281cfdf5-c593-4c6c-a5d0-b51b813c217a',
        {
          attributeValuesByKey: {
            price: 79.99,
            category: 'sale',
          },
          tags: ['sale', 'clearance'],
        }
      );

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.maxclicks.ai/v1/objects/products/281cfdf5-c593-4c6c-a5d0-b51b813c217a',
        expect.objectContaining({
          method: 'PUT',
          body: expect.any(String),
        })
      );

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(callArgs[1].body as string);
      expect(body.attributeValuesByKey.price).toBe(79.99);

      expect(result.error).toBe(null);
      expect(result.data?.updatedAt).toBe('2025-01-02T00:00:00Z');
    });

    it('should update using updateById alias', async () => {
      const mockResponse: UpdateObjectResponse = {
        updatedAt: '2025-01-02T00:00:00Z',
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.objects.updateById(
        'products',
        '281cfdf5-c593-4c6c-a5d0-b51b813c217a',
        {
          notes: 'Updated notes',
        }
      );

      expect(result.error).toBe(null);
      expect(result.data?.updatedAt).toBe('2025-01-02T00:00:00Z');
    });

    it('should handle validation error for missing parameters', async () => {
      const result = await maxclicks.objects.update('', '281cfdf5-c593-4c6c-a5d0-b51b813c217a', {
        notes: 'Test',
      });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('invalid_parameter');
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await maxclicks.objects.update(
        'products',
        '281cfdf5-c593-4c6c-a5d0-b51b813c217a',
        {
          notes: 'Updated',
        }
      );

      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('application_error');
    });
  });

  describe('delete', () => {
    it('should delete an object by id', async () => {
      const mockResponse: DeleteObjectResponse = {
        id: '281cfdf5-c593-4c6c-a5d0-b51b813c217a',
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.objects.delete('products', {
        id: '281cfdf5-c593-4c6c-a5d0-b51b813c217a',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.maxclicks.ai/v1/objects/products',
        expect.objectContaining({
          method: 'DELETE',
        })
      );

      expect(result.error).toBe(null);
      expect(result.data?.id).toBe('281cfdf5-c593-4c6c-a5d0-b51b813c217a');
    });

    it('should delete an object by objectId', async () => {
      const mockResponse: DeleteObjectResponse = {
        id: 'cadaff8e-4d85-42d6-9a52-c40239f9cb5e',
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.objects.delete('products', {
        objectId: '0177d778-caa6-4b5c-a33c-047adb12c25a',
      });

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(callArgs[1].body as string);
      expect(body.objectId).toBe('0177d778-caa6-4b5c-a33c-047adb12c25a');

      expect(result.error).toBe(null);
    });

    it('should handle validation error for missing schemaSlug', async () => {
      const result = await maxclicks.objects.delete('', {
        id: '281cfdf5-c593-4c6c-a5d0-b51b813c217a',
      });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('invalid_parameter');
    });

    it('should handle validation error for missing identifiers', async () => {
      const result = await maxclicks.objects.delete('products', {});

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('invalid_parameter');
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await maxclicks.objects.delete('products', {
        id: '281cfdf5-c593-4c6c-a5d0-b51b813c217a',
      });

      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('application_error');
    });
  });

  describe('deleteById', () => {
    it('should delete an object by ID', async () => {
      const mockResponse: DeleteObjectByIdResponse = {};

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.objects.deleteById(
        'products',
        '281cfdf5-c593-4c6c-a5d0-b51b813c217a'
      );

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.maxclicks.ai/v1/objects/products/281cfdf5-c593-4c6c-a5d0-b51b813c217a',
        expect.objectContaining({
          method: 'DELETE',
        })
      );

      expect(result.error).toBe(null);
      expect(result.data).toEqual({});
    });

    it('should handle validation error for missing parameters', async () => {
      const result = await maxclicks.objects.deleteById('', '281cfdf5-c593-4c6c-a5d0-b51b813c217a');

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('invalid_parameter');
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await maxclicks.objects.deleteById(
        'products',
        '281cfdf5-c593-4c6c-a5d0-b51b813c217a'
      );

      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('application_error');
    });
  });

  describe('batch operations', () => {
    it('should create objects using batch().create()', async () => {
      const mockResponse: CreateObjectsBatchResponse = {
        objectIds: ['df55b88d-4eac-499e-a156-fe15c731f249', 'b0789650-0347-4e6d-9487-e861fe4c1183'],
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.objects
        .batch('products')
        .create([
          { attributeValuesByKey: { name: 'Widget 1' } },
          { attributeValuesByKey: { name: 'Widget 2' } },
        ]);

      expect(result.error).toBe(null);
      expect(result.data?.objectIds).toEqual([
        'df55b88d-4eac-499e-a156-fe15c731f249',
        'b0789650-0347-4e6d-9487-e861fe4c1183',
      ]);
    });
  });

  describe('namespace methods', () => {
    it('should access list through schemas.list()', async () => {
      const mockResponse: ListObjectSchemasResponse = {
        objects: [],
        pagination: {
          page: 1,
          per_page: 25,
          total_count: 0,
          total_pages: 0,
        },
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.objects.schemas.list();

      expect(result.error).toBe(null);
    });

    it('should access create through schemas.create()', async () => {
      const mockResponse: CreateObjectSchemaResponse = {
        schemaId: '80833935-7bd7-4822-bb69-717c455589b1',
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.objects.schemas.create({
        schema: {
          slug: 'new-schema',
        },
      });

      expect(result.error).toBe(null);
      expect(result.data?.schemaId).toBe('80833935-7bd7-4822-bb69-717c455589b1');
    });

    it('should access update through schemas.update()', async () => {
      const mockResponse: UpdateObjectSchemaResponse = {
        schemaUpdatedAt: 1704153600000,
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.objects.schemas.update({
        schemaId: '06e592cd-8f3d-4efe-9f9e-0a31b1e245ab23',
        schemaUpdates: {
          name: 'Updated Name',
        },
      });

      expect(result.error).toBe(null);
      expect(result.data?.schemaUpdatedAt).toBe(1704153600000);
    });
  });
});
