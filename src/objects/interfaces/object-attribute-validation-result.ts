import { AttributeResponse, AttributeType } from '../../attributes/interfaces';

export interface ObjectAttributeValidationResult {
  isValid: boolean;
  existingAttributes: Record<string, AttributeResponse>;
  missingAttributes: Array<{
    key: string;
    suggestedType: AttributeType;
    reason: string;
  }>;
  errors: Array<{
    field: string;
    message: string;
    suggestion: string;
  }>;
}
