/**
 * Object Builder with Fluent API
 * Provides a chainable, developer-friendly interface for creating objects
 * with intelligent attribute validation and schema management
 */

import type { Maxclicks } from '../maxclicks';
import type {
  CreateObjectRequest,
  CreateObjectResponse,
  CreateObjectSchemaRequest,
  CreateObjectSchemaResponse,
} from './interfaces';
import { ObjectAttributeHelper } from './helpers/object-attribute-helper';
import { ErrorResponse } from '../interfaces';

/**
 * Validation result for object data
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
 * Object Builder for creating objects with intelligent attribute management
 * Provides fluent API for complex object creation scenarios
 *
 * @example
 * ```typescript
 * // Create object with attribute validation
 * const result = await maxclicks.objects.builder()
 *   .schema('products')
 *   .objectId('prod-123')
 *   .attribute('name', 'Premium Widget')
 *   .attribute('price', 99.99)
 *   .attribute('category', 'electronics')
 *   .attribute('features', ['wireless', 'bluetooth', 'premium'])
 *   .tags(['premium', 'featured'])
 *   .notes('Special product configuration')
 *   .execute();
 *
 * // Auto-create missing attributes
 * const autoResult = await maxclicks.objects.builder()
 *   .schema('customers')
 *   .objectId('cust-456')
 *   .attribute('email', 'customer@example.com')
 *   .attribute('plan', 'enterprise')
 *   .attribute('signup_date', new Date().toISOString())
 *   .autoCreateMissingAttributes(true)
 *   .execute();
 *
 * // Validate before creating
 * const builder = maxclicks.objects.builder()
 *   .schema('orders')
 *   .attribute('total', 299.99)
 *   .attribute('status', 'pending');
 *
 * const validation = await builder.validate();
 * if (!validation.isValid) {
 *   console.log('Validation errors:', validation.errors);
 * } else {
 *   const result = await builder.execute();
 * }
 * ```
 */
export class ObjectBuilder {
  private data: {
    schemaSlug?: string;
    id?: string | null;
    objectId?: string | null;
    notes?: string | null;
    tags?: string[];
    attributeValuesByKey?: Record<string, any>;
    autoCreateMissingAttributes?: boolean;
  } = {};

  private attributeHelper: ObjectAttributeHelper;

  constructor(private readonly sdk: Maxclicks) {
    this.attributeHelper = new ObjectAttributeHelper(sdk);
  }

  /**
   * Set the object schema slug
   */
  schema(schemaSlug: string): this {
    this.data.schemaSlug = schemaSlug;
    return this;
  }

  /**
   * Set the database ID (for updates)
   */
  id(id: string): this {
    this.data.id = id;
    return this;
  }

  /**
   * Set the custom object ID
   */
  objectId(objectId: string): this {
    this.data.objectId = objectId;
    return this;
  }

  /**
   * Set notes for the object
   */
  notes(notes: string): this {
    this.data.notes = notes;
    return this;
  }

  /**
   * Set tags for the object
   */
  tags(tags: string[]): this {
    this.data.tags = tags;
    return this;
  }

  /**
   * Add a single tag
   */
  tag(tag: string): this {
    if (!this.data.tags) {
      this.data.tags = [];
    }
    if (!this.data.tags.includes(tag)) {
      this.data.tags.push(tag);
    }
    return this;
  }

  /**
   * Set all attributes at once
   */
  attributes(attributes: Record<string, any>): this {
    this.data.attributeValuesByKey = { ...attributes };
    return this;
  }

  /**
   * Set a single attribute
   */
  attribute(key: string, value: any): this {
    if (!this.data.attributeValuesByKey) {
      this.data.attributeValuesByKey = {};
    }
    this.data.attributeValuesByKey[key] = value;
    return this;
  }

  /**
   * Enable automatic creation of missing attributes
   */
  autoCreateMissingAttributes(enabled: boolean = true): this {
    this.data.autoCreateMissingAttributes = enabled;
    return this;
  }

  /**
   * Build and validate the object data
   * Provides comprehensive validation with attribute checking
   */
  async validate(): Promise<ValidationResult> {
    const errors: Array<{
      field: string;
      message: string;
      provided?: any;
      suggestion?: string;
    }> = [];

    // Schema slug is required
    if (!this.data.schemaSlug) {
      errors.push({
        field: 'schemaSlug',
        message: 'Object schema slug is required',
        suggestion: 'Call .schema() method to set the object schema slug',
      });
      return { isValid: false, errors };
    }

    // Validate attributes against schema if provided
    if (this.data.attributeValuesByKey && Object.keys(this.data.attributeValuesByKey).length > 0) {
      try {
        const attributeValidation = await this.attributeHelper.validateObjectAttributes(
          this.data.schemaSlug,
          this.data.attributeValuesByKey
        );

        if (!attributeValidation.isValid) {
          errors.push(...attributeValidation.errors);
        }

        // Warn about missing attributes if not auto-creating
        if (
          attributeValidation.missingAttributes.length > 0 &&
          !this.data.autoCreateMissingAttributes
        ) {
          for (const missingAttr of attributeValidation.missingAttributes) {
            errors.push({
              field: `attribute.${missingAttr.key}`,
              message: `Attribute '${missingAttr.key}' does not exist in schema`,
              suggestion: `Create the attribute first or enable autoCreateMissingAttributes()`,
            });
          }
        }
      } catch (error: any) {
        errors.push({
          field: 'attributeValidation',
          message: `Failed to validate attributes: ${error.message}`,
          suggestion: 'Check if the schema exists and is accessible',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Execute the object creation
   * Maps to POST /objects/:slug endpoint
   */
  async execute(): Promise<
    { data: CreateObjectResponse; error: null } | { data: null; error: ErrorResponse }
  > {
    // Basic validation
    if (!this.data.schemaSlug) {
      return {
        data: null,
        error: {
          success: false,
          error: {
            code: 'missing_required_field',
            message: 'Schema slug is required',
            details: {
              field: 'schemaSlug',
              suggestions: ['Call .schema() method to set the object schema slug'],
            },
          },
          requestId: '',
          timestamp: new Date().toISOString(),
        } as ErrorResponse,
      };
    }

    // Auto-create missing attributes if enabled
    if (this.data.autoCreateMissingAttributes && this.data.attributeValuesByKey) {
      try {
        // First validate to get missing attributes
        const attributeValidation = await this.attributeHelper.validateObjectAttributes(
          this.data.schemaSlug,
          this.data.attributeValuesByKey
        );

        if (attributeValidation.missingAttributes.length > 0) {
          await this.attributeHelper.createMissingAttributes(
            this.data.schemaSlug,
            attributeValidation.missingAttributes
          );
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
          data: null,
          error: {
            success: false,
            error: {
              code: 'validation_error',
              message: `Failed to auto-create attributes: ${errorMessage}`,
              details: { suggestions: ['Check attribute values and schema permissions'] },
            },
            requestId: '',
            timestamp: new Date().toISOString(),
          } as ErrorResponse,
        };
      }
    }

    // Filter out invalid attributes if not auto-creating
    let finalAttributes = this.data.attributeValuesByKey;
    if (!this.data.autoCreateMissingAttributes && this.data.attributeValuesByKey) {
      try {
        finalAttributes = await this.attributeHelper.filterValidAttributes(
          this.data.schemaSlug,
          this.data.attributeValuesByKey
        );
      } catch (error: any) {
        // Continue with original attributes if filtering fails
        finalAttributes = this.data.attributeValuesByKey;
      }
    }

    const objectData: CreateObjectRequest = {
      id: this.data.id,
      objectId: this.data.objectId,
      notes: this.data.notes,
      tags: this.data.tags,
      attributeValuesByKey: finalAttributes,
    };

    return this.sdk.post<CreateObjectResponse>(
      `/v1/objects/${encodeURIComponent(this.data.schemaSlug)}`,
      objectData
    );
  }

  /**
   * Preview the request that would be sent without executing it
   * Useful for debugging and testing
   */
  preview(): {
    url: string;
    method: string;
    body: CreateObjectRequest;
  } {
    return {
      url: `/v1/objects/${encodeURIComponent(this.data.schemaSlug || '')}`,
      method: 'POST',
      body: {
        id: this.data.id,
        objectId: this.data.objectId,
        notes: this.data.notes,
        tags: this.data.tags,
        attributeValuesByKey: this.data.attributeValuesByKey,
      },
    };
  }
}

/**
 * Schema Builder for creating object schemas
 * Provides fluent API for schema creation
 */
export class ObjectSchemaBuilder {
  private data: {
    name?: string;
    slug?: string;
    description?: string | null;
  } = {};

  constructor(private readonly sdk: Maxclicks) {}

  /**
   * Set the schema name
   */
  name(name: string): this {
    this.data.name = name;
    return this;
  }

  /**
   * Set the schema slug
   */
  slug(slug: string): this {
    this.data.slug = slug;
    return this;
  }

  /**
   * Set the schema description
   */
  description(description: string | null): this {
    this.data.description = description;
    return this;
  }

  /**
   * Execute the schema creation
   * Maps to POST /objects endpoint
   */
  async execute(): Promise<
    { data: CreateObjectSchemaResponse; error: null } | { data: null; error: ErrorResponse }
  > {
    if (!this.data.slug) {
      return {
        data: null,
        error: {
          success: false,
          error: {
            code: 'missing_required_field',
            message: 'Schema slug is required',
            details: { suggestions: ['Call .slug() to set the schema slug'] },
          },
          requestId: '',
          timestamp: new Date().toISOString(),
        } as ErrorResponse,
      };
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(this.data.slug)) {
      return {
        data: null,
        error: {
          success: false,
          error: {
            code: 'validation_error',
            message: 'Slug must contain only lowercase letters, numbers, and hyphens',
            details: {
              field: 'slug',
              suggestions: ['Use a format like "products" or "product-catalog"'],
            },
          },
          requestId: '',
          timestamp: new Date().toISOString(),
        } as ErrorResponse,
      };
    }

    const schemaRequest: CreateObjectSchemaRequest = {
      schema: {
        slug: this.data.slug,
        ...(this.data.name ? { name: this.data.name } : {}),
        description: this.data.description,
      },
    };

    return this.sdk.post<CreateObjectSchemaResponse>('/v1/objects/schema', schemaRequest);
  }
}

export default { ObjectBuilder, ObjectSchemaBuilder };
