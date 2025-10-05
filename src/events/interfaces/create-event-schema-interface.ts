import { Json } from '../helpers/json-schema-helper';

export interface CreateEventSchemaRequest {
  readonly schema: {
    readonly name?: string; // Optional - will be auto-generated from slug if not provided
    readonly slug: string;
    readonly description?: string | null;
    readonly payloadJsonSchema?: Json; // JSON Schema
  };
}

export interface CreateEventSchemaResponse {
  readonly schemaId: string;
}
