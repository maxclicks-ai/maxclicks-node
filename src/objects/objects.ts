import { Maxclicks } from '../maxclicks';
import { ErrorResponse } from '../interfaces';
import { ErrorHelpers } from '../common/error-helpers';
import {
  CreateObjectRequest,
  CreateObjectResponse,
  CreateObjectsBatchResponse,
  CreateObjectSchemaRequest,
  CreateObjectSchemaResponse,
  ListObjectsOptions,
  ListObjectsResponse,
  ListObjectSchemasResponse,
  Object as ObjectType,
  UpdateObjectResponse,
  DeleteObjectRequest,
  DeleteObjectResponse,
  DeleteObjectByIdResponse,
  UpdateObjectSchemaRequest,
  UpdateObjectSchemaResponse,
} from './interfaces';
import { ObjectBuilder, ObjectSchemaBuilder } from './object-builder';

/**
 * Objects - Complete Object Management
 *
 * Provides comprehensive object operations within existing schemas.
 * Schema management should be done through the web interface or other APIs.
 *
 * @example
 * ```typescript
 * // List object schemas
 * const schemas = await maxclicks.objects.listSchemas({ page: 1, per_page: 20 });
 *
 * // List objects in a schema
 * const objects = await maxclicks.objects.list('products', { page: 1, per_page: 20 });
 *
 * // Create single object
 * const product = await maxclicks.objects.create('products', {
 *   objectId: 'prod-123',
 *   attributeValuesByKey: {
 *     name: 'Premium Widget',
 *     price: 99.99,
 *     category: 'electronics'
 *   }
 * });
 *
 * // Create multiple objects
 * const products = await maxclicks.objects.createBatch('products', [
 *   { objectId: 'prod-124', attributeValuesByKey: { name: 'Basic Widget', price: 29.99 } },
 *   { objectId: 'prod-125', attributeValuesByKey: { name: 'Pro Widget', price: 149.99 } }
 * ]);
 *
 * // Use fluent builder for complex scenarios
 * const complexObject = await maxclicks.objects.builder()
 *   .schema('products')
 *   .objectId('prod-126')
 *   .attribute('name', 'Enterprise Widget')
 *   .attribute('price', 299.99)
 *   .attribute('features', ['advanced', 'enterprise', 'support'])
 *   .tags(['premium', 'enterprise'])
 *   .notes('Special enterprise configuration')
 *   .execute();
 * ```
 */
export class Objects {
  constructor(private readonly sdk: Maxclicks) {}

  /**
   * Schema management methods
   */
  readonly schemas = {
    list: this.listSchemas.bind(this),
    create: this.createSchema.bind(this),
    update: this.updateSchema.bind(this),
  };

  readonly objects = {
    list: this.list.bind(this),
    get: this.get.bind(this),
    create: this.create.bind(this),
    createBatch: this.createBatch.bind(this),
    update: this.update.bind(this),
    delete: this.delete.bind(this),
    deleteById: this.deleteById.bind(this),
  };
  /**
   * Batch operations for multiple objects
   */
  batch(schemaSlug: string) {
    return {
      create: (objects: CreateObjectRequest[]) => this.createBatch(schemaSlug, objects),
    };
  }

  /**
   * Alias for get method - get object by ID
   */
  getById(schemaSlug: string, objectId: string) {
    return this.get(schemaSlug, objectId);
  }

  /**
   * Alias for update method - update object by ID
   */
  updateById(schemaSlug: string, objectId: string, updates: CreateObjectRequest) {
    return this.update(schemaSlug, objectId, updates);
  }

  /**
   * List all object schemas with pagination
   * Maps to GET /objects/schema endpoint
   */
  async listSchemas(
    options: { page?: number; per_page?: number } = {}
  ): Promise<
    { data: ListObjectSchemasResponse; error: null } | { data: null; error: ErrorResponse }
  > {
    const queryParams = new URLSearchParams();
    if (options.page !== undefined) queryParams.append('page', options.page.toString());
    if (options.per_page !== undefined) queryParams.append('per_page', options.per_page.toString());

    const queryString = queryParams.toString();
    const path = `/v1/objects/schema${queryString ? `?${queryString}` : ''}`;

    return this.sdk.get<ListObjectSchemasResponse>(path);
  }

  /**
   * Create a new object schema
   * Maps to POST /objects/schema endpoint
   */
  async createSchema(
    request: CreateObjectSchemaRequest
  ): Promise<
    { data: CreateObjectSchemaResponse; error: null } | { data: null; error: ErrorResponse }
  > {
    if (!request?.schema?.slug?.trim()) {
      return { data: null, error: ErrorHelpers.invalidParameter('schema.slug', 'a non-empty slug') };
    }

    return this.sdk.post<CreateObjectSchemaResponse>('/v1/objects/schema', request);
  }

  /**
   * List objects in a specific schema with pagination
   * Maps to GET /objects/:slug endpoint
   */
  async list(
    schemaSlug: string,
    options: ListObjectsOptions = {}
  ): Promise<{ data: ListObjectsResponse; error: null } | { data: null; error: ErrorResponse }> {
    if (!schemaSlug) {
      return {
        data: null,
        error: ErrorHelpers.invalidParameter('schemaSlug', 'a valid object schema slug'),
      };
    }

    const queryParams = new URLSearchParams();
    if (options.page !== undefined) queryParams.append('page', options.page.toString());
    if (options.per_page !== undefined) queryParams.append('per_page', options.per_page.toString());

    const queryString = queryParams.toString();
    const path = `/v1/objects/${encodeURIComponent(schemaSlug)}${queryString ? `?${queryString}` : ''}`;

    return this.sdk.get<ListObjectsResponse>(path);
  }

  /**
   * Get a specific object by ID
   * Maps to GET /objects/:slug/:id endpoint
   */
  async get(
    schemaSlug: string,
    objectId: string
  ): Promise<{ data: ObjectType; error: null } | { data: null; error: ErrorResponse }> {
    if (!schemaSlug || !objectId) {
      return {
        data: null,
        error: ErrorHelpers.invalidParameter('object lookup', 'both schemaSlug and objectId'),
      };
    }

    return this.sdk.get<ObjectType>(
      `/v1/objects/${encodeURIComponent(schemaSlug)}/${encodeURIComponent(objectId)}`
    );
  }

  /**
   * Create a single object in a schema
   * Maps to POST /objects/:slug endpoint
   */
  async create(
    schemaSlug: string,
    request: CreateObjectRequest
  ): Promise<{ data: CreateObjectResponse; error: null } | { data: null; error: ErrorResponse }> {
    if (!schemaSlug) {
      return {
        data: null,
        error: ErrorHelpers.invalidParameter('schemaSlug', 'a valid object schema slug'),
      };
    }

    return this.sdk.post<CreateObjectResponse>(
      `/v1/objects/${encodeURIComponent(schemaSlug)}`,
      request
    );
  }

  /**
   * Create multiple objects in a schema
   * Maps to POST /objects/:slug/batch endpoint
   */
  async createBatch(
    schemaSlug: string,
    objects: CreateObjectRequest[]
  ): Promise<
    { data: CreateObjectsBatchResponse; error: null } | { data: null; error: ErrorResponse }
  > {
    if (!schemaSlug) {
      return {
        data: null,
        error: ErrorHelpers.invalidParameter('schemaSlug', 'a valid object schema slug'),
      };
    }

    if (!objects?.length) {
      return {
        data: null,
        error: ErrorHelpers.invalidParameter('objects', 'a non-empty array of objects to create'),
      };
    }

    // API expects the array directly, not wrapped in an object
    return this.sdk.post<CreateObjectsBatchResponse>(
      `/v1/objects/${encodeURIComponent(schemaSlug)}/batch`,
      objects
    );
  }

  /**
   * Update an existing object
   * Maps to PUT /objects/:slug/:id endpoint
   */
  async update(
    schemaSlug: string,
    objectId: string,
    updates: Omit<CreateObjectRequest, 'id'>
  ): Promise<{ data: UpdateObjectResponse; error: null } | { data: null; error: ErrorResponse }> {
    if (!schemaSlug || !objectId) {
      return {
        data: null,
        error: ErrorHelpers.invalidParameter('object update', 'both schemaSlug and objectId'),
      };
    }

    return this.sdk.put<UpdateObjectResponse>(
      `/v1/objects/${encodeURIComponent(schemaSlug)}/${encodeURIComponent(objectId)}`,
      updates
    );
  }

  /**
   * Delete an object by ID or objectId
   * Maps to DELETE /objects/:slug endpoint
   */
  async delete(
    schemaSlug: string,
    deleteRequest: DeleteObjectRequest
  ): Promise<{ data: DeleteObjectResponse; error: null } | { data: null; error: ErrorResponse }> {
    if (!schemaSlug) {
      return {
        data: null,
        error: ErrorHelpers.invalidParameter('schemaSlug', 'a valid object schema slug'),
      };
    }

    if (!deleteRequest.id && !deleteRequest.objectId) {
      return {
        data: null,
        error: ErrorHelpers.invalidParameter(
          'deleteRequest',
          'either id (database ID) or objectId (custom identifier)'
        ),
      };
    }

    return this.sdk.delete<DeleteObjectResponse>(
      `/v1/objects/${encodeURIComponent(schemaSlug)}`,
      deleteRequest
    );
  }

  /**
   * Delete an object by database ID
   * Maps to DELETE /objects/:slug/:id endpoint
   */
  async deleteById(
    schemaSlug: string,
    objectId: string
  ): Promise<
    { data: DeleteObjectByIdResponse; error: null } | { data: null; error: ErrorResponse }
  > {
    if (!schemaSlug || !objectId) {
      return {
        data: null,
        error: ErrorHelpers.invalidParameter('object delete', 'both schemaSlug and objectId'),
      };
    }

    return this.sdk.delete<DeleteObjectByIdResponse>(
      `/v1/objects/${encodeURIComponent(schemaSlug)}/${encodeURIComponent(objectId)}`
    );
  }

  /**
   * Update an object schema
   * Maps to PUT /objects/schema endpoint
   */
  async updateSchema(
    request: UpdateObjectSchemaRequest
  ): Promise<
    { data: UpdateObjectSchemaResponse; error: null } | { data: null; error: ErrorResponse }
  > {
    if (!request.schemaId) {
      return {
        data: null,
        error: ErrorHelpers.invalidParameter('schemaId', 'a valid object schema ID'),
      };
    }

    return this.sdk.put<UpdateObjectSchemaResponse>('/v1/objects/schema', request);
  }

  /**
   * Create a fluent builder for complex object creation
   * Provides chainable API for better developer experience
   */
  builder(): ObjectBuilder {
    return new ObjectBuilder(this.sdk);
  }
}
