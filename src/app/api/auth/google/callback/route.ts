import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import prisma from '@/lib/db';
import B_URL from '@/lib/constants';
import { UserCookie } from '@/lib/types/auth';
import { generateProjectPassword } from '@/lib/utils';

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
    let authData: any;

    // Authenticate with backend first (needed for creating projects)
    
    if (existingUser) {

        const backend_auth_res = await fetch(`${B_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email
          })
        });
    
        if (!backend_auth_res.ok) {
          throw new Error(`Auth Error: backend login failed: ${backend_auth_res.statusText}`);
        }
    
        authData = await backend_auth_res.json();
      // User exists - check if they have projects

      if (existingUser.projects && existingUser.projects.length > 0) {
        // User has projects - redirect to most recent
        const sortedProjects = existingUser.projects.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );
        projectId = sortedProjects[0].id;

      } else {
        // User has no projects - create one

        const projectPassword = generateProjectPassword();
        const projectName = `${existingUser.name.split(' ')[0]}'s Project`;

        const createProjectRes = await fetch(`${B_URL}/project/new`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authData.access_token}`
          },
          body: JSON.stringify({
            project_name: projectName,
            password: projectPassword
          })
        });

        if (!createProjectRes.ok) {
          const errorText = await createProjectRes.text();
          throw new Error(`Failed to create project: ${errorText}`);
        }

        const create_project_res_data = await createProjectRes.json()


        const new_project = await prisma.project.create({
          data: {
            con_string: create_project_res_data.connection_string,
            name: projectName,
            superuser_pwd: projectPassword,
            ownerId: user.id
          }
        })

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

      const backend_auth_res = await fetch(`${B_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email
          })
        });
    
        if (!backend_auth_res.ok) {
          throw new Error(`Auth Error: backend login failed: ${backend_auth_res.statusText}`);
        }
    
        authData = await backend_auth_res.json();

      // Create first project via backend API
      const projectPassword = generateProjectPassword();
      const projectName = `${newUser.name.split(' ')[0]}'s Project`;

      const createProjectRes = await fetch(`${B_URL}/project/new`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authData.access_token}`
        },
        body: JSON.stringify({
          project_name: projectName,
          password: projectPassword
        })
      });

      if (!createProjectRes.ok) {
        const errorText = await createProjectRes.text();
        throw new Error(`Failed to create project: ${errorText}`);
      }

      const projectData = await createProjectRes.json();

      const new_project = await prisma.project.create({
          data: {
            con_string: projectData.connection_string,
            name: projectName,
            superuser_pwd: projectPassword,
            ownerId: user.id
          }
        })

        projectId = new_project.id



      projectId = projectData.project_id;
    }

    redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/proj/${projectId}`;

    // Set up response with cookie
    const response = NextResponse.redirect(redirectUrl);

    const cookie_val: UserCookie = {
      id: user.id,
      tokens: {
        access: authData.access_token,
        refresh: authData.refresh_token
      }
    };

    response.cookies.set('user', JSON.stringify(cookie_val), {
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