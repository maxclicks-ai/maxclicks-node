/**
 * Public Attribute record returned by the API
 */
export interface Attribute {
  readonly key: string;
  readonly label: string;
  readonly description: string | null;
  readonly type: AttributeType;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AttributeResponse {
  readonly key: string;
  readonly label: string;
  readonly description: string | null;
  readonly type: AttributeType;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

export const AttributeTypes = [
  'string',
  'number',
  'boolean',
  'date time',
  'date only',
  'id array',
] as const;

export type AttributeType = (typeof AttributeTypes)[number];

export function isAttributeType(value: unknown): value is AttributeType {
  return typeof value === 'string' && (AttributeTypes as readonly string[]).includes(value);
}

export type AttributeTarget =
  | { readonly type: 'contact' }
  | { readonly type: 'object'; readonly objectSchemaId: string };
