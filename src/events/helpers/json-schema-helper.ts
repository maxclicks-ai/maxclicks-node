/**
 * JSON Schema Helper for Event Payloads
 * Provides utilities for creating, validating, and working with JSON schemas
 */

// Local type definitions
export type Json =
  | null
  | string
  | number
  | boolean
  | readonly Json[]
  | { readonly [key: string]: Json };

export interface JsonSchema {
  type?: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | 'null';
  title?: string;
  description?: string;

  // String properties
  format?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;

  // Number properties
  minimum?: number;
  maximum?: number;
  multipleOf?: number;

  // Array properties
  items?: JsonSchema;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;

  // Object properties
  properties?: { [key: string]: JsonSchema };
  required?: string[];
  additionalProperties?: boolean | JsonSchema;

  // Common properties
  enum?: any[];
  const?: any;

  // Advanced properties
  allOf?: JsonSchema[];
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  not?: JsonSchema;
}

export interface JsonSchemaObject extends JsonSchema {
  type: 'object';
  properties: { [key: string]: JsonSchema };
}

/**
 * JSON Schema Builder for creating type-safe schemas
 *
 * @example
 * ```typescript
 * const schema = new JsonSchemaBuilder()
 *   .type('object')
 *   .property('email', { type: 'string', format: 'email' })
 *   .property('age', { type: 'integer', minimum: 0 })
 *   .required(['email'])
 *   .build();
 * ```
 */
export class JsonSchemaBuilder {
  private schema: JsonSchema = {
    type: 'object',
    properties: {},
  };

  /**
   * Set the schema type
   */
  type(type: 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean' | 'null'): this {
    this.schema.type = type;
    return this;
  }

  /**
   * Set the schema title
   */
  title(title: string): this {
    this.schema.title = title;
    return this;
  }

  /**
   * Set the schema description
   */
  description(description: string): this {
    this.schema.description = description;
    return this;
  }

  /**
   * Add a property to the schema
   */
  property(name: string, propertySchema: JsonSchema): this {
    if (!this.schema.properties) {
      this.schema.properties = {};
    }
    this.schema.properties[name] = propertySchema;
    return this;
  }

  /**
   * Add multiple properties at once
   */
  properties(properties: Record<string, JsonSchema>): this {
    if (!this.schema.properties) {
      this.schema.properties = {};
    }
    Object.assign(this.schema.properties, properties);
    return this;
  }

  /**
   * Set required properties
   */
  required(required: string[]): this {
    this.schema.required = required;
    return this;
  }

  /**
   * Add a required property
   */
  require(property: string): this {
    if (!this.schema.required) {
      this.schema.required = [];
    }
    if (!this.schema.required.includes(property)) {
      this.schema.required.push(property);
    }
    return this;
  }

  /**
   * Set additional properties behavior
   */
  additionalProperties(allowed: boolean | JsonSchema): this {
    this.schema.additionalProperties = allowed;
    return this;
  }

  /**
   * Build and return the final schema
   */
  build(): JsonSchema {
    return { ...this.schema };
  }

  /**
   * Validate the schema and return any errors
   */
  validate(): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Basic validation
    if (!this.schema.type) {
      errors.push('Schema must have a type');
    }

    // Validate properties if type is object
    if (this.schema.type === 'object') {
      if (this.schema.required && Array.isArray(this.schema.required)) {
        for (const requiredProp of this.schema.required) {
          if (!this.schema.properties || !this.schema.properties[requiredProp]) {
            errors.push(`Required property '${requiredProp}' is not defined in properties`);
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Common JSON Schema patterns for quick use
 */
export const JsonSchemaPatterns = {
  /**
   * String schema with optional format and constraints
   */
  string(
    options: {
      format?: 'email' | 'date-time' | 'uri' | 'uuid';
      minLength?: number;
      maxLength?: number;
      pattern?: string;
      enum?: string[];
    } = {}
  ): JsonSchema {
    const schema: any = { type: 'string' };

    if (options.format) schema.format = options.format;
    if (options.minLength !== undefined) schema.minLength = options.minLength;
    if (options.maxLength !== undefined) schema.maxLength = options.maxLength;
    if (options.pattern) schema.pattern = options.pattern;
    if (options.enum) schema.enum = options.enum;

    return schema;
  },

  /**
   * Number schema with optional constraints
   */
  number(
    options: {
      minimum?: number;
      maximum?: number;
      multipleOf?: number;
    } = {}
  ): JsonSchema {
    const schema: any = { type: 'number' };

    if (options.minimum !== undefined) schema.minimum = options.minimum;
    if (options.maximum !== undefined) schema.maximum = options.maximum;
    if (options.multipleOf !== undefined) schema.multipleOf = options.multipleOf;

    return schema;
  },

  /**
   * Integer schema with optional constraints
   */
  integer(
    options: {
      minimum?: number;
      maximum?: number;
      multipleOf?: number;
    } = {}
  ): JsonSchema {
    const schema: any = { type: 'integer' };

    if (options.minimum !== undefined) schema.minimum = options.minimum;
    if (options.maximum !== undefined) schema.maximum = options.maximum;
    if (options.multipleOf !== undefined) schema.multipleOf = options.multipleOf;

    return schema;
  },

  /**
   * Boolean schema
   */
  boolean(): JsonSchema {
    return { type: 'boolean' };
  },

  /**
   * Array schema
   */
  array(
    items: JsonSchema,
    options: {
      minItems?: number;
      maxItems?: number;
      uniqueItems?: boolean;
    } = {}
  ): JsonSchema {
    const schema: any = { type: 'array', items };

    if (options.minItems !== undefined) schema.minItems = options.minItems;
    if (options.maxItems !== undefined) schema.maxItems = options.maxItems;
    if (options.uniqueItems !== undefined) schema.uniqueItems = options.uniqueItems;

    return schema;
  },

  /**
   * Object schema
   */
  object(
    properties: Record<string, JsonSchema>,
    options: {
      required?: string[];
      additionalProperties?: boolean;
    } = {}
  ): JsonSchema {
    const schema: any = { type: 'object', properties };

    if (options.required) schema.required = options.required;
    if (options.additionalProperties !== undefined) {
      schema.additionalProperties = options.additionalProperties;
    }

    return schema;
  },

  /**
   * Email field schema
   */
  email(required = false): JsonSchema {
    return this.string({ format: 'email' });
  },

  /**
   * Date-time field schema
   */
  dateTime(required = false): JsonSchema {
    return this.string({ format: 'date-time' });
  },

  /**
   * UUID field schema
   */
  uuid(required = false): JsonSchema {
    return this.string({ format: 'uuid' });
  },

  /**
   * Enum field schema
   */
  enum(values: string[]): JsonSchema {
    return this.string({ enum: values });
  },
};

/**
 * Zapier-specific schema validation
 * Zapier has limitations on the schema structure
 */
export class ZapierSchemaValidator {
  /**
   * Validate if a schema is Zapier-compatible
   */
  static validate(schema: JsonSchema): {
    isValid: boolean;
    errors: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const suggestions: string[] = [];

    if (typeof schema === 'boolean') {
      errors.push('Zapier schemas cannot be boolean values');
      suggestions.push('Use an object schema with properties');
      return { isValid: false, errors, suggestions };
    }

    if (!schema || typeof schema !== 'object') {
      errors.push('Zapier schemas must be objects');
      suggestions.push('Create an object schema with properties');
      return { isValid: false, errors, suggestions };
    }

    if (schema.type !== 'object') {
      errors.push('Zapier schemas must have type "object"');
      suggestions.push('Set type to "object" and define properties');
    }

    // Validate properties are Zapier-friendly
    if (schema.properties && typeof schema.properties === 'object') {
      for (const [key, value] of Object.entries(schema.properties)) {
        if (!this.isValueSchemaZapierFriendly(value as JsonSchema)) {
          errors.push(`Property "${key}" is not Zapier-compatible`);
          suggestions.push(`Use simple types (string, number, boolean) for property "${key}"`);
        }
      }
    }

    // Check additional properties
    if (
      schema.additionalProperties &&
      typeof schema.additionalProperties === 'object' &&
      !this.isValueSchemaZapierFriendly(schema.additionalProperties)
    ) {
      errors.push('Additional properties schema is not Zapier-compatible');
      suggestions.push('Use simple types for additional properties');
    }

    return {
      isValid: errors.length === 0,
      errors,
      suggestions,
    };
  }

  /**
   * Check if a value schema is Zapier-friendly
   * @private
   */
  private static isValueSchemaZapierFriendly(schema: JsonSchema): boolean {
    if (typeof schema === 'boolean') return false;
    if (!schema || typeof schema !== 'object') return false;

    const acceptedTypes = ['string', 'number', 'integer', 'boolean'];
    return acceptedTypes.includes(schema.type as string);
  }

  /**
   * Convert a complex schema to Zapier-friendly version
   */
  static makeZapierFriendly(schema: JsonSchema): JsonSchema {
    if (typeof schema === 'boolean' || !schema || typeof schema !== 'object') {
      return { type: 'object', properties: {} };
    }

    const zapierSchema: JsonSchema = {
      type: 'object',
      properties: {},
    };

    if (schema.title) zapierSchema.title = schema.title;
    if (schema.description) zapierSchema.description = schema.description;

    // Convert properties to Zapier-friendly versions
    if (schema.properties && typeof schema.properties === 'object') {
      for (const [key, value] of Object.entries(schema.properties)) {
        zapierSchema.properties![key] = this.simplifyProperty(value as JsonSchema);
      }
    }

    // Keep required fields
    if (schema.required) {
      zapierSchema.required = schema.required;
    }

    // Disable additional properties for Zapier
    zapierSchema.additionalProperties = false;

    return zapierSchema;
  }

  /**
   * Simplify a property to Zapier-compatible type
   * @private
   */
  private static simplifyProperty(schema: JsonSchema): JsonSchema {
    if (typeof schema === 'boolean') {
      return { type: 'string' };
    }

    if (!schema || typeof schema !== 'object') {
      return { type: 'string' };
    }

    const acceptedTypes = ['string', 'number', 'integer', 'boolean'];

    if (acceptedTypes.includes(schema.type as string)) {
      // Keep simple types but remove complex constraints
      const simplified: any = { type: schema.type };

      // Keep basic constraints for strings
      if (schema.type === 'string') {
        if (schema.enum) simplified.enum = schema.enum;
        if (schema.format && ['email', 'date-time', 'uri'].includes(schema.format)) {
          simplified.format = schema.format;
        }
      }

      // Keep basic constraints for numbers
      if (schema.type === 'number' || schema.type === 'integer') {
        if (typeof schema.minimum === 'number') simplified.minimum = schema.minimum;
        if (typeof schema.maximum === 'number') simplified.maximum = schema.maximum;
      }

      return simplified;
    }

    // Convert complex types to string
    return { type: 'string' };
  }
}

/**
 * Schema validation utilities
 */
export class SchemaValidator {
  /**
   * Validate data against a JSON schema
   */
  static validate(
    data: any,
    schema: JsonSchema
  ): {
    isValid: boolean;
    errors: Array<{
      path: string;
      message: string;
      value?: any;
    }>;
  } {
    const errors: Array<{ path: string; message: string; value?: any }> = [];

    this.validateRecursive(data, schema, '', errors);

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Recursive validation helper
   * @private
   */
  private static validateRecursive(
    data: any,
    schema: JsonSchema,
    path: string,
    errors: Array<{ path: string; message: string; value?: any }>
  ): void {
    if (typeof schema === 'boolean') {
      if (!schema) {
        errors.push({
          path,
          message: 'Schema explicitly disallows this value',
          value: data,
        });
      }
      return;
    }

    if (!schema || typeof schema !== 'object') return;

    // Type validation
    if (schema.type) {
      if (!this.validateType(data, schema.type)) {
        errors.push({
          path,
          message: `Expected type ${schema.type}, got ${typeof data}`,
          value: data,
        });
        return;
      }
    }

    // Object-specific validation
    if (schema.type === 'object' && typeof data === 'object' && data !== null) {
      // Required properties
      if (schema.required && Array.isArray(schema.required)) {
        for (const requiredProp of schema.required) {
          if (!(requiredProp in data)) {
            errors.push({
              path: path ? `${path}.${requiredProp}` : requiredProp,
              message: `Required property '${requiredProp}' is missing`,
            });
          }
        }
      }

      // Validate properties
      if (schema.properties && typeof schema.properties === 'object') {
        for (const [key, value] of Object.entries(data)) {
          if (schema.properties[key]) {
            this.validateRecursive(
              value,
              schema.properties[key] as JsonSchema,
              path ? `${path}.${key}` : key,
              errors
            );
          } else if (schema.additionalProperties === false) {
            errors.push({
              path: path ? `${path}.${key}` : key,
              message: `Additional property '${key}' is not allowed`,
              value,
            });
          }
        }
      }
    }

    // String-specific validation
    if (schema.type === 'string' && typeof data === 'string') {
      if (schema.minLength && data.length < schema.minLength) {
        errors.push({
          path,
          message: `String must be at least ${schema.minLength} characters long`,
          value: data,
        });
      }
      if (schema.maxLength && data.length > schema.maxLength) {
        errors.push({
          path,
          message: `String must be at most ${schema.maxLength} characters long`,
          value: data,
        });
      }
      if (schema.pattern && !new RegExp(schema.pattern).test(data)) {
        errors.push({
          path,
          message: `String does not match required pattern`,
          value: data,
        });
      }
      if (schema.enum && !schema.enum.includes(data)) {
        errors.push({
          path,
          message: `Value must be one of: ${schema.enum.join(', ')}`,
          value: data,
        });
      }
    }

    // Number-specific validation
    if ((schema.type === 'number' || schema.type === 'integer') && typeof data === 'number') {
      if (schema.minimum !== undefined && data < schema.minimum) {
        errors.push({
          path,
          message: `Number must be at least ${schema.minimum}`,
          value: data,
        });
      }
      if (schema.maximum !== undefined && data > schema.maximum) {
        errors.push({
          path,
          message: `Number must be at most ${schema.maximum}`,
          value: data,
        });
      }
    }
  }

  /**
   * Validate data type
   * @private
   */
  private static validateType(data: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof data === 'string';
      case 'number':
        return typeof data === 'number' && !isNaN(data);
      case 'integer':
        return typeof data === 'number' && Number.isInteger(data);
      case 'boolean':
        return typeof data === 'boolean';
      case 'array':
        return Array.isArray(data);
      case 'object':
        return typeof data === 'object' && data !== null && !Array.isArray(data);
      case 'null':
        return data === null;
      default:
        return true;
    }
  }
}

export default {
  JsonSchemaBuilder,
  JsonSchemaPatterns,
  ZapierSchemaValidator,
  SchemaValidator,
};
