import { Json } from '../helpers/json-schema-helper';

export interface CreateEventSchemaRequest {
  readonly schema: {
    readonly name?: string;
    readonly slug: string;
    readonly description?: string | null;
    readonly payloadJsonSchema?: Json;
  };
}

export interface CreateEventSchemaResponse {
  readonly schemaId: string;
}
