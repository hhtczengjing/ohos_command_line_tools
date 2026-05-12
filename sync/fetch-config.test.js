/**
 * fetch-config.test.js
 * Unit tests for makeRequest function in fetch-config.js
 */

import { jest } from '@jest/globals';

// Mock https module using Jest's mocking system
const mockWrite = jest.fn();
const mockEnd = jest.fn();
const mockOn = jest.fn();

const mockRequest = jest.fn();

jest.unstable_mockModule('https', () => ({
  default: {
    request: mockRequest
  }
}));

describe('makeRequest', () => {
  let makeRequest;

  beforeAll(async () => {
    const module = await import('./fetch-config.js');
    makeRequest = module.makeRequest;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test 1: Should resolve with parsed JSON when response is valid JSON
   * Branch: Success path - valid JSON response
   */
  test('should resolve with parsed JSON when response is valid JSON', async () => {
    const responseData = { success: true, data: 'test' };
    const options = { hostname: 'example.com', port: 443, path: '/api' };
    const data = { key: 'value' };

    // Setup mock to simulate successful HTTP response
    mockRequest.mockImplementation((opts, callback) => {
      let dataHandler;
      let endHandler;

      const mockRes = {
        on: jest.fn((event, handler) => {
          if (event === 'data') {
            dataHandler = handler;
          } else if (event === 'end') {
            endHandler = handler;
          }
        })
      };

      callback(mockRes);

      // Simulate receiving data and then end
      setTimeout(() => {
        dataHandler(JSON.stringify(responseData));
        endHandler();
      }, 0);

      return {
        write: mockWrite,
        end: mockEnd,
        on: mockOn
      };
    });

    const result = await makeRequest(options, data);

    expect(result).toEqual(responseData);
    expect(mockWrite).toHaveBeenCalledWith(JSON.stringify(data));
    expect(mockEnd).toHaveBeenCalled();
  });

  /**
   * Test 2: Should reject when response is invalid JSON
   * Branch: Error path - JSON parse failure
   */
  test('should reject when response is invalid JSON', async () => {
    const options = { hostname: 'example.com', port: 443, path: '/api' };
    const data = { key: 'value' };
    const invalidJson = 'not valid json{';

    mockRequest.mockImplementation((opts, callback) => {
      let dataHandler;
      let endHandler;

      const mockRes = {
        on: jest.fn((event, handler) => {
          if (event === 'data') {
            dataHandler = handler;
          } else if (event === 'end') {
            endHandler = handler;
          }
        })
      };

      callback(mockRes);

      setTimeout(() => {
        dataHandler(invalidJson);
        endHandler();
      }, 0);

      return {
        write: mockWrite,
        end: mockEnd,
        on: mockOn
      };
    });

    await expect(makeRequest(options, data)).rejects.toThrow('Failed to parse response');
  });

  /**
   * Test 3: Should reject when network error occurs
   * Branch: Error path - network error
   */
  test('should reject when network error occurs', async () => {
    const options = { hostname: 'example.com', port: 443, path: '/api' };
    const data = { key: 'value' };
    const networkError = new Error('ECONNREFUSED');

    mockRequest.mockImplementation((opts, callback) => {
      const request = {
        write: mockWrite,
        end: mockEnd,
        on: jest.fn((event, handler) => {
          if (event === 'error') {
            setTimeout(() => handler(networkError), 0);
          }
        })
      };
      return request;
    });

    await expect(makeRequest(options, data)).rejects.toThrow('ECONNREFUSED');
  });

  /**
   * Test 4: Should handle empty response body (empty string is valid JSON but will fail parse)
   * Branch: Edge case - empty response
   */
  test('should handle empty response body', async () => {
    const options = { hostname: 'example.com', port: 443, path: '/api' };
    const data = { key: 'value' };

    mockRequest.mockImplementation((opts, callback) => {
      let dataHandler;
      let endHandler;

      const mockRes = {
        on: jest.fn((event, handler) => {
          if (event === 'data') {
            dataHandler = handler;
          } else if (event === 'end') {
            endHandler = handler;
          }
        })
      };

      callback(mockRes);

      setTimeout(() => {
        dataHandler('');
        endHandler();
      }, 0);

      return {
        write: mockWrite,
        end: mockEnd,
        on: mockOn
      };
    });

    // Empty string is valid JSON (parses to empty string), but the test expects rejection
    await expect(makeRequest(options, data)).rejects.toThrow();
  });

  /**
   * Test 5: Should handle response with special JSON characters
   * Branch: Success path - special characters in JSON
   */
  test('should handle response with special JSON characters', async () => {
    const options = { hostname: 'example.com', port: 443, path: '/api' };
    const data = { key: 'value' };
    const responseData = { message: 'Hello "World"', escaped: 'line\nbreak', unicode: '中文' };

    mockRequest.mockImplementation((opts, callback) => {
      let dataHandler;
      let endHandler;

      const mockRes = {
        on: jest.fn((event, handler) => {
          if (event === 'data') {
            dataHandler = handler;
          } else if (event === 'end') {
            endHandler = handler;
          }
        })
      };

      callback(mockRes);

      setTimeout(() => {
        dataHandler(JSON.stringify(responseData));
        endHandler();
      }, 0);

      return {
        write: mockWrite,
        end: mockEnd,
        on: mockOn
      };
    });

    const result = await makeRequest(options, data);

    expect(result).toEqual(responseData);
  });

  /**
   * Test 6: Should handle array response
   * Branch: Success path - array JSON response
   */
  test('should handle array response', async () => {
    const options = { hostname: 'example.com', port: 443, path: '/api' };
    const data = { key: 'value' };
    const responseData = [{ id: 1 }, { id: 2 }, { id: 3 }];

    mockRequest.mockImplementation((opts, callback) => {
      let dataHandler;
      let endHandler;

      const mockRes = {
        on: jest.fn((event, handler) => {
          if (event === 'data') {
            dataHandler = handler;
          } else if (event === 'end') {
            endHandler = handler;
          }
        })
      };

      callback(mockRes);

      setTimeout(() => {
        dataHandler(JSON.stringify(responseData));
        endHandler();
      }, 0);

      return {
        write: mockWrite,
        end: mockEnd,
        on: mockOn
      };
    });

    const result = await makeRequest(options, data);

    expect(result).toEqual(responseData);
  });

  /**
   * Test 7: Should handle nested JSON object response
   * Branch: Success path - deeply nested JSON
   */
  test('should handle nested JSON object response', async () => {
    const options = { hostname: 'example.com', port: 443, path: '/api' };
    const data = { key: 'value' };
    const responseData = {
      status: 'ok',
      data: {
        user: {
          name: 'test',
          profile: {
            age: 25,
            address: {
              city: 'Beijing',
              country: 'China'
            }
          }
        }
      }
    };

    mockRequest.mockImplementation((opts, callback) => {
      let dataHandler;
      let endHandler;

      const mockRes = {
        on: jest.fn((event, handler) => {
          if (event === 'data') {
            dataHandler = handler;
          } else if (event === 'end') {
            endHandler = handler;
          }
        })
      };

      callback(mockRes);

      setTimeout(() => {
        dataHandler(JSON.stringify(responseData));
        endHandler();
      }, 0);

      return {
        write: mockWrite,
        end: mockEnd,
        on: mockOn
      };
    });

    const result = await makeRequest(options, data);

    expect(result).toEqual(responseData);
  });

  /**
   * Test 8: Should use options passed to https.request
   * Branch: All branches - verify options are passed correctly
   */
  test('should pass options to https.request', async () => {
    const options = {
      hostname: 'example.com',
      port: 443,
      path: '/api',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    };
    const data = { key: 'value' };
    const responseData = { result: 'ok' };

    let capturedOptions;
    mockRequest.mockImplementation((opts, callback) => {
      capturedOptions = opts;
      let dataHandler;
      let endHandler;

      const mockRes = {
        on: jest.fn((event, handler) => {
          if (event === 'data') {
            dataHandler = handler;
          } else if (event === 'end') {
            endHandler = handler;
          }
        })
      };

      callback(mockRes);

      setTimeout(() => {
        dataHandler(JSON.stringify(responseData));
        endHandler();
      }, 0);

      return {
        write: mockWrite,
        end: mockEnd,
        on: mockOn
      };
    });

    await makeRequest(options, data);

    expect(capturedOptions).toEqual(options);
  });

  /**
   * Test 9: Should reject when JSON.parse throws (malformed JSON)
   * Branch: Error path - JSON parse exception
   */
  test('should reject when JSON parse throws', async () => {
    const options = { hostname: 'example.com', port: 443, path: '/api' };
    const data = { key: 'value' };

    // Using Object.defineProperty to make JSON.parse throw
    mockRequest.mockImplementation((opts, callback) => {
      let dataHandler;
      let endHandler;

      const mockRes = {
        on: jest.fn((event, handler) => {
          if (event === 'data') {
            dataHandler = handler;
          } else if (event === 'end') {
            endHandler = handler;
          }
        })
      };

      callback(mockRes);

      // Use a malformed JSON that will cause JSON.parse to throw with specific error
      setTimeout(() => {
        dataHandler('{"a":');
        endHandler();
      }, 0);

      return {
        write: mockWrite,
        end: mockEnd,
        on: mockOn
      };
    });

    await expect(makeRequest(options, data)).rejects.toThrow();
  });

  /**
   * Test 10: Should handle data as empty object
   * Branch: Edge case - empty data object
   */
  test('should handle data as empty object', async () => {
    const options = { hostname: 'example.com', port: 443, path: '/api' };
    const data = {};
    const responseData = { success: true };

    mockRequest.mockImplementation((opts, callback) => {
      let dataHandler;
      let endHandler;

      const mockRes = {
        on: jest.fn((event, handler) => {
          if (event === 'data') {
            dataHandler = handler;
          } else if (event === 'end') {
            endHandler = handler;
          }
        })
      };

      callback(mockRes);

      setTimeout(() => {
        dataHandler(JSON.stringify(responseData));
        endHandler();
      }, 0);

      return {
        write: mockWrite,
        end: mockEnd,
        on: mockOn
      };
    });

    const result = await makeRequest(options, data);

    expect(result).toEqual(responseData);
    expect(mockWrite).toHaveBeenCalledWith('{}');
  });
});