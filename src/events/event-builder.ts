/**
 * Event Builder with Fluent API
 * Provides a chainable, developer-friendly interface for creating events and event schemas
 * that matches the actual API structure
 */

import type { Maxclicks } from '../maxclicks';
import type { CreateEventResponse, CreateEventSchemaResponse } from './interfaces';
import type { ErrorResponse } from '../interfaces';
import { ErrorHelpers } from '../common/error-helpers';
import { Json } from './helpers/json-schema-helper';

/**
 * Validation result for event data
 */
interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    provided?: any;
    suggestion?: string;
  }>;
}

/**
 * Event Builder for creating event schemas
 * Maps directly to POST /events/schema endpoint
 *
 * @example
 * ```typescript
 * // Recommended: Rich schema definition
 * const result = await maxclicks.events.builder()
 *   .name('User Signup') // Optional - will be auto-generated from slug if not provided
 *   .slug('user-signup')
 *   .description('Triggered when a user signs up')
 *   .schema({
 *     type: 'object',
 *     properties: {
 *       email: { type: 'string', format: 'email' },
 *       plan: { type: 'string', enum: ['free', 'premium'] },
 *       timestamp: { type: 'string', format: 'date-time' },
 *       metadata: { type: 'object' }
 *     },
 *     required: ['email']
 *   })
 *   .execute();
 *
 * // Also valid: Minimal with auto-generated name
 * const simple = await maxclicks.events.builder()
 *   .slug('purchase-completed')
 *   .execute();
 * ```
 */
export class EventBuilder {
  private data: {
    name?: string;
    slug?: string;
    description?: string | null;
    payloadJsonSchema?: Json;
  } = {};

  constructor(private readonly sdk: Maxclicks) {}

  /**
   * Set the event schema name
   */
  name(name: string): this {
    this.data.name = name;
    return this;
  }

  /**
   * Set the event schema slug
   */
  slug(slug: string): this {
    this.data.slug = slug;
    return this;
  }

  /**
   * Set the event schema description
   */
  description(description: string | null): this {
    this.data.description = description;
    return this;
  }

  /**
   * Set the JSON schema for payload validation
   * Can use JsonSchemaBuilder for type-safe schema construction
   */
  schema(schema: Json): this {
    this.data.payloadJsonSchema = schema;
    return this;
  }

  /**
   * Build and validate the event schema before sending
   * Provides comprehensive validation and helpful error messages
   */
  validate(): ValidationResult {
    const errors: Array<{
      field: string;
      message: string;
      provided?: any;
      suggestion?: string;
    }> = [];

    // Slug is required
    if (!this.data.slug) {
      errors.push({
        field: 'slug',
        message: 'Event schema slug is required',
        suggestion: 'Provide a URL-friendly slug like "user-signup" or "purchase-completed"',
      });
    }

    // Validate slug format
    if (this.data.slug && !/^[a-z0-9-]+$/.test(this.data.slug)) {
      errors.push({
        field: 'slug',
        message: 'Slug must contain only lowercase letters, numbers, and hyphens',
        provided: this.data.slug,
        suggestion: 'Use a format like "user-signup" or "order-completed"',
      });
    }

    // Validate JSON schema format if provided
    if (this.data.payloadJsonSchema) {
      try {
        // Basic validation - ensure it's a valid object structure
        if (
          typeof this.data.payloadJsonSchema !== 'object' ||
          this.data.payloadJsonSchema === null
        ) {
          errors.push({
            field: 'payloadJsonSchema',
            message: 'JSON schema must be a valid object',
            suggestion: 'Use JsonSchemaBuilder for type-safe schema construction',
          });
        }
      } catch (error: any) {
        errors.push({
          field: 'payloadJsonSchema',
          message: 'Invalid JSON schema format',
          suggestion: 'Use JsonSchemaBuilder for type-safe schema construction',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Execute the event schema creation
   * Maps to POST /events/schema endpoint
   */
  async execute(): Promise<
    { data: CreateEventSchemaResponse; error: null } | { data: null; error: ErrorResponse }
  > {
    // Only validate critical errors that will definitely fail at API level
    if (!this.data.slug) {
      return {
        data: null,
        error: ErrorHelpers.validation('Slug is required', { field: 'slug' }),
      };
    }

    // Validate slug format (this will definitely fail at API level)
    if (!/^[a-z0-9-]+$/.test(this.data.slug)) {
      return {
        data: null,
        error: ErrorHelpers.validation(
          'Slug must contain only lowercase letters, numbers, and hyphens',
          { field: 'slug', expected: 'Format like "user-signup" or "order-completed"' }
        ),
      };
    }

    return this.sdk.post<CreateEventSchemaResponse>('/v1/events/schema', {
      schema: {
        name: this.data.name,
        slug: this.data.slug,
        description: this.data.description,
        payloadJsonSchema: this.data.payloadJsonSchema,
      },
    });
  }
}

/**
 * Simple Event Builder for tracking events against existing schemas
 * Maps to POST /events endpoint
 */
export class SimpleEventBuilder {
  private data: {
    eventId?: string;
    name?: string;
    slug?: string;
    userId?: string;
    payload?: Json;
  } = {};

  constructor(private readonly sdk: Maxclicks) {}

  /**
   * Set the event ID (optional, for deduplication)
   */
  eventId(eventId: string): this {
    this.data.eventId = eventId;
    return this;
  }

  /**
   * Set the event schema name
   */
  name(name: string): this {
    this.data.name = name;
    return this;
  }

  /**
   * Set the event schema slug
   */
  slug(slug: string): this {
    this.data.slug = slug;
    return this;
  }

  /**
   * Set the user ID associated with this event
   */
  userId(userId: string): this {
    this.data.userId = userId;
    return this;
  }

  /**
   * Set the event payload
   */
  payload(payload: Json): this {
    this.data.payload = payload;
    return this;
  }

  /**
   * Execute the event tracking
   * Maps to POST /events endpoint
   */
  async execute(): Promise<
    { data: CreateEventResponse; error: null } | { data: null; error: ErrorResponse }
  > {
    if (!this.data.payload) {
      return {
        data: null,
        error: ErrorHelpers.validation('Payload is required', { field: 'payload' }),
      };
    }

    return this.sdk.post<CreateEventResponse>('/v1/events', this.data);
  }
}

export default { EventBuilder, SimpleEventBuilder };
