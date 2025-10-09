export const AttributeTypes = [
  'string',
  'number',
  'boolean',
  'date time',
  'date only',
  'id array',
] as const;
export type AttributeType = (typeof AttributeTypes)[number];

export interface Attribute {
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly key: string;
  readonly label: string;
  readonly description: string | null;
  readonly type: AttributeType;
}

export namespace AttributeType {
  export const metadataByType = {
    string: { label: 'Text', description: 'Plain text (String)' },
    number: { label: 'Number', description: 'Numerical (Number)' },
    boolean: { label: 'Checkbox', description: 'True/False (Boolean)' },
    'date time': {
      label: 'Timestamp',
      description: 'Complete date with time (ISO formatted string)',
    },
    'date only': { label: 'Date', description: 'Date without time (YYYY-MM-DD formatted string)' },
    'id array': {
      label: 'ID List',
      description: 'Collection of identifiers (List of IDs, string array)',
    },
  } as const;
}

export type PublicValue = PublicValue.ByType<AttributeType>;

export namespace PublicValue {
  export type ByType<T extends AttributeType> = {
    string: string | null;
    number: number | null;
    boolean: boolean | null;
    'date time': string | null;
    'date only': string | null;
    'id array': string[] | null;
  }[T];

  export function convertToValue(publicValue: PublicValue, type: AttributeType): any {
    if (publicValue === undefined || publicValue === null) return undefined;
    switch (type) {
      case 'string':
        return publicValue;
      case 'number':
        return publicValue;
      case 'boolean':
        return publicValue;
      case 'date time':
        return new Date(publicValue as any).getTime();
      case 'date only':
        return new Date(publicValue as any).getTime();
      case 'id array':
        return publicValue;
    }
  }
}

export interface PublicValuesByKey {
  [key: string]: PublicValue;
}
