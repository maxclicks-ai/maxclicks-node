import type { AttributeTarget, AttributeType } from './attribute';

/**
 * Batch create attributes request interface
 * Maps to POST /v1/attributes/batch endpoint
 */
export interface BatchCreateAttributesRequest {
  /** Array of attribute operations to perform */
  readonly operations: readonly {
    /** Target for the attribute (contact or object schema) */
    readonly target: AttributeTarget;
    /** Attribute data to create */
    readonly data: {
      /** Unique key for the attribute */
      readonly key: string;
      /** Human-readable label */
      readonly label: string;
      /** Optional description */
      readonly description?: string;
      /** Attribute data type */
      readonly type: AttributeType;
    };
  }[];
}

/**
 * Batch create attributes response interface
 * Maps to POST /v1/attributes/batch endpoint response
 */
export interface BatchCreateAttributesResponse {
  /** Array of operation results - each operation returns success/failure */
  readonly results: readonly (
    | {
        readonly success: true;
        readonly attribute: {
          readonly key: string;
          readonly label: string;
          readonly description: string | null;
          readonly type: AttributeType;
        };
      }
    | {
        readonly success: false;
        readonly error: string;
      }
  )[];
}
