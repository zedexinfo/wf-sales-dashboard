import { NextResponse } from 'next/server';
import { getBranches } from '@/src/services/branches.service';

export async function GET() {
  try {
    const branches = await getBranches();
    return NextResponse.json({ branches });
  } catch (error) {
    console.error('Error fetching branches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch branches' },
      { status: 500 }
    );
  }
}
