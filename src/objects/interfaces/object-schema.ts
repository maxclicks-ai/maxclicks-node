export interface ObjectSchema {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly objectsCount: number;
}
