export interface UpdateObjectSchemaRequest {
  readonly schemaId: string;
  readonly schemaUpdates: Partial<{
    readonly name: string;
    readonly slug: string;
    readonly description: string | null;
  }>;
}

export interface UpdateObjectSchemaResponse {
  readonly schemaUpdatedAt: number;
}
