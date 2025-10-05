import type { Maxclicks } from '../maxclicks';
import type { CreateAttributeRequest, CreateAttributeResponse } from './interfaces';
import type { ErrorResponse } from '../interfaces';
import { ErrorHelpers } from '../common/error-helpers';
import { AttributeTypes, type AttributeType, isAttributeType } from './interfaces/attribute';

/**
 * Enhanced Attribute Builder with Fluent API
 * Provides a chainable, developer-friendly interface for creating attributes
 */
export class AttributeBuilder {
  private data: {
    target: { type: 'contact' } | { type: 'object'; objectSchemaId: string };
    data: {
      key: string;
      label: string;
      type: AttributeType;
      description: string | null;
    };
  } = {
    target: { type: 'contact' },
    data: {
      key: '',
      label: '',
      type: 'string',
      description: null,
    },
  };

  constructor(
    private readonly maxclicks: Maxclicks,
    private readonly target: 'contact' | { object: string }
  ) {
    if (target === 'contact') {
      this.data.target = { type: 'contact' };
    } else {
      this.data.target = { type: 'object', objectSchemaId: target.object };
    }
  }

  /**
   * Initialize the attribute creation flow
   * This method enables the fluent API pattern shown in the documentation
   * @returns this - Returns the builder instance for method chaining
   * @example
   * ```typescript
   * const attribute = await maxclicks.attributes
   *   .target('contact')
   *   .create()
   *   .key('subscription_plan')
   *   .label('Subscription Plan')
   *   .type('string')
   *   .execute();
   * ```
   */
  create(): this {
    return this;
  }

  /**
   * Set the attribute key (unique identifier)
   * @param key - The attribute key (must be unique within the target)
   * @example
   * ```typescript
   * const attribute = await maxclicks.attributes
   *   .target('contact')
   *   .create()
   *   .key('subscription_plan')
   *   .label('Subscription Plan')
   *   .type('string')
   *   .execute();
   * ```
   */
  key(key: string): this {
    this.data.data.key = key;
    return this;
  }

  /**
   * Set the attribute label (human-readable name)
   * @param label - The display label for the attribute
   */
  label(label: string): this {
    this.data.data.label = label;
    return this;
  }

  /**
   * Set the attribute data type
   * @param type - The data type for the attribute
   * @example
   * ```typescript
   * .type('string')    // Text values
   * .type('number')    // Numeric values
   * .type('boolean')   // True/false values
   * .type('date time') // ISO timestamp
   * .type('date only') // YYYY-MM-DD date
   * .type('id array')  // Array of IDs
   * ```
   */
  type(type: AttributeType): this {
    this.data.data.type = type;
    return this;
  }

  /**
   * Set the attribute description (optional)
   * @param description - Optional description of the attribute
   */
  description(description: string | null): this {
    this.data.data.description = description;
    return this;
  }

  /**
   * Derive a URL-safe key from the label if key is not provided
   * For example: "Signup Date" -> "signup_date"
   */
  keyFromLabel(): this {
    if (!this.data.data.label) return this;
    const slug = this.data.data.label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 64);
    if (!this.data.data.key) this.data.data.key = slug;
    return this;
  }

  /**
   * Preview the request that would be sent without executing it
   */
  preview(): CreateAttributeRequest {
    return {
      target: { ...this.data.target },
      data: { ...this.data.data },
    } as CreateAttributeRequest;
  }

  /**
   * Validate the current data without executing the request
   */
  validate(): {
    isValid: boolean;
    errors: Array<{
      field: string;
      message: string;
    }>;
  } {
    const errors: Array<{ field: string; message: string }> = [];

    if (!this.data.data.key) {
      errors.push({ field: 'key', message: 'Attribute key is required' });
    }

    if (!this.data.data.label) {
      errors.push({ field: 'label', message: 'Attribute label is required' });
    }

    if (!this.data.data.type) {
      errors.push({ field: 'type', message: 'Attribute type is required' });
    }

    if (this.data.data.type && !isAttributeType(this.data.data.type)) {
      errors.push({
        field: 'type',
        message: `Invalid type. Must be one of: ${AttributeTypes.join(', ')}`,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Execute the attribute creation
   * Maps to POST /v1/attributes endpoint
   */
  async execute(): Promise<
    { data: CreateAttributeResponse; error: null } | { data: null; error: ErrorResponse }
  > {
    // Validate before sending
    const validation = this.validate();
    if (!validation.isValid) {
      return {
        data: null,
        error: ErrorHelpers.validation(
          validation.errors.map((e) => `${e.field}: ${e.message}`).join(', '),
          {
            suggestions: [
              'Provide key, label, and a valid type',
              'Call .keyFromLabel() after .label() to derive a key automatically',
              `Valid types: ${AttributeTypes.join(', ')}`,
            ],
          }
        ),
      };
    }

    try {
      const requestData: CreateAttributeRequest = {
        target: { ...this.data.target },
        data: { ...this.data.data },
      } as CreateAttributeRequest;

      return await this.maxclicks.post<CreateAttributeResponse>('/v1/attributes', requestData);
    } catch (error) {
      return {
        data: null,
        error: this.enhanceError(error),
      };
    }
  }

  /**
   * Convenience that throws MaxclicksError on failure for simpler DX in scripts/tests
   */
  async executeOrThrow(): Promise<CreateAttributeResponse> {
    const result = await this.execute();
    if (result.error) {
      // Delay import to avoid cycles
      const { MaxclicksError } = await import('../error');
      throw MaxclicksError.fromResponse(result.error);
    }
    return result.data;
  }

  private enhanceError(error: any): ErrorResponse {
    // Add contextual information based on the error type
    if (error.name === 'validation_error') {
      const field = this.extractFieldFromError(error.message);
      const suggestions = this.generateSuggestions(error.message);
      return ErrorHelpers.validation(error?.message || 'An error occurred', { suggestions });
    }

    if (error.name === 'not_found') {
      return ErrorHelpers.notFound(
        `target "${this.data.target.type}"`,
        error?.message || 'Resource not found'
      );
    }

    if (error.message?.includes('already exists')) {
      return ErrorHelpers.validation(error?.message || 'Resource already exists', {
        suggestions: [`Attribute key "${this.data.data.key}" already exists. Use a different key.`],
      });
    }

    // Default to internal server error
    return ErrorHelpers.internalServer(error?.message || 'An error occurred');
  }

  private extractFieldFromError(message: string): string | undefined {
    // Extract field name from common error patterns
    const patterns = [/Invalid (\w+)/i, /(\w+) is required/i, /(\w+) must be/i, /key "(\w+)"/i];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        return match[1].toLowerCase();
      }
    }

    return undefined;
  }

  private generateSuggestions(message: string): string[] {
    const suggestions: string[] = [];

    if (message.includes('required')) {
      suggestions.push('This field cannot be empty');
      suggestions.push('Check the attribute requirements for your target type');
    }

    if (message.includes('type')) {
      suggestions.push('Check the expected data type for this attribute');
      suggestions.push(`Valid types: ${AttributeTypes.join(', ')}`);
    }

    if (message.includes('exists')) {
      suggestions.push('Use a different attribute key');
      suggestions.push('Check existing attributes with the list() method');
    }

    if (!this.data.data.key && this.data.data.label) {
      suggestions.push('Tip: call .keyFromLabel() to generate a key automatically');
    }

    return suggestions;
  }
}
