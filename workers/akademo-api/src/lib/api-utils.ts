export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export function successResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}

export function errorResponse(error: string, status = 400): Response {
  return Response.json(
    {
      success: false,
      error,
    } as ApiResponse,
    { status }
  );
}

export async function handleApiError(error: unknown): Promise<Response> {
  console.error('API Error:', error);
  
  // Log the full error with stack trace
  if (error instanceof Error) {
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
  }

  if (error instanceof Error) {
    if (error.message === 'Unauthorized') {
      return errorResponse('Unauthorized', 401);
    }
    if (error.message === 'Forbidden') {
      return errorResponse('Forbidden', 403);
    }
    // Return the actual error message so we can see what's failing
    return errorResponse(`Database error: ${error.message}`, 400);
  }

  return errorResponse('Internal server error', 500);
}
