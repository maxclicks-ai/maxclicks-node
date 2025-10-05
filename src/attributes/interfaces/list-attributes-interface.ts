import { AttributeType } from './attribute';

/**
 * List attributes request parameters (query parameters for GET /v1/attributes)
 * Based on the actual API endpoint implementation
 */
export interface ListAttributesRequest {
  /** Target type: 'contact' or 'object' */
  readonly target_type: 'contact' | 'object';
  /** Required when target_type is 'object' - schema ID or slug */
  readonly objectSchemaId?: string;
}

/**
 * List attributes response interface
 * Maps to GET /v1/attributes endpoint response structure
 */
export interface ListAttributesResponse {
  readonly attributes: readonly {
    readonly key: string;
    readonly label: string;
    readonly description: string | null;
    readonly type: AttributeType;
    readonly createdAt: string;
    readonly updatedAt: string;
  }[];
}
