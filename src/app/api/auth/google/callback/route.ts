import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import prisma from '@/lib/db';

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
);


export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=no_code`);
  }

  try {
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || !payload.name || !payload.picture) {
      throw new Error('No payload or payload missing values');
    }

    const user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };

    const dbUser = await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email,
        name: user.name,
        pfpUrl: user.picture,
      },
      create: {
        id: user.id,
        email: user.email,
        name: user.name,
        pfpUrl: user.picture,
      },
      include: { ownedInstitutions: true, collaborator: true },
    });

    if (dbUser.ownedInstitutions.length === 0 && dbUser.collaborator.length === 0) {
      const iName = `${dbUser.name.split(' ')[0]}'s Institution`;

      await prisma.institution.create({
        data: {
          name: iName,
          ownerId: dbUser.id,
          plan: "Basic",
          slug: dbUser.id
        }
      })
    }

    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/institutions`);

    response.cookies.set('user', JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('OAuth callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'oauth_error';
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/?error=${encodeURIComponent(errorMessage)}`
    );
  }
}
