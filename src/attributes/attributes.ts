import type { Maxclicks } from '../maxclicks';
import type { ErrorResponse } from '../interfaces';
import { ErrorHelpers } from '../common/error-helpers';
import { AttributeBuilder } from './attribute-builder';
import type {
  CreateAttributeRequest,
  CreateAttributeResponse,
  ListAttributesRequest,
  ListAttributesResponse,
  DeleteAttributeRequest,
  DeleteAttributeResponse,
  BatchCreateAttributesRequest,
  BatchCreateAttributesResponse,
} from './interfaces';

/**
 * Attributes API
 *
 * Attribute Management:
 * - GET /v1/attributes - List attributes for contact or object schema
 * - POST /v1/attributes - Create new attribute
 * - POST /v1/attributes/batch - Create multiple attributes in batch
 * - DELETE /v1/attributes/:id - Delete attribute
 */
export class Attributes {
  constructor(private readonly maxclicks: Maxclicks) {}

  /**
   * Create a new attribute with fluent builder or direct API
   * Maps to POST /v1/attributes endpoint
   *
   * @example
   * ```typescript
   * // Fluent API for contact attribute
   * const attribute = await maxclicks.attributes
   *   .target('contact')
   *   .create()
   *   .key('subscription_plan')
   *   .label('Subscription Plan')
   *   .type('string')
   *   .description('Customer subscription tier')
   *   .execute();
   *
   * // Fluent API for object attribute
   * const attribute = await maxclicks.attributes
   *   .target({ object: 'products' })
   *   .create()
   *   .key('product_name')
   *   .label('Product Name')
   *   .type('string')
   *   .execute();
   *
   * // Direct API
   * const attribute = await maxclicks.attributes.create({
   *   target: { type: 'object', objectSchemaId: 'products' },
   *   data: {
   *     key: 'price',
   *     label: 'Price',
   *     type: 'number',
   *     description: 'Product price in USD'
   *   }
   * });
   * ```
   */
  target(target: 'contact' | { object: string }): AttributeBuilder {
    return new AttributeBuilder(this.maxclicks, target);
  }

  /**
   * Create a new attribute
   * Maps to POST /v1/attributes endpoint
   *
   * @param request - Create attribute request with target and data
   * @example
   * ```typescript
   * // Create a contact attribute
   * const result = await maxclicks.attributes.create({
   *   target: { type: 'contact' },
   *   data: {
   *     key: 'subscription_plan',
   *     label: 'Subscription Plan',
   *     type: 'string',
   *     description: 'Customer subscription tier'
   *   }
   * });
   *
   * // Create an object attribute
   * const result = await maxclicks.attributes.create({
   *   target: { type: 'object', objectSchemaId: 'products' },
   *   data: {
   *     key: 'price',
   *     label: 'Price',
   *     type: 'number',
   *     description: null
   *   }
   * });
   * ```
   */
  async create(
    request: CreateAttributeRequest
  ): Promise<
    { data: CreateAttributeResponse; error: null } | { data: null; error: ErrorResponse }
  > {
    // Validate required fields
    if (!request?.target?.type) {
      return {
        data: null,
        error: ErrorHelpers.validation('target.type is required', {
          suggestions: ['Use "contact" or "object" as target type'],
        }),
      };
    }

    if (!request?.data?.key) {
      return {
        data: null,
        error: ErrorHelpers.validation('data.key is required', {
          suggestions: ['Provide a unique key for the attribute'],
        }),
      };
    }

    if (!request?.data?.label) {
      return {
        data: null,
        error: ErrorHelpers.validation('data.label is required', {
          suggestions: ['Provide a human-readable label for the attribute'],
        }),
      };
    }

    if (!request?.data?.type) {
      return {
        data: null,
        error: ErrorHelpers.validation('data.type is required', {
          suggestions: ['Use one of: string, number, boolean, date time, date only, id array'],
        }),
      };
    }

    if (request.target.type === 'object' && !request.target.objectSchemaId) {
      return {
        data: null,
        error: ErrorHelpers.validation(
          'target.objectSchemaId is required when target.type is "object"',
          { suggestions: ['Provide the object schema ID or slug'] }
        ),
      };
    }

    return this.maxclicks.post<CreateAttributeResponse>('/v1/attributes', request);
  }

  /**
   * Create multiple attributes in a single batch operation
   * Maps to POST /v1/attributes/batch endpoint
   *
   * @param request - Batch create request with multiple attribute operations
   * @example
   * ```typescript
   * // Create multiple contact attributes
   * const result = await maxclicks.attributes.createBatch({
   *   operations: [
   *     {
   *       target: { type: 'contact' },
   *       data: {
   *         key: 'subscription_plan',
   *         label: 'Subscription Plan',
   *         type: 'string',
   *         description: 'Customer subscription tier'
   *       }
   *     },
   *     {
   *       target: { type: 'contact' },
   *       data: {
   *         key: 'signup_date',
   *         label: 'Signup Date',
   *         type: 'date time',
   *         description: 'When the customer signed up'
   *       }
   *     }
   *   ]
   * });
   *
   * // Check results
   * if (result.data) {
   *   result.data.results.forEach((result, index) => {
   *     if (result.success) {
   *       console.log(`Attribute ${index + 1} created:`, result.attribute);
   *     } else {
   *       console.error(`Attribute ${index + 1} failed:`, result.error);
   *     }
   *   });
   * }
   * ```
   */
  async createBatch(
    request: BatchCreateAttributesRequest
  ): Promise<
    { data: BatchCreateAttributesResponse; error: null } | { data: null; error: ErrorResponse }
  > {
    // Validate the request structure
    if (!request || !Array.isArray(request.operations) || request.operations.length === 0) {
      return {
        data: null,
        error: ErrorHelpers.validation('operations must be a non-empty array', {
          suggestions: ['Provide at least one attribute creation operation'],
        }),
      };
    }

    // Validate each operation
    for (let i = 0; i < request.operations.length; i++) {
      const operation = request.operations[i];

      if (!operation?.target?.type) {
        return {
          data: null,
          error: ErrorHelpers.validation(`operations[${i}].target.type is required`, {
            suggestions: ['Use "contact" or "object" as target type'],
          }),
        };
      }

      if (operation.target.type === 'object' && !operation.target.objectSchemaId) {
        return {
          data: null,
          error: ErrorHelpers.validation(
            `operations[${i}].target.objectSchemaId is required when target.type is "object"`,
            { suggestions: ['Provide the object schema ID or slug'] }
          ),
        };
      }

      if (!operation?.data?.key) {
        return {
          data: null,
          error: ErrorHelpers.validation(`operations[${i}].data.key is required`, {
            suggestions: ['Provide a unique key for the attribute'],
          }),
        };
      }

      if (!operation?.data?.label) {
        return {
          data: null,
          error: ErrorHelpers.validation(`operations[${i}].data.label is required`, {
            suggestions: ['Provide a human-readable label for the attribute'],
          }),
        };
      }

      if (!operation?.data?.type) {
        return {
          data: null,
          error: ErrorHelpers.validation(`operations[${i}].data.type is required`, {
            suggestions: ['Use one of: string, number, boolean, date time, date only, id array'],
          }),
        };
      }
    }

    return this.maxclicks.post<BatchCreateAttributesResponse>('/v1/attributes/batch', request);
  }

  /**
   * List attributes for a target (contact or object schema)
   * Maps to GET /v1/attributes endpoint with query parameters
   *
   * @param request - List request with query parameters
   * @example
   * ```typescript
   * // List contact attributes
   * const contactAttrs = await maxclicks.attributes.list({
   *   target_type: 'contact'
   * });
   *
   * // List object schema attributes
   * const productAttrs = await maxclicks.attributes.list({
   *   target_type: 'object',
   *   objectSchemaId: 'products'
   * });
   * ```
   */
  async list(
    request: ListAttributesRequest
  ): Promise<{ data: ListAttributesResponse; error: null } | { data: null; error: ErrorResponse }> {
    // Safe guard: ensure target_type is provided
    if (!request || !request.target_type) {
      return {
        data: null,
        error: ErrorHelpers.invalidParameter('target_type', '"contact" or "object" as target_type'),
      };
    }

    // Build query parameters based on target type
    const queryParams = new URLSearchParams();
    queryParams.set('target_type', request.target_type);

    if (request.target_type === 'object') {
      if (!request.objectSchemaId) {
        return {
          data: null,
          error: ErrorHelpers.invalidParameter(
            'objectSchemaId',
            'an object schema ID or slug when target_type is "object"'
          ),
        };
      }
      queryParams.set('objectSchemaId', request.objectSchemaId);
    }

    const url = `/v1/attributes?${queryParams.toString()}`;
    return this.maxclicks.get<ListAttributesResponse>(url);
  }

  /**
   * Delete an attribute
   * Maps to DELETE /v1/attributes/:id endpoint
   *
   * @param attributeKey - The attribute key to delete
   * @param request - Delete request with target
   * @example
   * ```typescript
   * await maxclicks.attributes.delete('old_attribute', {
   *   target: { type: 'object', objectSchemaId: 'products' }
   * });
   * ```
   */
  async delete(
    attributeKey: string,
    request: DeleteAttributeRequest
  ): Promise<
    { data: DeleteAttributeResponse; error: null } | { data: null; error: ErrorResponse }
  > {
    if (!attributeKey) {
      return {
        data: null,
        error: ErrorHelpers.validation('attributeKey is required to delete an attribute', {
          suggestions: ['Pass the attribute key as the first argument'],
        }),
      };
    }

    if (!request?.target?.type) {
      return {
        data: null,
        error: ErrorHelpers.validation('target.type is required', {
          suggestions: ['Use "contact" or "object" as target type'],
        }),
      };
    }

    if (request.target.type === 'object' && !request.target.objectSchemaId) {
      return {
        data: null,
        error: ErrorHelpers.validation(
          'target.objectSchemaId is required when target.type is "object"',
          { suggestions: ['Provide the object schema ID or slug'] }
        ),
      };
    }

    return this.maxclicks.delete<DeleteAttributeResponse>(
      `/v1/attributes/${attributeKey}`,
      request
    );
  }
}
