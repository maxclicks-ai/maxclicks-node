/**
 * Public Attribute record returned by the API
 */
export interface Attribute {
  readonly key: string;
  readonly label: string;
  readonly description: string | null;
  readonly type: AttributeType;
  readonly createdAt: string; // ISO string from API
  readonly updatedAt: string; // ISO string from API
}

/**
 * Alias for clarity when returning a single attribute in responses
 */
export interface AttributeResponse {
  readonly key: string;
  readonly label: string;
  readonly description: string | null;
  readonly type: AttributeType;
  readonly createdAt?: string; // Optional for create responses
  readonly updatedAt?: string; // Optional for create responses
}

/**
 * Canonical list of supported attribute types (mirrors server AttributeModel.types)
 * This must stay in sync with shared/src/models/AttributeModel.ts types array
 */
export const AttributeTypes = [
  'string',
  'number',
  'boolean',
  'date time',
  'date only',
  'id array',
] as const;

export type AttributeType = (typeof AttributeTypes)[number];

/**
 * Type guard to validate attribute type values at runtime
 */
export function isAttributeType(value: unknown): value is AttributeType {
  return typeof value === 'string' && (AttributeTypes as readonly string[]).includes(value);
}

export type AttributeTarget =
  | { readonly type: 'contact' }
  | { readonly type: 'object'; readonly objectSchemaId: string };
