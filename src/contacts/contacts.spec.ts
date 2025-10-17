import { vi, describe, beforeEach, it, expect } from 'vitest';
import { Maxclicks } from '../maxclicks';
import type {
  Contact,
  CreateContactResponse,
  CreateContactsBatchResponse,
  UpdateContactResponse,
  DeleteContactResponse,
  DeleteContactByIdResponse,
  ListContactsResponse,
} from './interfaces';
import type { ErrorResponse } from '../interfaces';
import { TEST_BASE_URL, TEST_API_KEY } from '../test-utils/test-config';

const fetchMock = vi.fn();
global.fetch = fetchMock as unknown as typeof fetch;

const mockSuccessResponse = (data: any, status = 200) => {
  fetchMock.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => ({ success: true, data }),
    headers: new Headers({ 'content-type': 'application/json' }),
  });
};

const mockErrorResponse = (error: ErrorResponse, status = 422) => {
  fetchMock.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(error),
    json: async () => error,
    headers: new Headers({ 'content-type': 'application/json' }),
  });
};

describe('Contacts', () => {
  let maxclicks: Maxclicks;

  beforeEach(() => {
    fetchMock.mockReset();
    maxclicks = new Maxclicks(TEST_API_KEY);
  });

  describe('create (direct API)', () => {
    it('should create a contact successfully', async () => {
      const mockResponse: CreateContactResponse = {
        id: '99cd1948-d950-4504-b925-07533602895e23',
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.contacts.create({
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        `${TEST_BASE_URL}/v1/contacts`,
        expect.objectContaining({
          method: 'POST',
          body: expect.any(String),
        })
      );

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(callArgs[1].body as string);
      expect(body.email).toBe('john.doe@example.com');
      expect(body.firstName).toBe('John');
      expect(body.lastName).toBe('Doe');

      expect(result.error).toBe(null);
      expect(result.data).toEqual(mockResponse);
      expect(result.data?.id).toBe('99cd1948-d950-4504-b925-07533602895e23');
    });

    it('should create a contact with custom attributes', async () => {
      const mockResponse: CreateContactResponse = {
        id: '76133578-1d42-42d2-acb2-d38c5d7ca2f5',
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.contacts.create({
        email: 'jane@example.com',
        firstName: 'Jane',
        attributeValuesByKey: {
          plan: 'premium',
          signupDate: '2025-01-01T00:00:00Z',
        },
      });

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(callArgs[1].body as string);
      expect(body.attributeValuesByKey).toEqual({
        plan: 'premium',
        signupDate: '2025-01-01T00:00:00Z',
      });

      expect(result.error).toBe(null);
      expect(result.data?.id).toBe('76133578-1d42-42d2-acb2-d38c5d7ca2f5');
    });

    it('should create a contact with tags', async () => {
      const mockResponse: CreateContactResponse = {
        id: '9cd4582b-5d79-421d-b1d5-6116be7982e7',
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.contacts.create({
        email: 'user@example.com',
        firstName: 'User',
        tags: ['vip', 'customer'],
      });

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(callArgs[1].body as string);
      expect(body.tags).toEqual(['vip', 'customer']);

      expect(result.error).toBe(null);
    });

    it('should handle duplicate email error', async () => {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'validation_error',
          message: 'Contact with email already exists',
        },
        requestId: 'req_duplicate',
        timestamp: new Date().toISOString(),
      };

      mockErrorResponse(errorResponse, 422);

      const result = await maxclicks.contacts.create({
        email: 'existing@example.com',
        firstName: 'Test',
      });

      expect(result.data).toBe(null);
      expect(result.error).toEqual(errorResponse);
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await maxclicks.contacts.create({
        email: 'test@example.com',
        firstName: 'Test',
      });

      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('application_error');
    });
  });

  describe('create (fluent builder)', () => {
    it('should create a contact using fluent API', async () => {
      const mockResponse: CreateContactResponse = {
        id: '869ebf33-e9c5-4b2a-807d-e927a0a561e8',
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.contacts
        .create()
        .email('builder@example.com')
        .firstName('Builder')
        .lastName('Test')
        .execute();

      expect(result.error).toBe(null);
      if (result.data && 'id' in result.data) {
        expect(result.data.id).toBe('869ebf33-e9c5-4b2a-807d-e927a0a561e8');
      }
    });

    it('should create a contact with custom attributes using fluent API', async () => {
      const mockResponse: CreateContactResponse = {
        id: '4b560703-9fd7-46cc-a80c-c48b90f095a5',
      };

      // Mock the attributes list call (for validation) - return matching attributes
      mockSuccessResponse({
        attributes: [
          {
            key: 'plan',
            label: 'Plan',
            type: 'string',
            description: null,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
          },
          {
            key: 'score',
            label: 'Score',
            type: 'number',
            description: null,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
          },
        ],
      });
      // Mock the contact creation
      mockSuccessResponse(mockResponse);

      const result = await maxclicks.contacts
        .create()
        .email('custom@example.com')
        .firstName('Custom')
        .customAttribute('plan', 'premium')
        .customAttribute('score', 95)
        .execute();

      expect(result.error).toBe(null);
    });

    it('should add tags using fluent API', async () => {
      const mockResponse: CreateContactResponse = {
        id: 'fc81fc28-cf6a-4b4b-9889-57a141a808c8',
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.contacts
        .create()
        .email('tags@example.com')
        .firstName('Tags')
        .tag('vip')
        .tag('customer')
        .tag('premium')
        .execute();

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(callArgs[1].body as string);
      expect(body.tags).toEqual(['vip', 'customer', 'premium']);

      expect(result.error).toBe(null);
    });

    it('should validate email before executing', async () => {
      const result = await maxclicks.contacts.create().firstName('No Email').execute();

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('validation_error');
      expect(result.error?.error.message).toContain('Email is required');
    });

    it('should validate email format', async () => {
      const result = await maxclicks.contacts
        .create()
        .email('invalid-email')
        .firstName('Invalid')
        .execute();

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('validation_error');
      expect(result.error?.error.message).toContain('Invalid email format');
    });

    it('should preview request without executing', () => {
      const preview = maxclicks.contacts
        .create()
        .email('preview@example.com')
        .firstName('Preview')
        .customAttribute('plan', 'basic')
        .preview();

      expect(preview.email).toBe('preview@example.com');
      expect(preview.firstName).toBe('Preview');
      expect(preview.attributeValuesByKey?.plan).toBe('basic');
    });
  });

  describe('createBatch', () => {
    it('should create multiple contacts in batch', async () => {
      const mockResponse: CreateContactsBatchResponse = {
        ids: [
          '99cd1948-d950-4504-b925-07533602895e',
          '24c317c0-a93d-42f9-879e-9537dc4afaea',
          'bb36631d-6cdf-49e9-aadc-bf74462c72fc',
        ],
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.contacts.createBatch([
        { email: 'user1@example.com', firstName: 'User1' },
        { email: 'user2@example.com', firstName: 'User2' },
        { email: 'user3@example.com', firstName: 'User3' },
      ]);

      expect(fetchMock).toHaveBeenCalledWith(
        `${TEST_BASE_URL}/v1/contacts/batch`,
        expect.objectContaining({
          method: 'POST',
        })
      );

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(callArgs[1].body as string);
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(3);

      expect(result.error).toBe(null);
      expect(result.data?.ids).toEqual([
        '99cd1948-d950-4504-b925-07533602895e',
        '24c317c0-a93d-42f9-879e-9537dc4afaea',
        'bb36631d-6cdf-49e9-aadc-bf74462c72fc',
      ]);
    });

    it('should handle validation error for empty array', async () => {
      const result = await maxclicks.contacts.createBatch([]);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('validation_error');
      expect(result.error?.error.message).toContain('must not be empty');
    });

    it('should handle validation error for invalid contact objects', async () => {
      const result = await maxclicks.contacts.createBatch([
        { email: 'valid@example.com', firstName: 'Valid' },
        null as any,
      ]);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('invalid_parameter');
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await maxclicks.contacts.createBatch([
        { email: 'user@example.com', firstName: 'User' },
      ]);

      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('application_error');
    });
  });

  describe('list', () => {
    it('should list all contacts with pagination', async () => {
      const mockResponse: ListContactsResponse = {
        contacts: [
          {
            id: '99cd1948-d950-4504-b925-07533602895e',
            email: 'user1@example.com',
            firstName: 'User',
            lastName: 'One',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
            source: null,
            subscribed: true,
            fullName: 'User One',
            phone: null,
            avatarUrl: null,
            userId: null,
            userGroup: null,
            notes: null,
            tags: [],
          },
        ],
        pagination: {
          page: 1,
          per_page: 25,
          total_count: 1,
          total_pages: 1,
        },
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.contacts.list();

      expect(fetchMock).toHaveBeenCalledWith(
        `${TEST_BASE_URL}/v1/contacts`,
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result.error).toBe(null);
      expect(result.data?.contacts).toHaveLength(1);
      expect(result.data?.pagination.total_count).toBe(1);
    });

    it('should filter contacts by name', async () => {
      const mockResponse: ListContactsResponse = {
        contacts: [],
        pagination: {
          page: 1,
          per_page: 25,
          total_count: 0,
          total_pages: 0,
        },
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.contacts.list({ name: 'John' });

      expect(fetchMock).toHaveBeenCalledWith(
        `${TEST_BASE_URL}/v1/contacts?name=John`,
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result.error).toBe(null);
    });

    it('should filter contacts by email', async () => {
      const mockResponse: ListContactsResponse = {
        contacts: [],
        pagination: {
          page: 1,
          per_page: 25,
          total_count: 0,
          total_pages: 0,
        },
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.contacts.list({ email: 'john@example.com' });

      expect(fetchMock).toHaveBeenCalledWith(
        `${TEST_BASE_URL}/v1/contacts?email=john%40example.com`,
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result.error).toBe(null);
    });

    it('should support pagination options', async () => {
      const mockResponse: ListContactsResponse = {
        contacts: [],
        pagination: {
          page: 2,
          per_page: 50,
          total_count: 100,
          total_pages: 2,
        },
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.contacts.list({ page: 2, per_page: 50 });

      expect(fetchMock).toHaveBeenCalledWith(
        `${TEST_BASE_URL}/v1/contacts?page=2&per_page=50`,
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result.error).toBe(null);
      expect(result.data?.pagination.page).toBe(2);
      expect(result.data?.pagination.per_page).toBe(50);
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await maxclicks.contacts.list();

      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('application_error');
    });
  });

  describe('retrieve / getById', () => {
    it('should retrieve a contact by ID', async () => {
      const mockResponse: Contact = {
        id: '99cd1948-d950-4504-b925-07533602895e23',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        source: null,
        subscribed: true,
        fullName: 'John Doe',
        phone: null,
        avatarUrl: null,
        userId: null,
        userGroup: null,
        notes: null,
        tags: ['customer'],
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.contacts.retrieve('99cd1948-d950-4504-b925-07533602895e23');

      expect(fetchMock).toHaveBeenCalledWith(
        `${TEST_BASE_URL}/v1/contacts/99cd1948-d950-4504-b925-07533602895e23`,
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result.error).toBe(null);
      expect(result.data?.id).toBe('99cd1948-d950-4504-b925-07533602895e23');
      expect(result.data?.email).toBe('john@example.com');
    });

    it('should retrieve a contact using getById alias', async () => {
      const mockResponse: Contact = {
        id: '76133578-1d42-42d2-acb2-d38c5d7ca2f5',
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        source: null,
        subscribed: true,
        fullName: 'Jane Smith',
        phone: null,
        avatarUrl: null,
        userId: null,
        userGroup: null,
        notes: null,
        tags: [],
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.contacts.getById('76133578-1d42-42d2-acb2-d38c5d7ca2f5');

      expect(result.error).toBe(null);
      expect(result.data?.id).toBe('76133578-1d42-42d2-acb2-d38c5d7ca2f5');
    });

    it('should handle validation error for missing ID', async () => {
      const result = await maxclicks.contacts.retrieve('');

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('invalid_parameter');
    });

    it('should handle not found error', async () => {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'not_found',
          message: 'Contact not found',
        },
        requestId: 'req_not_found',
        timestamp: new Date().toISOString(),
      };

      mockErrorResponse(errorResponse, 404);

      const result = await maxclicks.contacts.retrieve('non-existent');

      expect(result.data).toBe(null);
      expect(result.error).toEqual(errorResponse);
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await maxclicks.contacts.retrieve('99cd1948-d950-4504-b925-07533602895e23');

      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('application_error');
    });
  });

  describe('update (direct API)', () => {
    it('should update a contact successfully', async () => {
      const mockResponse: UpdateContactResponse = {
        updatedAt: '2025-01-02T00:00:00Z',
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.contacts.update('99cd1948-d950-4504-b925-07533602895e23', {
        firstName: 'Jane',
        lastName: 'Updated',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        `${TEST_BASE_URL}/v1/contacts/99cd1948-d950-4504-b925-07533602895e23`,
        expect.objectContaining({
          method: 'PUT',
          body: expect.any(String),
        })
      );

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(callArgs[1].body as string);
      expect(body.firstName).toBe('Jane');
      expect(body.lastName).toBe('Updated');

      expect(result.error).toBe(null);
      expect(result.data?.updatedAt).toBe('2025-01-02T00:00:00Z');
    });

    it('should update custom attributes', async () => {
      const mockResponse: UpdateContactResponse = {
        updatedAt: '2025-01-02T00:00:00Z',
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.contacts.update('99cd1948-d950-4504-b925-07533602895e23', {
        attributeValuesByKey: {
          plan: 'enterprise',
          score: 100,
        },
      });

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(callArgs[1].body as string);
      expect(body.attributeValuesByKey?.plan).toBe('enterprise');
      expect(body.attributeValuesByKey?.score).toBe(100);

      expect(result.error).toBe(null);
    });

    it('should handle not found error', async () => {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'not_found',
          message: 'Contact not found',
        },
        requestId: 'req_not_found',
        timestamp: new Date().toISOString(),
      };

      mockErrorResponse(errorResponse, 404);

      const result = await maxclicks.contacts.update('non-existent', {
        firstName: 'Test',
      });

      expect(result.data).toBe(null);
      expect(result.error).toEqual(errorResponse);
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await maxclicks.contacts.update('99cd1948-d950-4504-b925-07533602895e23', {
        firstName: 'Test',
      });

      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('application_error');
    });
  });

  describe('update (fluent builder)', () => {
    it('should update a contact using fluent API', async () => {
      const mockResponse: UpdateContactResponse = {
        updatedAt: '2025-01-02T00:00:00Z',
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.contacts
        .update('99cd1948-d950-4504-b925-07533602895e23')
        .firstName('Updated')
        .lastName('Name')
        .execute();

      expect(result.error).toBe(null);
      if (result.data && 'updatedAt' in result.data) {
        expect(result.data.updatedAt).toBe('2025-01-02T00:00:00Z');
      }
    });

    it('should update custom attributes using fluent API', async () => {
      const mockResponse: UpdateContactResponse = {
        updatedAt: '2025-01-02T00:00:00Z',
      };

      // Mock the attributes list call (for validation) - return matching attributes
      mockSuccessResponse({
        attributes: [
          {
            key: 'plan',
            label: 'Plan',
            type: 'string',
            description: null,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
          },
          {
            key: 'status',
            label: 'Status',
            type: 'string',
            description: null,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
          },
        ],
      });
      // Mock the contact update
      mockSuccessResponse(mockResponse);

      const result = await maxclicks.contacts
        .update('99cd1948-d950-4504-b925-07533602895e23')
        .customAttribute('plan', 'pro')
        .customAttribute('status', 'active')
        .execute();

      expect(result.error).toBe(null);
    });

    it('should allow email updates (validation optional for updates)', async () => {
      const mockResponse: UpdateContactResponse = {
        updatedAt: '2025-01-02T00:00:00Z',
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.contacts
        .update('99cd1948-d950-4504-b925-07533602895e23')
        .email('newemail@example.com')
        .execute();

      expect(result.error).toBe(null);
    });

    it('should validate email format when provided in update', async () => {
      const result = await maxclicks.contacts
        .update('99cd1948-d950-4504-b925-07533602895e23')
        .email('invalid-email')
        .execute();

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('validation_error');
      expect(result.error?.error.message).toContain('Invalid email format');
    });
  });

  describe('deleteById', () => {
    it('should delete a contact by ID', async () => {
      const mockResponse: DeleteContactByIdResponse = {};

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.contacts.deleteById('99cd1948-d950-4504-b925-07533602895e23');

      expect(fetchMock).toHaveBeenCalledWith(
        `${TEST_BASE_URL}/v1/contacts/99cd1948-d950-4504-b925-07533602895e23`,
        expect.objectContaining({
          method: 'DELETE',
        })
      );

      expect(result.error).toBe(null);
      expect(result.data).toEqual({});
    });

    it('should handle validation error for missing ID', async () => {
      const result = await maxclicks.contacts.deleteById('');

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('invalid_parameter');
    });

    it('should handle not found error', async () => {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'not_found',
          message: 'Contact not found',
        },
        requestId: 'req_not_found',
        timestamp: new Date().toISOString(),
      };

      mockErrorResponse(errorResponse, 404);

      const result = await maxclicks.contacts.deleteById('non-existent');

      expect(result.data).toBe(null);
      expect(result.error).toEqual(errorResponse);
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await maxclicks.contacts.deleteById('99cd1948-d950-4504-b925-07533602895e23');

      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('application_error');
    });
  });

  describe('delete (by identifier)', () => {
    it('should delete a contact by email', async () => {
      const mockResponse: DeleteContactResponse = {
        id: '99cd1948-d950-4504-b925-07533602895e23',
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.contacts.delete({
        email: 'user@example.com',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        `${TEST_BASE_URL}/v1/contacts`,
        expect.objectContaining({
          method: 'DELETE',
        })
      );

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(callArgs[1].body as string);
      expect(body.email).toBe('user@example.com');

      expect(result.error).toBe(null);
      expect(result.data?.id).toBe('99cd1948-d950-4504-b925-07533602895e23');
    });

    it('should delete a contact by userId', async () => {
      const mockResponse: DeleteContactResponse = {
        id: '76133578-1d42-42d2-acb2-d38c5d7ca2f5',
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.contacts.delete({
        userId: 'user-external-123',
      });

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(callArgs[1].body as string);
      expect(body.userId).toBe('user-external-123');

      expect(result.error).toBe(null);
      expect(result.data?.id).toBe('76133578-1d42-42d2-acb2-d38c5d7ca2f5');
    });

    it('should delete a contact by phone', async () => {
      const mockResponse: DeleteContactResponse = {
        id: '9cd4582b-5d79-421d-b1d5-6116be7982e7',
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.contacts.delete({
        phone: '+1234567890',
      });

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(callArgs[1].body as string);
      expect(body.phone).toBe('+1234567890');

      expect(result.error).toBe(null);
    });

    it('should delete a contact by ID', async () => {
      const mockResponse: DeleteContactResponse = {
        id: '99cd1948-d950-4504-b925-07533602895e23',
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.contacts.delete({
        id: '99cd1948-d950-4504-b925-07533602895e23',
      });

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(callArgs[1].body as string);
      expect(body.id).toBe('99cd1948-d950-4504-b925-07533602895e23');

      expect(result.error).toBe(null);
    });

    it('should handle validation error for missing identifier', async () => {
      const result = await maxclicks.contacts.delete({});

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('validation_error');
      expect(result.error?.error.message).toContain('At least one identifier is required');
    });

    it('should handle not found error', async () => {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'not_found',
          message: 'Contact not found',
        },
        requestId: 'req_not_found',
        timestamp: new Date().toISOString(),
      };

      mockErrorResponse(errorResponse, 404);

      const result = await maxclicks.contacts.delete({
        email: 'nonexistent@example.com',
      });

      expect(result.data).toBe(null);
      expect(result.error).toEqual(errorResponse);
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await maxclicks.contacts.delete({
        email: 'user@example.com',
      });

      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('application_error');
    });
  });

  describe('quick', () => {
    it('should create a contact with quick helper', async () => {
      const mockResponse: CreateContactResponse = {
        id: 'f0ff0c69-9c1e-4502-890f-b1dcac15d80a',
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.contacts.quick('quick@example.com', 'Quick', 'User');

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(callArgs[1].body as string);
      expect(body.email).toBe('quick@example.com');
      expect(body.firstName).toBe('Quick');
      expect(body.lastName).toBe('User');

      expect(result.error).toBe(null);
      expect(result.data?.id).toBe('f0ff0c69-9c1e-4502-890f-b1dcac15d80a');
    });

    it('should create a contact without lastName', async () => {
      const mockResponse: CreateContactResponse = {
        id: '1724e669-1c40-4b09-b721-7d43f4ab041b',
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.contacts.quick('quick@example.com', 'Quick');

      const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(callArgs[1].body as string);
      expect(body.email).toBe('quick@example.com');
      expect(body.firstName).toBe('Quick');
      expect(body.lastName).toBeUndefined();

      expect(result.error).toBe(null);
    });

    it('should validate email format', async () => {
      const result = await maxclicks.contacts.quick('invalid-email', 'Test');

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('invalid_parameter');
    });

    it('should handle empty email', async () => {
      const result = await maxclicks.contacts.quick('', 'Test');

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.data).toBe(null);
      expect(result.error?.error.code).toBe('invalid_parameter');
    });
  });

  describe('batch operations', () => {
    it('should create contacts using batch().create()', async () => {
      const mockResponse: CreateContactsBatchResponse = {
        ids: ['batch-1', 'batch-2'],
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.contacts.batch().create([
        { email: 'batch1@example.com', firstName: 'Batch1' },
        { email: 'batch2@example.com', firstName: 'Batch2' },
      ]);

      expect(result.error).toBe(null);
      expect(result.data?.ids).toEqual(['batch-1', 'batch-2']);
    });
  });

  describe('builder', () => {
    it('should create a contact using builder() method', async () => {
      const mockResponse: CreateContactResponse = {
        id: '464b6a8b-c9b8-429f-bd59-061f845792e9',
      };

      mockSuccessResponse(mockResponse);

      const result = await maxclicks.contacts
        .builder()
        .email('builder@example.com')
        .firstName('Builder')
        .create();

      expect(result.error).toBe(null);
      if (result.data && 'id' in result.data) {
        expect(result.data.id).toBe('464b6a8b-c9b8-429f-bd59-061f845792e9');
      }
    });
  });
});
