import type { Maxclicks } from '../maxclicks';
import type { ErrorResponse } from '../interfaces';
import { ErrorHelpers } from '../common/error-helpers';
import type {
  CreateEventRequest,
  CreateEventResponse,
  CreateEventSchemaRequest,
  CreateEventSchemaResponse,
  UpdateEventSchemaRequest,
  UpdateEventSchemaResponse,
  ListEventSchemasRequest,
  ListEventSchemasResponse,
  GetEventSchemaResponse,
} from './interfaces';
import { EventBuilder, SimpleEventBuilder } from './event-builder';

// Json type - matching API's Json payload type
// type Json = null | string | number | boolean | readonly Json[] | { readonly [key: string]: Json };

/**
 * Events - Complete Event Management with Schema Support
 *
 * Provides comprehensive event tracking and schema management capabilities
 * that exactly match the Public API endpoints.
 *
 * @example
 * ```typescript
 * // List event schemas
 * const schemas = await maxclicks.events.listSchemas({ page: 1, per_page: 20 });
 *
 * // Get specific event schema by slug
 * const schema = await maxclicks.events.getSchema('user-signup');
 *
 * // Create new event schema
 * const schemaResult = await maxclicks.events.createSchema({
 *   schema: {
 *     slug: 'user-signup',
 *     name: 'User Signup Event', // Optional - auto-generated if not provided
 *     description: 'Triggered when a user signs up',
 *     payloadJsonSchema: {
 *       type: 'object',
 *       properties: {
 *         email: { type: 'string', format: 'email' },
 *         plan: { type: 'string', enum: ['free', 'premium'] }
 *       },
 *       required: ['email']
 *     }
 *   }
 * });
 *
 * // Update event schema
 * const updateResult = await maxclicks.events.updateSchema({
 *   schemaId: 'schema-id-here',
 *   schemaUpdates: {
 *     name: 'Updated Name',
 *     description: 'Updated description'
 *   }
 * });
 *
 * // Track event instance
 * await maxclicks.events.track({
 *   name: 'User Signup',
 *   slug: 'user-signup',
 *   payload: { email: 'user@example.com', plan: 'premium' }
 * });
 * ```
 */
export class Events {
  constructor(private readonly sdk: Maxclicks) {}

  /**
   * Schema management methods
   */
  readonly schemas = {
    list: this.listSchemas.bind(this),
    get: this.getSchema.bind(this),
    create: this.createSchema.bind(this),
    update: this.updateSchema.bind(this),
  };

  /**
   * List all event schemas with pagination
   * Maps to GET /events/schema
   */
  async listSchemas(
    request: ListEventSchemasRequest = {}
  ): Promise<
    { data: ListEventSchemasResponse; error: null } | { data: null; error: ErrorResponse }
  > {
    const queryParams = new URLSearchParams();
    if (request.page !== undefined) queryParams.append('page', request.page.toString());
    if (request.per_page !== undefined) queryParams.append('per_page', request.per_page.toString());

    const queryString = queryParams.toString();
    const path = `/v1/events/schema${queryString ? `?${queryString}` : ''}`;

    return this.sdk.get<ListEventSchemasResponse>(path);
  }

  /**
   * Get a specific event schema by slug
   * Maps to GET /events/schema/:slug
   */
  async getSchema(
    slug: string
  ): Promise<{ data: GetEventSchemaResponse; error: null } | { data: null; error: ErrorResponse }> {
    if (!slug) {
      return {
        data: null,
        error: ErrorHelpers.validation('Event schema slug is required', { field: 'slug' }),
      };
    }

    return this.sdk.get<GetEventSchemaResponse>(`/v1/events/schema/${encodeURIComponent(slug)}`);
  }

  /**
   * Create a new event schema
   * Maps to POST /events/schema
   */
  async createSchema(
    request: CreateEventSchemaRequest
  ): Promise<
    { data: CreateEventSchemaResponse; error: null } | { data: null; error: ErrorResponse }
  > {
    if (!request.schema?.slug) {
      return {
        data: null,
        error: ErrorHelpers.validation('Event schema slug is required', { field: 'schema.slug' }),
      };
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(request.schema.slug)) {
      return {
        data: null,
        error: ErrorHelpers.validation(
          'Slug must contain only lowercase letters, numbers, and hyphens',
          {
            field: 'schema.slug',
            expected: 'Format like "user-signup" or "order-completed"',
          }
        ),
      };
    }

    return this.sdk.post<CreateEventSchemaResponse>('/v1/events/schema', request);
  }

  /**
   * Update an existing event schema by ID
   * Maps to PUT /events/schema
   */
  async updateSchema(
    request: UpdateEventSchemaRequest
  ): Promise<
    { data: UpdateEventSchemaResponse; error: null } | { data: null; error: ErrorResponse }
  > {
    if (!request.schemaId) {
      return {
        data: null,
        error: ErrorHelpers.validation('Schema ID is required', { field: 'schemaId' }),
      };
    }

    return this.sdk.put<UpdateEventSchemaResponse>('/v1/events/schema', request);
  }

  /**
   * Track an event instance against an existing schema
   * Maps to POST /events
   */
  async track(
    request: CreateEventRequest
  ): Promise<{ data: CreateEventResponse; error: null } | { data: null; error: ErrorResponse }> {
    if (!request.name && !request.slug) {
      return {
        data: null,
        error: ErrorHelpers.validation('Either event name or slug is required'),
      };
    }

    if (!request.payload) {
      return {
        data: null,
        error: ErrorHelpers.validation('Event payload is required', { field: 'payload' }),
      };
    }

    return this.sdk.post<CreateEventResponse>('/v1/events', request);
  }

  /**
   * Create a fluent builder for complex event schema creation
   * Provides chainable API for better developer experience
   */
  builder(): EventBuilder {
    return new EventBuilder(this.sdk);
  }

  /**
   * Create a simple event builder for tracking events against existing schemas
   */
  simpleBuilder(): SimpleEventBuilder {
    return new SimpleEventBuilder(this.sdk);
  }
}
