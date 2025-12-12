import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUser } from '@/lib/actions/auth';

export async function GET(request: NextRequest) {
  const user = await getUser()

  try {
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
}