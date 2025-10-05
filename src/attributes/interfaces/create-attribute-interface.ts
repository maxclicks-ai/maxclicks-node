import { AttributeResponse, AttributeTarget, AttributeType } from './attribute';

export interface CreateAttributeRequest {
  readonly target: AttributeTarget;
  readonly data: {
    readonly key: string;
    readonly label: string;
    readonly description: string | null;
    readonly type: AttributeType;
  };
}

export interface CreateAttributeResponse {
  readonly attribute: AttributeResponse;
}
