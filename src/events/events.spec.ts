import { vi, describe, beforeEach, it, expect } from 'vitest';
import { Maxclicks } from '../maxclicks';
import type {
  CreateEventResponse,
  CreateEventSchemaResponse,
  UpdateEventSchemaResponse,
  ListEventSchemasResponse,
  GetEventSchemaResponse,
} from './interfaces';
import type { ErrorResponse } from '../interfaces';
import { TEST_BASE_URL, TEST_API_KEY } from '../test-utils/test-config';

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

describe('Events', () => {
  let maxclicks: Maxclicks;

  beforeEach(() => {
    fetchMock.mockReset();
    maxclicks = new Maxclicks(TEST_API_KEY);
  });

  describe('createSchema', () => {
    it('should create an event schema successfully', async () => {
      const mockResponse: CreateEventSchemaResponse = {
        schemaId: 'schema-123',
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.events.createSchema({
        schema: {
          slug: 'user-signup',
          name: 'User Signup',
          description: 'Triggered when a user signs up',
          payloadJsonSchema: {
            type: 'object',
            properties: {
              email: { type: 'string', format: 'email' },
              plan: { type: 'string', enum: ['free', 'premium'] },
            },
            required: ['email'],
          },
        },
      });

      expect(fetchMock).toHaveBeenCalledWith(
        `${TEST_BASE_URL}/v1/events/schema`,
        expect.objectContaining({
          method: 'POST',
          body: expect.any(String),
        })
      );

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(callArgs[1].body as string);
      expect(body.schema.slug).toBe('user-signup');
      expect(body.schema.name).toBe('User Signup');
      expect(body.schema.payloadJsonSchema.type).toBe('object');

      expect(result.error).toBe(null);
      expect(result.data?.schemaId).toBe('schema-123');
    });

    it('should create an event schema with minimal data (auto-generated name)', async () => {
      const mockResponse: CreateEventSchemaResponse = {
        schemaId: 'schema-456',
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.events.createSchema({
        schema: {
          slug: 'purchase-completed',
        },
      });

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(callArgs[1].body as string);
      expect(body.schema.slug).toBe('purchase-completed');
      expect(body.schema.name).toBeUndefined();

      expect(result.error).toBe(null);
      expect(result.data?.schemaId).toBe('schema-456');
    });

    it('should handle validation error for missing slug', async () => {
      const result = await maxclicks.events.createSchema({
        schema: {
          name: 'Test Event',
        } as any,
      });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('validation_error');
      expect(result.error?.error.message).toContain('slug is required');
    });

    it('should handle validation error for invalid slug format', async () => {
      const result = await maxclicks.events.createSchema({
        schema: {
          slug: 'Invalid Slug With Spaces',
        },
      });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('validation_error');
      expect(result.error?.error.message).toContain('lowercase letters, numbers, and hyphens');
    });

    it('should handle duplicate slug error from API', async () => {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'validation_error',
          message: 'Event schema with slug "user-signup" already exists',
        },
        requestId: 'req_duplicate',
        timestamp: new Date().toISOString(),
      };

      mockErrorResponse(errorResponse, 422);

      const result = await maxclicks.events.createSchema({
        schema: {
          slug: 'user-signup',
        },
      });

      expect(result.data).toBe(null);
      expect(result.error).toEqual(errorResponse);
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await maxclicks.events.createSchema({
        schema: {
          slug: 'test-event',
        },
      });

      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('application_error');
    });
  });

  describe('createSchema (fluent builder)', () => {
    it('should create an event schema using fluent API', async () => {
      const mockResponse: CreateEventSchemaResponse = {
        schemaId: 'schema-builder-1',
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.events
        .builder()
        .slug('user-login')
        .name('User Login')
        .description('Triggered when a user logs in')
        .schema({
          type: 'object',
          properties: {
            userId: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
          required: ['userId'],
        })
        .execute();

      expect(result.error).toBe(null);
      expect(result.data?.schemaId).toBe('schema-builder-1');
    });

    it('should create minimal schema with only slug using fluent API', async () => {
      const mockResponse: CreateEventSchemaResponse = {
        schemaId: 'schema-builder-2',
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.events.builder().slug('order-shipped').execute();

      expect(result.error).toBe(null);
      expect(result.data?.schemaId).toBe('schema-builder-2');
    });

    it('should validate slug before executing', async () => {
      const result = await maxclicks.events.builder().name('No Slug Event').execute();

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('validation_error');
      expect(result.error?.error.message).toContain('Slug is required');
    });

    it('should validate slug format before executing', async () => {
      const result = await maxclicks.events.builder().slug('Invalid Slug!').execute();

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('validation_error');
      expect(result.error?.error.message).toContain('lowercase letters, numbers, and hyphens');
    });
  });

  describe('listSchemas', () => {
    it('should list event schemas with pagination', async () => {
      const mockResponse: ListEventSchemasResponse = {
        events: [
          {
            id: 'schema-1',
            name: 'User Signup',
            slug: 'user-signup',
            description: 'Signup event',
            createdAt: 1704067200000,
            updatedAt: 1704067200000,
            eventsCount: 100,
          },
          {
            id: 'schema-2',
            name: 'Purchase Completed',
            slug: 'purchase-completed',
            description: null,
            createdAt: 1704067200000,
            updatedAt: 1704067200000,
            eventsCount: 50,
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

      const result = await maxclicks.events.listSchemas();

      expect(fetchMock).toHaveBeenCalledWith(
        `${TEST_BASE_URL}/v1/events/schema`,
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result.error).toBe(null);
      expect(result.data?.events).toHaveLength(2);
      expect(result.data?.pagination.total_count).toBe(2);
    });

    it('should support pagination options', async () => {
      const mockResponse: ListEventSchemasResponse = {
        events: [],
        pagination: {
          page: 2,
          per_page: 50,
          total_count: 100,
          total_pages: 2,
        },
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.events.listSchemas({ page: 2, per_page: 50 });

      expect(fetchMock).toHaveBeenCalledWith(
        `${TEST_BASE_URL}/v1/events/schema?page=2&per_page=50`,
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result.error).toBe(null);
      expect(result.data?.pagination.page).toBe(2);
      expect(result.data?.pagination.per_page).toBe(50);
    });

    it('should return empty array when no schemas exist', async () => {
      const mockResponse: ListEventSchemasResponse = {
        events: [],
        pagination: {
          page: 1,
          per_page: 25,
          total_count: 0,
          total_pages: 0,
        },
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.events.listSchemas();

      expect(result.error).toBe(null);
      expect(result.data?.events).toHaveLength(0);
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await maxclicks.events.listSchemas();

      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('application_error');
    });
  });

  describe('getSchema', () => {
    it('should retrieve an event schema by slug', async () => {
      const mockResponse: GetEventSchemaResponse = {
        id: 'schema-123',
        name: 'User Signup',
        slug: 'user-signup',
        description: 'Triggered when a user signs up',
        createdAt: 1704067200000,
        updatedAt: 1704067200000,
        eventsCount: 500,
        source: 'api' as any,
        payloadJsonSchema: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
          },
          required: ['email'],
        },
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.events.getSchema('user-signup');

      expect(fetchMock).toHaveBeenCalledWith(
        `${TEST_BASE_URL}/v1/events/schema/user-signup`,
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result.error).toBe(null);
      expect(result.data?.id).toBe('schema-123');
      expect(result.data?.slug).toBe('user-signup');
      expect(result.data?.payloadJsonSchema).toBeDefined();
    });

    it('should handle validation error for missing slug', async () => {
      const result = await maxclicks.events.getSchema('');

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('validation_error');
      expect(result.error?.error.message).toContain('slug is required');
    });

    it('should handle not found error', async () => {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'not_found',
          message: 'Event schema not found',
        },
        requestId: 'req_not_found',
        timestamp: new Date().toISOString(),
      };

      mockErrorResponse(errorResponse, 404);

      const result = await maxclicks.events.getSchema('non-existent');

      expect(result.data).toBe(null);
      expect(result.error).toEqual(errorResponse);
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await maxclicks.events.getSchema('user-signup');

      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('application_error');
    });
  });

  describe('updateSchema', () => {
    it('should update an event schema successfully', async () => {
      const mockResponse: UpdateEventSchemaResponse = {
        schemaUpdatedAt: 1704153600000,
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.events.updateSchema({
        schemaId: 'schema-123',
        schemaUpdates: {
          name: 'Updated User Signup',
          description: 'Updated description',
        },
      });

      expect(fetchMock).toHaveBeenCalledWith(
        `${TEST_BASE_URL}/v1/events/schema`,
        expect.objectContaining({
          method: 'PUT',
          body: expect.any(String),
        })
      );

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(callArgs[1].body as string);
      expect(body.schemaId).toBe('schema-123');
      expect(body.schemaUpdates.name).toBe('Updated User Signup');

      expect(result.error).toBe(null);
      expect(result.data?.schemaUpdatedAt).toBe(1704153600000);
    });

    it('should update schema JSON schema', async () => {
      const mockResponse: UpdateEventSchemaResponse = {
        schemaUpdatedAt: 1704153600000,
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.events.updateSchema({
        schemaId: 'schema-123',
        schemaUpdates: {
          payloadJsonSchema: {
            type: 'object',
            properties: {
              email: { type: 'string', format: 'email' },
              plan: { type: 'string', enum: ['free', 'premium', 'enterprise'] },
            },
            required: ['email', 'plan'],
          },
        },
      });

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(callArgs[1].body as string);
      expect(body.schemaUpdates.payloadJsonSchema).toBeDefined();
      expect(body.schemaUpdates.payloadJsonSchema.properties.plan.enum).toHaveLength(3);

      expect(result.error).toBe(null);
    });

    it('should handle validation error for missing schemaId', async () => {
      const result = await maxclicks.events.updateSchema({
        schemaId: '',
        schemaUpdates: {
          name: 'Updated Name',
        },
      });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('validation_error');
      expect(result.error?.error.message).toContain('Schema ID is required');
    });

    it('should handle not found error', async () => {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'not_found',
          message: 'Event schema not found',
        },
        requestId: 'req_not_found',
        timestamp: new Date().toISOString(),
      };

      mockErrorResponse(errorResponse, 404);

      const result = await maxclicks.events.updateSchema({
        schemaId: 'non-existent',
        schemaUpdates: {
          name: 'Updated Name',
        },
      });

      expect(result.data).toBe(null);
      expect(result.error).toEqual(errorResponse);
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await maxclicks.events.updateSchema({
        schemaId: 'schema-123',
        schemaUpdates: {
          name: 'Updated Name',
        },
      });

      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('application_error');
    });
  });

  describe('track', () => {
    it('should track an event successfully', async () => {
      const mockResponse: CreateEventResponse = {};

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.events.track({
        name: 'User Signup',
        slug: 'user-signup',
        payload: {
          email: 'user@example.com',
          plan: 'premium',
          timestamp: new Date().toISOString(),
        },
      });

      expect(fetchMock).toHaveBeenCalledWith(
        `${TEST_BASE_URL}/v1/events`,
        expect.objectContaining({
          method: 'POST',
          body: expect.any(String),
        })
      );

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(callArgs[1].body as string);
      expect(body.name).toBe('User Signup');
      expect(body.slug).toBe('user-signup');
      expect(body.payload.email).toBe('user@example.com');

      expect(result.error).toBe(null);
    });

    it('should track an event with userId', async () => {
      const mockResponse: CreateEventResponse = {};

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.events.track({
        name: 'Purchase Completed',
        slug: 'purchase-completed',
        userId: 'user-123',
        payload: {
          orderId: 'order-456',
          amount: 99.99,
        },
      });

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(callArgs[1].body as string);
      expect(body.userId).toBe('user-123');

      expect(result.error).toBe(null);
    });

    it('should track an event with eventId for deduplication', async () => {
      const mockResponse: CreateEventResponse = {};

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.events.track({
        eventId: 'unique-event-123',
        name: 'Order Shipped',
        slug: 'order-shipped',
        payload: {
          trackingNumber: 'TRACK-123',
        },
      });

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(callArgs[1].body as string);
      expect(body.eventId).toBe('unique-event-123');

      expect(result.error).toBe(null);
    });

    it('should handle validation error for missing name and slug', async () => {
      const result = await maxclicks.events.track({
        payload: { test: 'data' },
      } as any);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('validation_error');
      expect(result.error?.error.message).toContain('name or slug is required');
    });

    it('should handle validation error for missing payload', async () => {
      const result = await maxclicks.events.track({
        name: 'Test Event',
        slug: 'test-event',
      } as any);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('validation_error');
      expect(result.error?.error.message).toContain('payload is required');
    });

    it('should handle schema validation error from API', async () => {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'validation_error',
          message: 'Payload does not match event schema',
        },
        requestId: 'req_validation',
        timestamp: new Date().toISOString(),
      };

      mockErrorResponse(errorResponse, 422);

      const result = await maxclicks.events.track({
        name: 'User Signup',
        slug: 'user-signup',
        payload: {
          invalid: 'data',
        },
      });

      expect(result.data).toBe(null);
      expect(result.error).toEqual(errorResponse);
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await maxclicks.events.track({
        name: 'Test Event',
        slug: 'test-event',
        payload: { test: 'data' },
      });

      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('application_error');
    });
  });

  describe('track (simple builder)', () => {
    it('should track an event using simple builder', async () => {
      const mockResponse: CreateEventResponse = {};

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.events
        .simpleBuilder()
        .name('Page View')
        .slug('page-view')
        .userId('user-789')
        .payload({
          url: '/dashboard',
          referrer: 'https://google.com',
        })
        .execute();

      expect(result.error).toBe(null);
    });

    it('should track an event with eventId using simple builder', async () => {
      const mockResponse: CreateEventResponse = {};

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.events
        .simpleBuilder()
        .eventId('dedup-event-456')
        .name('Button Click')
        .slug('button-click')
        .payload({
          buttonId: 'submit-btn',
        })
        .execute();

      expect(result.error).toBe(null);
    });

    it('should validate payload before executing', async () => {
      const result = await maxclicks.events
        .simpleBuilder()
        .name('Test Event')
        .slug('test-event')
        .execute();

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('validation_error');
      expect(result.error?.error.message).toContain('Payload is required');
    });
  });

  describe('schemas namespace', () => {
    it('should access list through schemas.list()', async () => {
      const mockResponse: ListEventSchemasResponse = {
        events: [],
        pagination: {
          page: 1,
          per_page: 25,
          total_count: 0,
          total_pages: 0,
        },
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.events.schemas.list();

      expect(result.error).toBe(null);
      expect(result.data?.events).toHaveLength(0);
    });

    it('should access get through schemas.get()', async () => {
      const mockResponse: GetEventSchemaResponse = {
        id: 'schema-123',
        name: 'Test Schema',
        slug: 'test-schema',
        description: null,
        createdAt: 1704067200000,
        updatedAt: 1704067200000,
        eventsCount: 0,
        source: 'api' as any,
        payloadJsonSchema: { type: 'object' },
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.events.schemas.get('test-schema');

      expect(result.error).toBe(null);
      expect(result.data?.slug).toBe('test-schema');
    });

    it('should access create through schemas.create()', async () => {
      const mockResponse: CreateEventSchemaResponse = {
        schemaId: 'schema-new',
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.events.schemas.create({
        schema: {
          slug: 'new-schema',
        },
      });

      expect(result.error).toBe(null);
      expect(result.data?.schemaId).toBe('schema-new');
    });

    it('should access update through schemas.update()', async () => {
      const mockResponse: UpdateEventSchemaResponse = {
        schemaUpdatedAt: 1704153600000,
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.events.schemas.update({
        schemaId: 'schema-123',
        schemaUpdates: {
          name: 'Updated Name',
        },
      });

      expect(result.error).toBe(null);
      expect(result.data?.schemaUpdatedAt).toBe(1704153600000);
    });
  });
});
