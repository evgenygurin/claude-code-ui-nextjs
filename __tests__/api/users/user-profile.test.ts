/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '../../../app/api/users/[user_id]/route';

// Mock Sentry to avoid actual error reporting during tests
jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
}));

describe('/api/users/[user_id] - GET', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful requests', () => {
    it('should return user profile for valid user ID', async () => {
      const validUserId = '550e8400-e29b-41d4-a716-446655440000';
      const request = new NextRequest(`http://localhost:3000/api/users/${validUserId}`);
      
      const response = await GET(request, { params: { user_id: validUserId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        id: validUserId,
        email: 'john.doe@example.com',
        name: 'John Doe',
        isActive: true,
        profile: expect.objectContaining({
          bio: expect.any(String),
          location: expect.any(String),
          website: expect.any(String),
          company: expect.any(String)
        })
      });
      expect(response.headers.get('content-type')).toContain('application/json');
      expect(response.headers.get('cache-control')).toBe('private, max-age=300');
    });

    it('should return second user profile for different valid user ID', async () => {
      const validUserId = '550e8400-e29b-41d4-a716-446655440001';
      const request = new NextRequest(`http://localhost:3000/api/users/${validUserId}`);
      
      const response = await GET(request, { params: { user_id: validUserId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        id: validUserId,
        email: 'jane.smith@example.com',
        name: 'Jane Smith',
        isActive: true
      });
    });
  });

  describe('Validation errors', () => {
    it('should return 400 for invalid UUID format', async () => {
      const invalidUserId = 'invalid-uuid';
      const request = new NextRequest(`http://localhost:3000/api/users/${invalidUserId}`);
      
      const response = await GET(request, { params: { user_id: invalidUserId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.message).toBe('Invalid user ID format');
      expect(data.code).toBe('INVALID_USER_ID');
      expect(response.headers.get('content-type')).toContain('application/json');
      expect(response.headers.get('cache-control')).toBe('no-cache');
    });

    it('should return 400 for empty user ID', async () => {
      const emptyUserId = '';
      const request = new NextRequest(`http://localhost:3000/api/users/${emptyUserId}`);
      
      const response = await GET(request, { params: { user_id: emptyUserId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.code).toBe('INVALID_USER_ID');
    });

    it('should return 400 for malformed UUID', async () => {
      const malformedUserId = '550e8400-e29b-41d4-a716';
      const request = new NextRequest(`http://localhost:3000/api/users/${malformedUserId}`);
      
      const response = await GET(request, { params: { user_id: malformedUserId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.message).toBe('Invalid user ID format');
      expect(data.code).toBe('INVALID_USER_ID');
    });
  });

  describe('Not found errors', () => {
    it('should return 404 for non-existent user ID', async () => {
      const nonExistentUserId = '550e8400-e29b-41d4-a716-446655440999';
      const request = new NextRequest(`http://localhost:3000/api/users/${nonExistentUserId}`);
      
      const response = await GET(request, { params: { user_id: nonExistentUserId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
      expect(data.message).toBe(`No user found with ID: ${nonExistentUserId}`);
      expect(data.code).toBe('USER_NOT_FOUND');
      expect(response.headers.get('content-type')).toContain('application/json');
      expect(response.headers.get('cache-control')).toBe('no-cache');
    });
  });

  describe('Response structure', () => {
    it('should include all required fields in successful response', async () => {
      const validUserId = '550e8400-e29b-41d4-a716-446655440000';
      const request = new NextRequest(`http://localhost:3000/api/users/${validUserId}`);
      
      const response = await GET(request, { params: { user_id: validUserId } });
      const data = await response.json();

      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('id');
      expect(data.data).toHaveProperty('email');
      expect(data.data).toHaveProperty('name');
      expect(data.data).toHaveProperty('avatar');
      expect(data.data).toHaveProperty('createdAt');
      expect(data.data).toHaveProperty('updatedAt');
      expect(data.data).toHaveProperty('isActive');
      expect(data.data).toHaveProperty('profile');
    });

    it('should include all required fields in error response', async () => {
      const invalidUserId = 'invalid';
      const request = new NextRequest(`http://localhost:3000/api/users/${invalidUserId}`);
      
      const response = await GET(request, { params: { user_id: invalidUserId } });
      const data = await response.json();

      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('code');
      expect(data).not.toHaveProperty('success');
      expect(data).not.toHaveProperty('data');
    });
  });

  describe('Headers', () => {
    it('should set correct headers for successful response', async () => {
      const validUserId = '550e8400-e29b-41d4-a716-446655440000';
      const request = new NextRequest(`http://localhost:3000/api/users/${validUserId}`);
      
      const response = await GET(request, { params: { user_id: validUserId } });

      expect(response.headers.get('content-type')).toContain('application/json');
      expect(response.headers.get('cache-control')).toBe('private, max-age=300');
    });

    it('should set correct headers for error response', async () => {
      const invalidUserId = 'invalid';
      const request = new NextRequest(`http://localhost:3000/api/users/${invalidUserId}`);
      
      const response = await GET(request, { params: { user_id: invalidUserId } });

      expect(response.headers.get('content-type')).toContain('application/json');
      expect(response.headers.get('cache-control')).toBe('no-cache');
    });
  });

  describe('Data types and validation', () => {
    it('should return correct data types for user profile', async () => {
      const validUserId = '550e8400-e29b-41d4-a716-446655440000';
      const request = new NextRequest(`http://localhost:3000/api/users/${validUserId}`);
      
      const response = await GET(request, { params: { user_id: validUserId } });
      const data = await response.json();
      const user = data.data;

      expect(typeof user.id).toBe('string');
      expect(typeof user.email).toBe('string');
      expect(typeof user.name).toBe('string');
      expect(typeof user.createdAt).toBe('string');
      expect(typeof user.updatedAt).toBe('string');
      expect(typeof user.isActive).toBe('boolean');
      expect(typeof user.profile).toBe('object');
      expect(typeof user.profile.bio).toBe('string');
      expect(typeof user.profile.location).toBe('string');
      expect(typeof user.profile.website).toBe('string');
      expect(typeof user.profile.company).toBe('string');
    });

    it('should validate email format in response', async () => {
      const validUserId = '550e8400-e29b-41d4-a716-446655440000';
      const request = new NextRequest(`http://localhost:3000/api/users/${validUserId}`);
      
      const response = await GET(request, { params: { user_id: validUserId } });
      const data = await response.json();

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test(data.data.email)).toBe(true);
    });

    it('should validate timestamp format in response', async () => {
      const validUserId = '550e8400-e29b-41d4-a716-446655440000';
      const request = new NextRequest(`http://localhost:3000/api/users/${validUserId}`);
      
      const response = await GET(request, { params: { user_id: validUserId } });
      const data = await response.json();

      // Check if timestamps are valid ISO strings
      expect(new Date(data.data.createdAt).toISOString()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(new Date(data.data.updatedAt).toISOString()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      
      // Check if they can be parsed as valid dates
      expect(new Date(data.data.createdAt).getTime()).not.toBeNaN();
      expect(new Date(data.data.updatedAt).getTime()).not.toBeNaN();
    });
  });

  describe('Edge cases', () => {
    it('should handle user with null avatar', async () => {
      const validUserId = '550e8400-e29b-41d4-a716-446655440000';
      const request = new NextRequest(`http://localhost:3000/api/users/${validUserId}`);
      
      const response = await GET(request, { params: { user_id: validUserId } });
      const data = await response.json();

      expect(data.data.avatar).toBe(null);
    });

    it('should handle user with avatar URL', async () => {
      const validUserId = '550e8400-e29b-41d4-a716-446655440001';
      const request = new NextRequest(`http://localhost:3000/api/users/${validUserId}`);
      
      const response = await GET(request, { params: { user_id: validUserId } });
      const data = await response.json();

      expect(data.data.avatar).toBeTruthy();
      expect(typeof data.data.avatar).toBe('string');
      expect(data.data.avatar).toMatch(/^https?:\/\//);
    });
  });
});

// Integration tests for OPTIONS method
describe('/api/users/[user_id] - OPTIONS', () => {
  // Note: In a real implementation, you'd import the OPTIONS function separately
  // For now, this is a placeholder for potential CORS testing
  it('should be implemented for CORS support', () => {
    // This test ensures we consider CORS implementation
    expect(true).toBe(true);
  });
});