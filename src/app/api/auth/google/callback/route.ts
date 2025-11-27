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

    // Get user info
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email || !payload.name || !payload.picture) {
      throw new Error('No payload or payload missing values');
    }

    const user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };

    const existingUser = await prisma.user.findUnique({ where: {id: user.id}, include: { projects: true } })

    let redirectUrl: string;

    if (existingUser) {
      const firstProject = existingUser.projects.sort((a, b) => b.createdAt.getDate() - a.createdAt.getDate())
      redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/proj/${firstProject[0].id}`;
    } else {
      const newUser = await prisma.user.create({ data: {
        email: user.email,
        name: user.name,
        pfpUrl: user.picture,
        id: user.id
      } })

      const newUserFirstProject = await prisma.project.create({
        data: {
          name: newUser.name.split(' ')[0] + '’s Project',
          ownerId: newUser.id
        }
      })

      redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/proj/${newUserFirstProject.id}`;
    }

    const response = NextResponse.redirect(redirectUrl);

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
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=oauth_error`);
  }
}