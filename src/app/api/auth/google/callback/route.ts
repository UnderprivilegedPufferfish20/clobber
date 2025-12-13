import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import prisma from '@/lib/db';
import createProject from '@/lib/actions/projects';
import { getTenantPool } from '@/lib/actions/database';
import { Project } from '@/lib/db/generated';

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
);

// Optional: quick connectivity smoke test after provisioning
async function smokeTestProjectDb(project: Project) {
  const con = process.env.CLOUD_SQL_CONNECTION_NAME

  if (!con) throw new Error("NO CON NAME IN ENV");

  const pool = await getTenantPool({
    connectionName: con,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name,
  });

  await pool.query('SELECT 1');
}

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

    // Upsert user
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
      include: { projects: true },
    });

    let projectId: string;

    if (dbUser.projects?.length) {
      // redirect to most recent project
      const sorted = [...dbUser.projects].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
      projectId = sorted[0].id;
    } else {
      // create a default project + provision tenant DB/user in the shared Cloud SQL instance
      const projectName = `${dbUser.name.split(' ')[0]}'s Project`;

      const newProject = await createProject({ name: projectName }, dbUser.id);

      // OPTIONAL: verify the DB is reachable right now (remove if you want faster login)
      await smokeTestProjectDb(newProject);

      projectId = newProject.id;
    }

    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/proj/${projectId}`;
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
    const errorMessage = error instanceof Error ? error.message : 'oauth_error';
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/?error=${encodeURIComponent(errorMessage)}`
    );
  }
}
