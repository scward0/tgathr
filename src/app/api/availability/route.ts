import { NextResponse } from 'next/server';
import { saveAvailability, validateAvailabilityData } from '@/lib/services/availability-service';
import { isErrorResponse } from '@/lib/types/service-responses';

export async function POST(request: Request) {
  // During build time, just return a placeholder response
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Database not available during build' }, { status: 503 });
  }

  try {
    const body = await request.json();

    // Validate the request data
    const validationResult = validateAvailabilityData(body);
    if (isErrorResponse(validationResult)) {
      return NextResponse.json(
        { error: validationResult.error, details: validationResult.details },
        { status: validationResult.status }
      );
    }

    // Save the availability data
    const result = await saveAvailability(validationResult.data!);
    if (isErrorResponse(result)) {
      return NextResponse.json(
        { error: result.error, details: result.details },
        { status: result.status }
      );
    }

    return NextResponse.json(result.data);

  } catch (error) {
    console.error('Error in availability route:', error);
    return NextResponse.json(
      { error: 'Failed to save availability' },
      { status: 500 }
    );
  }
}