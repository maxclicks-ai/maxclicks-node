# maxclicks Node.js SDK

The official Node.js SDK for the maxclicks API. Build powerful integrations with contacts, objects, events, and templates.

[![npm version](https://badge.fury.io/js/%40maxclicks%2Fnode-sdk.svg)](https://www.npmjs.com/package/@maxclicks/node-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Quick Start

Get up and running in less than 5 minutes:

```bash
npm install @maxclicks/node-sdk
```

```typescript
import { Maxclicks } from '@maxclicks/node-sdk';

const maxclicks = new Maxclicks('your-api-key');

// Create a contact
# Maxclicks Node.js SDK

The official Node.js SDK for the Maxclicks API. Build powerful customer engagement workflows with contacts, objects, events, attributes, and templates.

[![npm version](https://badge.fury.io/js/%40maxclicks%2Fnode-sdk.svg)](https://www.npmjs.com/package/@maxclicks/node-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Quick Start

```bash
npm install @maxclicks/node-sdk
```

```typescript
import { Maxclicks } from '@maxclicks/node-sdk';

// Initialize with your API key
const maxclicks = new Maxclicks('max_your_api_key');

// Create a contact
const result = await maxclicks.contacts.create({
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  tags: ['customer']
});

if (result.error) {
  console.error('Error:', result.error);
} else {
  console.log('Contact created:', result.data.id);
}
```

## 📦 Installation

```bash
# npm
npm install @maxclicks/node-sdk

# yarn
yarn add @maxclicks/node-sdk

# pnpm
pnpm add @maxclicks/node-sdk
```

## 🔑 Authentication

Get your API key from the [Maxclicks Dashboard](https://app.maxclicks.ai/settings/developers).

```typescript
import { Maxclicks } from '@maxclicks/node-sdk';

// Simple initialization
const maxclicks = new Maxclicks('max_your_api_key');

// Advanced configuration
const maxclicks = new Maxclicks({
  apiKey: 'max_your_api_key',
  baseUrl: 'https://api.maxclicks.ai', // Optional: defaults to production
  logLevel: 'debug' // Optional: 'silent' | 'error' | 'warn' | 'info' | 'debug'
});
```

## ✨ Features

- 🎯 **Full TypeScript Support** - Complete type safety and IntelliSense
- 🔄 **Promise-based API** - Modern async/await syntax
- 🏗️ **Builder Pattern** - Fluent API for complex operations
- 📊 **Comprehensive Error Handling** - Detailed error responses
- 🔍 **API Key Validation** - Built-in authentication checking
- 🎨 **Multiple API Styles** - Use builders or direct API calls
- 📝 **Auto-create Attributes** - Intelligent attribute management
- ⚡ **Batch Operations** - Efficient bulk data processing

## 📚 Core Resources

### Contacts

Manage your contact database with full CRUD operations and advanced filtering.

#### Create Contact

```typescript
// Method 1: Direct API
const result = await maxclicks.contacts.create({
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1234567890',
  tags: ['customer', 'vip'],
  attributeValuesByKey: {
    plan: 'premium',
    signupDate: new Date().toISOString()
  }
});

// Method 2: Fluent Builder
const contact = await maxclicks.contacts
  .create()
  .email('user@example.com')
  .firstName('John')
  .lastName('Doe')
  .phone('+1234567890')
  .tag('customer')
  .tag('vip')
  .customAttribute('plan', 'premium')
  .customAttribute('signupDate', new Date().toISOString())
  .execute();
```

#### List Contacts

```typescript
// List all contacts
const result = await maxclicks.contacts.list();

// With pagination
const result = await maxclicks.contacts.list({
  page: 1,
  per_page: 25
});

// Filter by name
const result = await maxclicks.contacts.list({
  name: 'John' // Partial match on firstName or lastName
});

// Filter by email
const result = await maxclicks.contacts.list({
  email: 'user@example.com' // Exact match
});

// Access results
if (result.data) {
  console.log('Contacts:', result.data.contacts);
  console.log('Pagination:', result.data.pagination);
}
```

#### Get Contact

```typescript
// Get by ID
const result = await maxclicks.contacts.retrieve('contact_id');
// or
const result = await maxclicks.contacts.getById('contact_id');

if (result.error) {
  console.error('Contact not found:', result.error);
} else {
  console.log('Contact:', result.data);
}
```

#### Update Contact

```typescript
// Update contact
const result = await maxclicks.contacts.update('contact_id', {
  firstName: 'Jane',
  attributeValuesByKey: {
    plan: 'enterprise'
  }
});

// Using builder with auto-create for missing attributes
const updated = await maxclicks.contacts
  .update('contact_id')
  .firstName('Jane')
  .customAttribute('newField', 'value')
  .autoCreate(true) // Auto-create 'newField' if it doesn't exist
  .execute();
```

#### Delete Contact

```typescript
// Delete by ID
await maxclicks.contacts.deleteById('contact_id');

// Delete by identifier (email or custom ID)
await maxclicks.contacts.delete({
  identifier: { type: 'email', value: 'user@example.com' }
});
```

#### Batch Operations

```typescript
// Create multiple contacts
const result = await maxclicks.contacts.batch().create([
  { email: 'user1@example.com', firstName: 'User', lastName: 'One' },
  { email: 'user2@example.com', firstName: 'User', lastName: 'Two' },
  { email: 'user3@example.com', firstName: 'User', lastName: 'Three' }
]);

if (result.data) {
  console.log('Created contacts:', result.data.ids);
  console.log('Success:', result.data.success);
}
```

### Objects

Work with custom objects and their schemas for storing structured business data.

#### List Object Schemas

```typescript
const result = await maxclicks.objects.listSchemas({
  page: 1,
  per_page: 20
});

if (result.data) {
  result.data.schemas.forEach(schema => {
    console.log('Schema:', schema.name, schema.slug);
  });
}
```

#### Create Object Schema

```typescript
const result = await maxclicks.objects.createSchema({
  schema: {
    name: 'Products',
    slug: 'products',
    description: 'Product catalog'
  }
});
```

#### Create Object

```typescript
// Direct API
const result = await maxclicks.objects.create('products', {
  objectId: 'prod-123',
  notes: 'Premium product line',
  tags: ['featured', 'premium'],
  attributeValuesByKey: {
    name: 'Premium Widget',
    price: 99.99,
    category: 'electronics',
    inStock: true,
    features: ['wireless', 'bluetooth', 'premium']
  }
});

// Using builder
const product = await maxclicks.objects.builder()
  .schema('products')
  .objectId('prod-123')
  .attribute('name', 'Premium Widget')
  .attribute('price', 99.99)
  .attribute('category', 'electronics')
  .tags(['featured', 'premium'])
  .notes('Premium product line')
  .execute();
```

#### List Objects

```typescript
const result = await maxclicks.objects.list('products', {
  page: 1,
  per_page: 20,
  tags: ['featured']
});
```

#### Get Object

```typescript
const result = await maxclicks.objects.get('products', 'prod-123');
// or
const result = await maxclicks.objects.getById('products', 'prod-123');
```

#### Update Object

```typescript
const result = await maxclicks.objects.update('products', 'prod-123', {
  attributeValuesByKey: {
    price: 89.99,
    inStock: false
  }
});
```

#### Delete Object

```typescript
// Delete by objectId
await maxclicks.objects.delete('products', {
  identifier: { type: 'objectId', value: 'prod-123' }
});

// Delete by database ID
await maxclicks.objects.deleteById('products', 'database-id');
```

#### Batch Create Objects

```typescript
const result = await maxclicks.objects.createBatch('products', [
  {
    objectId: 'prod-124',
    attributeValuesByKey: { name: 'Basic Widget', price: 29.99 }
  },
  {
    objectId: 'prod-125',
    attributeValuesByKey: { name: 'Pro Widget', price: 149.99 }
  }
]);
```

### Attributes

Manage custom attributes for contacts and objects.

#### Create Attribute

```typescript
// For contacts
const result = await maxclicks.attributes.create({
  target: { type: 'contact' },
  data: {
    key: 'subscription_plan',
    label: 'Subscription Plan',
    type: 'string',
    description: 'Customer subscription tier'
  }
});

// For objects
const result = await maxclicks.attributes.create({
  target: { type: 'object', objectSchemaId: 'products' },
  data: {
    key: 'price',
    label: 'Price',
    type: 'number',
    description: 'Product price in USD'
  }
});

// Using builder for contacts
const attribute = await maxclicks.attributes
  .target('contact')
  .create()
  .key('subscription_plan')
  .label('Subscription Plan')
  .type('string')
  .description('Customer subscription tier')
  .execute();

// Using builder for objects
const attribute = await maxclicks.attributes
  .target({ object: 'products' })
  .create()
  .key('price')
  .label('Price')
  .type('number')
  .execute();
```

#### Attribute Types

Supported attribute types:
- `string` - Text values
- `number` - Numeric values
- `boolean` - True/false values
- `date time` - ISO 8601 timestamp
- `date only` - YYYY-MM-DD date
- `id array` - Array of IDs

#### List Attributes

```typescript
// List contact attributes
const result = await maxclicks.attributes.list({
  target_type: 'contact'
});

// List object schema attributes
const result = await maxclicks.attributes.list({
  target_type: 'object',
  objectSchemaId: 'products'
});
```

#### Batch Create Attributes

```typescript
const result = await maxclicks.attributes.createBatch({
  operations: [
    {
      target: { type: 'contact' },
      data: {
        key: 'subscription_plan',
        label: 'Subscription Plan',
        type: 'string',
        description: 'Customer subscription tier'
      }
    },
    {
      target: { type: 'contact' },
      data: {
        key: 'signup_date',
        label: 'Signup Date',
        type: 'date time',
        description: 'When the customer signed up'
      }
    }
  ]
});

// Check individual results
if (result.data) {
  result.data.results.forEach((result, index) => {
    if (result.success) {
      console.log(`Attribute ${index + 1} created:`, result.attribute);
    } else {
      console.error(`Attribute ${index + 1} failed:`, result.error);
    }
  });
}
```

#### Delete Attribute

```typescript
await maxclicks.attributes.delete('old_attribute', {
  target: { type: 'contact' }
});
```


### Events

Track and manage events with schema validation.

#### Create Event Schema

```typescript
// Direct API
const result = await maxclicks.events.createSchema({
  schema: {
    slug: 'user-signup',
    name: 'User Signup Event',
    description: 'Triggered when a user signs up',
    payloadJsonSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        plan: { type: 'string', enum: ['free', 'premium', 'enterprise'] },
        referralCode: { type: 'string' }
      },
      required: ['email', 'plan']
    }
  }
});

// Using builder
const schema = await maxclicks.events.builder()
  .slug('user-signup')
  .name('User Signup Event')
  .description('Triggered when a user signs up')
  .schema({
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email' },
      plan: { type: 'string', enum: ['free', 'premium'] }
    },
    required: ['email']
  })
  .execute();
```

#### List Event Schemas

```typescript
const result = await maxclicks.events.listSchemas({
  page: 1,
  per_page: 20
});
```

#### Get Event Schema

```typescript
const result = await maxclicks.events.getSchema('user-signup');
```

#### Update Event Schema

```typescript
const result = await maxclicks.events.updateSchema({
  schemaId: 'schema-id',
  schemaUpdates: {
    name: 'Updated Event Name',
    description: 'Updated description'
  }
});
```

#### Track Event

```typescript
// Track an event instance
const result = await maxclicks.events.track({
  slug: 'user-signup',
  userId: 'user-123',
  payload: {
    email: 'user@example.com',
    plan: 'premium',
    referralCode: 'FRIEND2024'
  }
});

// Using builder
const event = await maxclicks.events.simpleBuilder()
  .slug('user-signup')
  .userId('user-123')
  .payload({
    email: 'user@example.com',
    plan: 'premium'
  })
  .execute();
```


### Templates

Send templated communications with dynamic data. Templates must be created in the Maxclicks dashboard first, then you can send them using their UUID.

#### Send Template

```typescript
// Template ID must be a valid UUID from your Maxclicks dashboard
const result = await maxclicks.templates.send('123e4567-e89b-12d3-a456-426614174000', {
  data: {
    // The recipient contact (can be ID, email, or contact object)
    recipient: 'user@example.com',
    
    // Additional data based on your template schema
    firstName: 'John',
    orderNumber: 'ORD-12345',
    items: [
      { name: 'Product 1', price: 29.99 },
      { name: 'Product 2', price: 49.99 }
    ],
    total: 79.98,
    
    // Custom data matching your template configuration
    customData: {
      plan: 'premium',
      features: ['feature1', 'feature2']
    }
  }
});

if (result.error) {
  console.error('Template send failed:', result.error.error.message);
  
  // Handle specific errors
  if (result.error.error.code === 'invalid_parameter') {
    console.log('Check your template ID format');
  }
} else {
  console.log('Template sent successfully');
}

// Example with contact ID instead of email
const resultWithContactId = await maxclicks.templates.send('template-uuid', {
  data: {
    recipient: 'contact-uuid-here',
    customField: 'value'
  }
});
```

**Important Notes:**
- Template ID must be a valid UUID (you can find it in your Maxclicks dashboard)
- The `data` object must match the schema defined in your template
- Contact recipients can be specified by ID, email, or phone number
- Object and event data must match their respective schemas

### API Keys

Validate your API key and check authentication.

#### Check API Key

```typescript
const result = await maxclicks.apiKeys.check();

if (result.error) {
  console.error('Invalid API key:', result.error);
} else {
  console.log('API key is valid');
  console.log('Space:', result.data.spaceName);
  console.log('Space ID:', result.data.spaceId);
}
```

## 🎯 Advanced Features

### Auto-create Missing Attributes

When working with contacts or objects, you can enable automatic creation of missing custom attributes:

```typescript
// For contacts
const contact = await maxclicks.contacts
  .create()
  .email('user@example.com')
  .customAttribute('newField', 'value')
  .customAttribute('anotherField', 123)
  .autoCreate(true) // Auto-create missing attributes
  .execute();

// For objects
const product = await maxclicks.objects.builder()
  .schema('products')
  .objectId('prod-456')
  .attribute('newField', 'value')
  .autoCreateMissingAttributes(true)
  .execute();
```

### Error Handling

All API methods return a result object with either `data` or `error`:

```typescript
const result = await maxclicks.contacts.create({
  email: 'invalid-email'
});

if (result.error) {
  console.error('Error code:', result.error.error.code);
  console.error('Error message:', result.error.error.message);
  console.error('Request ID:', result.error.requestId);
  console.error('Timestamp:', result.error.timestamp);
  
  // Handle specific error codes
  switch (result.error.error.code) {
    case 'validation_error':
      console.log('Validation failed:', result.error.error.details);
      break;
    case 'not_found':
      console.log('Resource not found');
      break;
    case 'rate_limit_exceeded':
      console.log('Rate limit exceeded, please retry later');
      break;
    default:
      console.log('An error occurred');
  }
} else {
  console.log('Success:', result.data);
}
```

### Error Codes

Common error codes returned by the API:

- `validation_error` - Invalid request parameters
- `not_found` - Resource not found
- `invalid_api_key` - Authentication failed
- `rate_limit_exceeded` - Too many requests
- `missing_required_field` - Required field missing
- `invalid_parameter` - Invalid parameter value
- `application_error` - Internal server error

### Logging

Control SDK logging levels:

```typescript
// Set log level during initialization
const maxclicks = new Maxclicks({
  apiKey: 'max_your_api_key',
  logLevel: 'debug' // 'silent' | 'error' | 'warn' | 'info' | 'debug'
});

// Change log level at runtime
maxclicks.setLogLevel('warn');
```

### Pagination

All list endpoints support pagination with 1-based indexing:

```typescript
const result = await maxclicks.contacts.list({
  page: 1,      // Page number (1-based)
  per_page: 25  // Items per page
});

if (result.data) {
  console.log('Total:', result.data.pagination.total);
  console.log('Current page:', result.data.pagination.page);
  console.log('Per page:', result.data.pagination.perPage);
  console.log('Total pages:', result.data.pagination.totalPages);
}
```

## 🔧 Configuration

### TypeScript Configuration

The SDK is written in TypeScript and provides full type definitions. No additional `@types` packages are needed.

```typescript
import { Maxclicks, type MaxclicksConfig, type Contact } from '@maxclicks/node-sdk';

const config: MaxclicksConfig = {
  apiKey: process.env.MAXCLICKS_API_KEY!,
  logLevel: 'debug'
};

const maxclicks = new Maxclicks(config);
```

## 📖 Best Practices

### 1. Always Check Errors

```typescript
const result = await maxclicks.contacts.create({ email: 'user@example.com' });

if (result.error) {
  // Handle error
  console.error('Operation failed:', result.error);
  return;
}

// Use data safely
console.log('Success:', result.data);
```

### 2. Use Builders for Complex Operations

```typescript
// Instead of this
const result = await maxclicks.contacts.create({
  email: 'user@example.com',
  firstName: 'John',
  tags: ['customer', 'vip'],
  attributeValuesByKey: { plan: 'premium' }
});

// Use builder for better readability
const result = await maxclicks.contacts
  .create()
  .email('user@example.com')
  .firstName('John')
  .tag('customer')
  .tag('vip')
  .customAttribute('plan', 'premium')
  .execute();
```

### 3. Leverage Batch Operations

```typescript
// Efficient batch creation
const contacts = await maxclicks.contacts.batch().create([
  { email: 'user1@example.com', firstName: 'User1' },
  { email: 'user2@example.com', firstName: 'User2' },
  // ... many more
]);
```

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Maxclicks Dashboard](https://app.maxclicks.ai)
- [API Documentation](https://docs.maxclicks.ai)
- [Get API Key](https://app.maxclicks.ai/settings/developers)
- [GitHub Repository](https://github.com/maxclix/maxclicks-node)
- [npm Package](https://www.npmjs.com/package/@maxclicks/node-sdk)

## 💬 Support

- 📧 Email: dev@maxclicks.ai
- 💬 Discord: [Join our community](https://discord.gg/maxclicks)
- 📝 Documentation: [docs.maxclicks.ai](https://docs.maxclicks.ai)
- 🐛 Issues: [GitHub Issues](https://github.com/maxclix/maxclicks-node/issues)

---

Made with ❤️ by the Maxclicks team