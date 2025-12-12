import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import prisma from '@/lib/db';
import createProject from '@/lib/actions/projects';
import { startPostgres, verifyConnection } from '@/lib/actions/database';
import { getDataDirectory } from '@/lib/utils';

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

    // Check if user exists in database
    const existingUser = await prisma.user.findUnique({ 
      where: { id: user.id }, 
      include: { projects: true } 
    });

    let redirectUrl: string;
    let projectId: string;

    // Authenticate with backend first (needed for creating projects)
    
    if (existingUser) {

      if (existingUser.projects && existingUser.projects.length > 0) {
        // User has projects - redirect to most recent
        const sortedProjects = existingUser.projects.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );
        projectId = sortedProjects[0].id;

      } else {
        // User has no projects - create one

        const projectName = `${existingUser.name.split(' ')[0]}'s Project`;

        const new_project = await createProject({ name: projectName }, user.id)

        const port = Number(new_project.con_string.split(":")[3].split("/")[0])

        console.log('About to start postgres on port:', port);
    
        try {
          await startPostgres(
            getDataDirectory(projectName),
            port
          );
          console.log('Postgres started successfully');
        } catch (error) {
          console.error('Failed to start postgres:', error);
          throw new Error(`Failed to start postgres: ${error}`);
        }

        try {
          console.log('Verifying connection...');
          await verifyConnection(port, new_project.superuser_pwd);
          console.log('Connection verified successfully');
        } catch (error) {
          console.error('Failed to verify connection:', error);
          throw new Error(`Failed to verify connection: ${error}`);
        }


        projectId = new_project.id
      }
    } else {

      // Create new user
      const newUser = await prisma.user.create({ 
        data: {
          email: user.email,
          name: user.name,
          pfpUrl: user.picture,
          id: user.id
        } 
      });

      const projectName = `${newUser.name.split(' ')[0]}'s Project`;

      const new_project = await createProject({ name: projectName }, user.id)

      const port = Number(new_project.con_string.split(":")[3].split("/")[0])

      console.log('About to start postgres on port:', port);
    
      try {
        await startPostgres(
          getDataDirectory(projectName),
          port
        );
        console.log('Postgres started successfully');
      } catch (error) {
        console.error('Failed to start postgres:', error);
        throw new Error(`Failed to start postgres: ${error}`);
      }

      try {
        console.log('Verifying connection...');
        await verifyConnection(port, new_project.superuser_pwd);
        console.log('Connection verified successfully');
      } catch (error) {
        console.error('Failed to verify connection:', error);
        throw new Error(`Failed to verify connection: ${error}`);
      }



      projectId = new_project.id;
    }

    redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/proj/${projectId}`;

    // Set up response with cookie
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
    // Add the specific error message to the redirect for debugging
    const errorMessage = error instanceof Error ? error.message : 'oauth_error';
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/?error=${encodeURIComponent(errorMessage)}`
    );
  }
}