import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
  // Sign-up is disabled
  return NextResponse.json(
    { error: 'Sign-up is currently disabled. Please contact your administrator.' },
    { status: 403 }
  );
}
