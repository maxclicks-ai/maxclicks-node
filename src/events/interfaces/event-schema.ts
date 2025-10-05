// Json type - matching API's Json payload type
type Json = null | string | number | boolean | readonly Json[] | { readonly [key: string]: Json };

export interface EventSchema {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly eventsCount: number;
}

export interface EventSchemaWithDetails extends EventSchema {
  readonly source: EventSource;
  readonly payloadJsonSchema: Json; // JSON Schema
}
