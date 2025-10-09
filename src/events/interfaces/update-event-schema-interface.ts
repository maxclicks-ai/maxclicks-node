import { Json } from '../helpers/json-schema-helper';

export interface UpdateEventSchemaRequest {
  readonly schemaId: string;
  readonly schemaUpdates: {
    readonly name?: string;
    readonly slug?: string;
    readonly description?: string | null;
    readonly payloadJsonSchema?: Json;
  };
}

export interface UpdateEventSchemaResponse {
  readonly schemaUpdatedAt: number;
}
