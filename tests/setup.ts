import { beforeAll, afterEach } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { vi } from 'vitest';

const fetchMocker = createFetchMock(vi);

// Sets globalThis.fetch and globalThis.fetchMock to our mocked version
fetchMocker.enableMocks();

beforeAll(() => {
  // Additional setup if needed
});

afterEach(() => {
  fetchMocker.resetMocks();
});
