import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';

// Validation schema for user_id parameter
const UserIdSchema = z.object({
  user_id: z.string().uuid('Invalid user ID format')
});

// Mock user data - in a real application, this would come from a database
const mockUsers = {
  '550e8400-e29b-41d4-a716-446655440000': {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'john.doe@example.com',
    name: 'John Doe',
    avatar: null,
    createdAt: '2023-01-15T10:30:00.000Z',
    updatedAt: '2024-01-10T14:22:00.000Z',
    isActive: true,
    profile: {
      bio: 'Software developer passionate about creating amazing user experiences.',
      location: 'San Francisco, CA',
      website: 'https://johndoe.dev',
      company: 'Tech Corp'
    }
  },
  '550e8400-e29b-41d4-a716-446655440001': {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'jane.smith@example.com',
    name: 'Jane Smith',
    avatar: 'https://example.com/avatars/jane.jpg',
    createdAt: '2023-03-20T08:15:00.000Z',
    updatedAt: '2024-01-08T16:45:00.000Z',
    isActive: true,
    profile: {
      bio: 'Product manager focused on user-centric design and growth.',
      location: 'New York, NY',
      website: 'https://janesmith.io',
      company: 'Innovation Inc'
    }
  }
};

interface UserProfileParams {
  params: { user_id: string };
}

export async function GET(
  request: NextRequest,
  { params }: UserProfileParams
) {
  try {
    // Validate user_id parameter
    const validationResult = UserIdSchema.safeParse({
      user_id: params.user_id
    });

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors[0]?.message || 'Invalid user ID';
      
      return NextResponse.json({
        error: 'Validation failed',
        message: errorMessage,
        code: 'INVALID_USER_ID'
      }, { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
    }

    const { user_id } = validationResult.data;
    
    // In a real application, you would fetch user data from your database
    // Example with Prisma:
    // const user = await prisma.user.findUnique({
    //   where: { id: user_id },
    //   include: { profile: true }
    // });

    // For demonstration, we're using mock data
    const user = mockUsers[user_id as keyof typeof mockUsers];

    if (!user) {
      return NextResponse.json({
        error: 'User not found',
        message: `No user found with ID: ${user_id}`,
        code: 'USER_NOT_FOUND'
      }, { 
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
    }

    if (!user.isActive) {
      return NextResponse.json({
        error: 'User inactive',
        message: 'This user account is currently inactive',
        code: 'USER_INACTIVE'
      }, { 
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
    }

    // Return successful response
    return NextResponse.json({
      success: true,
      data: user
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=300' // 5 minutes cache
      }
    });

  } catch (error) {
    // Log error to Sentry
    Sentry.captureException(error, {
      tags: {
        section: 'api',
        endpoint: 'user-profile'
      },
      extra: {
        user_id: params.user_id,
        timestamp: new Date().toISOString()
      }
    });

    console.error('API Error in GET /api/users/[user_id]:', error);

    return NextResponse.json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while fetching user profile',
      code: 'INTERNAL_ERROR'
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  }
}

// Optional: Add other HTTP methods if needed in the future
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}