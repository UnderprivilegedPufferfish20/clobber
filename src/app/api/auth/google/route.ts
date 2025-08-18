import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`
);

export async function GET(request: NextRequest) {
  const authorizeUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email'],
    include_granted_scopes: true,
  });

  return NextResponse.redirect(authorizeUrl);
}