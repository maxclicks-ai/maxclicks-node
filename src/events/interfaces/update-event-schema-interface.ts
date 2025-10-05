import { Json } from '../helpers/json-schema-helper';

export interface UpdateEventSchemaRequest {
  readonly schemaId: string; // Required for PUT /events/schema
  readonly schemaUpdates: {
    readonly name?: string;
    readonly slug?: string;
    readonly description?: string | null;
    readonly payloadJsonSchema?: Json; // JSON Schema
  };
}

export interface UpdateEventSchemaResponse {
  readonly schemaUpdatedAt: number;
}
