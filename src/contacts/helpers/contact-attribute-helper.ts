/**
 * Attribute Helper for Contact Builder
 * Handles intelligent custom attribute validation and creation
 */

import type { AttributeType, Attribute } from '../../attributes/interfaces/attribute';
import type { Maxclicks } from '../../maxclicks';
import type { CreateAttributeRequest as SDKCreateAttributeRequest } from '../../attributes/interfaces/create-attribute-interface';

export interface AttributeValidationResult {
  isValid: boolean;
  existingAttributes: Record<string, Attribute>;
  missingAttributes: Array<{
    key: string;
    suggestedType: AttributeType;
    reason: string;
  }>;
  errors: Array<{
    field: string;
    message: string;
    suggestion: string;
  }>;
}

/**
 * Intelligent attribute validation and management helper
 */
export class AttributeHelper {
  constructor(private readonly maxclicks: Maxclicks) {}

  /**
   * Fetch existing contact attributes from the API
   */
  async fetchContactAttributes(): Promise<Attribute[]> {
    try {
      const response = await this.maxclicks.attributes.list({
        target_type: 'contact',
      });

      if (response.error) {
        throw new Error(`Failed to fetch attributes: ${response.error.error.message}`);
      }

      return [...(response.data?.attributes || [])];
    } catch (error) {
      this.maxclicks.logger.warn('Failed to fetch contact attributes:', error);
      return [];
    }
  }

  /**
   * Validate custom attributes against existing ones
   */
  async validateCustomAttributes(
    attributeValuesByKey: Record<string, any>
  ): Promise<AttributeValidationResult> {
    const existingAttributes = await this.fetchContactAttributes();
    const existingAttributeKeys = new Set(existingAttributes.map((attr) => attr.key));
    const existingAttributesByKey = existingAttributes.reduce(
      (acc, attr) => {
        acc[attr.key] = attr;
        return acc;
      },
      {} as Record<string, Attribute>
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
          reason: `Custom attribute '${key}' doesn't exist in your space`,
        });

        errors.push({
          field: key,
          message: `Custom attribute '${key}' is not defined`,
          suggestion: `Create the attribute first or use .autoCreate() to create it automatically`,
        });
      }
    }

    return {
      isValid: missingAttributes.length === 0,
      existingAttributes: existingAttributesByKey,
      missingAttributes,
      errors,
    };
  }

  /**
   * Create missing attributes automatically
   */
  async createMissingAttributes(
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
        const attr = queue.shift()!;
        try {
          const createRequest: SDKCreateAttributeRequest = {
            target: { type: 'contact' },
            data: {
              key: attr.key,
              label: this.formatLabel(attr.key),
              description: `Auto-created attribute for ${attr.key}`,
              type: attr.suggestedType,
            },
          };

          const response = await this.maxclicks.attributes.create(createRequest);

          if (response.error) {
            failed.push({ key: attr.key, error: response.error.error.message || 'Unknown error' });
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
      // Check if it's an array of strings (could be id array)
      if (value.every((item) => typeof item === 'string')) {
        return 'id array';
      }
      return 'string'; // Fallback to string representation
    }

    if (typeof value === 'string') {
      // Check if it looks like a date/time
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
  generateDeveloperGuidance(result: AttributeValidationResult): {
    summary: string;
    actions: string[];
    codeExamples: string[];
  } {
    if (result.isValid) {
      return {
        summary: '✅ All custom attributes are valid!',
        actions: [],
        codeExamples: [],
      };
    }

    const summary = `❌ Found ${result.missingAttributes.length} undefined custom attribute(s)`;

    const actions = [
      '1. Create the missing attributes manually in your dashboard',
      '2. Use .autoCreate() to create them automatically',
      '3. Remove the custom attributes from your contact data',
      '4. Check the available attributes with maxclicks.attributes.list()',
    ];

    const codeExamples = [
      '// Option 1: Auto-create missing attributes',
      'const contact = await maxclicks.contacts',
      '  .create()',
      '  .email("user@example.com")',
      '  .customAttribute("plan", "premium")',
      '  .autoCreate() // This will create missing attributes',
      '  .execute();',
      '',
      '// Option 2: Check available attributes first',
      'const attributes = await maxclicks.attributes.list({ target_type: "contact" });',
      'console.log("Available attributes:", attributes.data.attributes);',
    ];

    return {
      summary,
      actions,
      codeExamples,
    };
  }
}

export default AttributeHelper;
