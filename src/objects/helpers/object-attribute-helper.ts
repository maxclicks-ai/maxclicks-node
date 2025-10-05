import type { Maxclicks } from '../../maxclicks';
import type { ErrorResponse } from '../../interfaces';
import type { AttributeResponse, AttributeType } from '../../attributes/interfaces';
import { ObjectAttributeValidationResult } from '../interfaces/object-attribute-validation-result';

/**
 * Intelligent object attribute validation and management helper
 * Similar to contact AttributeHelper but for object schemas
 */
export class ObjectAttributeHelper {
  constructor(private readonly maxclicks: Maxclicks) {}

  /**
   * Get schema ID from schema slug or return ID if already a UUID
   */
  private async getSchemaId(schemaSlugOrId: string): Promise<string> {
    // Check if it's already a UUID (basic UUID pattern)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidPattern.test(schemaSlugOrId)) {
      return schemaSlugOrId;
    }

    try {
      const response = await this.maxclicks.objects.listSchemas();
      if (response.error) {
        throw new Error(`Failed to list schemas: ${response.error.error.message}`);
      }

      const schema = response.data.objects.find((s) => s.slug === schemaSlugOrId);
      if (!schema) {
        throw new Error(`Schema with slug '${schemaSlugOrId}' not found`);
      }

      return schema.id;
    } catch (error) {
      throw new Error(
        `Failed to get schema ID: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Fetch existing object schema attributes from the API
   */
  async fetchObjectSchemaAttributes(schemaSlug: string): Promise<readonly AttributeResponse[]> {
    try {
      // Get schema ID first
      const schemaId = await this.getSchemaId(schemaSlug);

      const response = await this.maxclicks.attributes.list({
        target_type: 'object',
        objectSchemaId: schemaId,
      });

      if (response.error) {
        throw new Error(`Failed to fetch attributes: ${response.error.error.message}`);
      }

      return response.data.attributes;
    } catch (error) {
      throw new Error(
        `Failed to fetch object schema attributes: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validate object attributes against existing schema attributes
   */
  async validateObjectAttributes(
    schemaSlug: string,
    attributeValuesByKey: Record<string, any>
  ): Promise<ObjectAttributeValidationResult> {
    const existingAttributes = await this.fetchObjectSchemaAttributes(schemaSlug);
    const existingAttributeKeys = new Set(existingAttributes.map((attr) => attr.key));
    const existingAttributesByKey = existingAttributes.reduce(
      (acc, attr) => {
        acc[attr.key] = attr;
        return acc;
      },
      {} as Record<string, AttributeResponse>
    );

    const missingAttributes: Array<{
      key: string;
      suggestedType: AttributeType;
      reason: string;
    }> = [];

    const errors: Array<{
      field: string;
      message: string;
      suggestion: string;
    }> = [];

    // Check each custom attribute
    for (const [key, value] of Object.entries(attributeValuesByKey)) {
      if (!existingAttributeKeys.has(key)) {
        const suggestedType = this.inferAttributeType(value);
        missingAttributes.push({
          key,
          suggestedType,
          reason: `Attribute '${key}' does not exist in object schema '${schemaSlug}'`,
        });
      } else {
        // Validate type compatibility if attribute exists
        const existingAttr = existingAttributesByKey[key];
        if (!this.isValueCompatible(value, existingAttr.type)) {
          errors.push({
            field: key,
            message: `Value type mismatch for attribute '${key}'. Expected: ${existingAttr.type}, got: ${typeof value}`,
            suggestion: `Convert the value to match the expected type or update the attribute definition`,
          });
        }
      }
    }

    return {
      isValid: missingAttributes.length === 0 && errors.length === 0,
      existingAttributes: existingAttributesByKey,
      missingAttributes,
      errors,
    };
  }

  /**
   * Filter out invalid attributes and return only valid ones
   */
  async filterValidAttributes(
    schemaSlug: string,
    attributeValuesByKey: Record<string, any>
  ): Promise<Record<string, any>> {
    try {
      const existingAttributes = await this.fetchObjectSchemaAttributes(schemaSlug);

      // If schema has no attributes defined, return empty object
      if (existingAttributes.length === 0) {
        return {};
      }

      const existingAttributeKeys = new Set(existingAttributes.map((attr) => attr.key));
      const validAttributes: Record<string, any> = {};

      for (const [key, value] of Object.entries(attributeValuesByKey)) {
        // Only include attributes that exist in the schema
        if (existingAttributeKeys.has(key)) {
          validAttributes[key] = value;
        }
      }

      return validAttributes;
    } catch (error) {
      // If we can't fetch attributes, return empty object to avoid breaking the request
      console.warn(
        `Warning: Could not validate attributes for schema '${schemaSlug}': ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return {};
    }
  }

  /**
   * Create missing attributes automatically
   */
  async createMissingAttributes(
    schemaSlug: string,
    missingAttributes: Array<{
      key: string;
      suggestedType: AttributeType;
      reason: string;
    }>
  ): Promise<{
    success: boolean;
    created: string[];
    failed: Array<{ key: string; error: string }>;
  }> {
    const created: string[] = [];
    const failed: Array<{ key: string; error: string }> = [];

    // Limit concurrency to avoid rate limits; simple pool of 3
    const poolSize = 3;
    const queue = [...missingAttributes];
    const workers: Promise<void>[] = [];

    const runWorker = async () => {
      while (queue.length) {
        const attr = queue.shift();
        if (!attr) break;

        try {
          // Get schema ID first
          const schemaId = await this.getSchemaId(schemaSlug);

          const result = await this.maxclicks.attributes.create({
            target: { type: 'object', objectSchemaId: schemaId },
            data: {
              key: attr.key,
              label: this.formatLabel(attr.key),
              type: attr.suggestedType,
              description: `Auto-created attribute for ${attr.key}`,
            },
          });

          if (result.error) {
            failed.push({ key: attr.key, error: result.error.error.message });
          } else {
            created.push(attr.key);
          }
        } catch (error) {
          failed.push({
            key: attr.key,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    };

    for (let i = 0; i < poolSize; i++) {
      workers.push(runWorker());
    }
    await Promise.all(workers);

    return { success: created.length > 0 && failed.length === 0, created, failed };
  }

  /**
   * Infer attribute type from value
   */
  private inferAttributeType(value: any): AttributeType {
    if (value === null || value === undefined) {
      return 'string'; // Default fallback
    }

    if (typeof value === 'boolean') {
      return 'boolean';
    }

    if (typeof value === 'number') {
      return 'number';
    }

    if (Array.isArray(value)) {
      return 'string'; // Arrays will be converted to string for object attributes
    }

    if (typeof value === 'string') {
      // Check for datetime patterns
      if (this.isISODateTime(value)) {
        return 'date time';
      }
      if (this.isISODate(value)) {
        return 'date only';
      }
      return 'string';
    }

    // For objects or other complex types, convert to string
    return 'string';
  }

  /**
   * Check if value is compatible with attribute type
   */
  private isValueCompatible(value: any, attributeType: string): boolean {
    if (value === null || value === undefined) {
      return true; // Null values are generally acceptable
    }

    switch (attributeType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'date time':
      case 'date only':
        return typeof value === 'string' && !isNaN(Date.parse(value));
      default:
        return true; // Unknown types are assumed compatible
    }
  }

  /**
   * Check if string looks like ISO datetime
   */
  private isISODateTime(value: string): boolean {
    const isoDateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    return isoDateTimeRegex.test(value) && !isNaN(Date.parse(value));
  }

  /**
   * Check if string looks like ISO date
   */
  private isISODate(value: string): boolean {
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return isoDateRegex.test(value) && !isNaN(Date.parse(value));
  }

  /**
   * Format attribute key into a human-readable label
   */
  private formatLabel(key: string): string {
    return key
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Generate helpful developer guidance
   */
  generateDeveloperGuidance(
    result: ObjectAttributeValidationResult,
    schemaSlug: string
  ): {
    summary: string;
    actions: string[];
    codeExamples: string[];
  } {
    if (result.isValid) {
      return {
        summary: '✅ All object attributes are valid',
        actions: [],
        codeExamples: [],
      };
    }

    const summary = `❌ Found ${result.missingAttributes.length} undefined object attribute(s) in schema '${schemaSlug}'`;

    const actions = [
      '1. Create the missing attributes manually in your dashboard',
      '2. Filter out invalid attributes using ObjectAttributeHelper.filterValidAttributes()',
      '3. Remove the invalid attributes from your object data',
      `4. Check available attributes with maxclicks.attributes.list({ target_type: 'object', objectSchemaId: '${schemaSlug}' })`,
    ];

    const codeExamples = [
      `// Filter to only valid attributes:
const helper = new ObjectAttributeHelper(maxclicks);
const validAttrs = await helper.filterValidAttributes('${schemaSlug}', attributeValuesByKey);`,

      `// Create missing attributes:
const validation = await helper.validateObjectAttributes('${schemaSlug}', attributeValuesByKey);
if (!validation.isValid) {
  await helper.createMissingAttributes('${schemaSlug}', validation.missingAttributes);
}`,
    ];

    return { summary, actions, codeExamples };
  }
}

export default ObjectAttributeHelper;
