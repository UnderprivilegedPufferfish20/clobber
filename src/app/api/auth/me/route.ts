import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUser, getUserById, getUserCookie } from '@/lib/actions/auth/getUser';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const userCookie = await getUser()

  if (!userCookie) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    return NextResponse.json(userCookie);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
}