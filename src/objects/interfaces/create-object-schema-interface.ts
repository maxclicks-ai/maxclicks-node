export interface CreateObjectSchemaRequest {
  readonly schema: {
    readonly slug: string;
    readonly name?: string;
    readonly description?: string | null;
  };
}

export interface CreateObjectSchemaResponse {
  readonly schemaId: string;
}
