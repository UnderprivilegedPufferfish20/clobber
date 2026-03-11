'use server';

import {  createProjectSchema, createSchemaScheam, inviteUsersSchema } from "@/lib/types/schemas";
import { applyTenantGrants, createTenantDatabase } from ".";
import { getTenantPool } from "./tennantPool";
import { getUser } from "../auth";
import z from "zod";
import { t, generateProjectPassword } from "@/lib/utils";
import prisma from "@/lib/db";
import { revalidatePath, revalidateTag } from "next/cache";
import { getProjectById } from "./cache-actions";
import { redirect } from "next/navigation";

export async function addSchema(projectId: string, form: z.infer<typeof createSchemaScheam>) {
  const user = await getUser()

  if (!user) throw new Error("No user");

  const project = await getProjectById(projectId);

  if (!project) throw new Error("No project found");

  const { success, data } = createSchemaScheam.safeParse(form)

  if (!success) throw new Error("Invalid form data");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name
  })

  const result = await pool.query(`
    CREATE SCHEMA ${data.name} AUTHORIZATION ${project.db_user};
  `);


  revalidateTag(t("schemas", projectId), "max")
}

export async function addCollaborator(form: z.infer<typeof inviteUsersSchema>, iid: string, project_id: string) {
    const user = await getUser()
    
    if (!user) {
        throw new Error("No user authenticated");
    }

    const { success, data } = inviteUsersSchema.safeParse(form)

    if (!success) {
        throw new Error("Invalid form data"); 
    }

    const invitedUser = await prisma.user.findUnique({
        where: {
            email: data.email
        },
        select: { id: true } 
    })

    if (!invitedUser) {
        throw new Error("User not found"); 
    }

    if (invitedUser.id === user.id) throw new Error("You're the owner");


    const inst = await prisma.institution.findUnique({
        where: {
            id: iid
        },
        include: {
            members: {
                select: { id: true }
            }
        }
    })

    if (!inst) {
        throw new Error("Project not found");
    }

    const isAlreadyCollaborator = inst.members.some(c => c.id === invitedUser.id);
    if (isAlreadyCollaborator) {
        throw new Error("User is already a collaborator");
    }

    // --- The finished part ---
    await prisma.institution.update({
        where: {
            id: iid
        },
        data: {
            members: {
                connect: {
                    id: invitedUser.id,
                }
            }
        }
    });


    revalidatePath(`/dashboard/projects/${project_id}`); 
}

export default async function createProject(
  form: z.infer<typeof createProjectSchema>,
  ownerId: string,
  iid: string
) {
  console.log('\n🎯 === CREATE PROJECT STARTED ===');
  console.log('Owner ID:', ownerId);
  console.log('Project name:', form.name);

  const user = await getUser();
  if (!user) {
    console.error('❌ No active user found');
    throw new Error('No active user');
  }
  console.log('✅ User authenticated:', user.id);

  const parsed = createProjectSchema.safeParse(form);
  if (!parsed.success) {
    console.error('❌ Invalid form data:', parsed.error);
    throw new Error('Invalid form data');
  }

  const password = generateProjectPassword();
  console.log('✅ Generated project password (length:', password.length, ')');

  // Validate environment variables before proceeding
  const connectionName = process.env.CLOUD_SQL_CONNECTION_NAME;
  const adminUser = process.env.CLOUD_SQL_ADMIN_USER;
  const adminPassword = process.env.CLOUD_SQL_ADMIN_PASSWORD;

  console.log('🔍 Checking environment variables:', {
    hasConnectionName: !!connectionName,
    hasAdminUser: !!adminUser,
    hasAdminPassword: !!adminPassword,
    connectionName: connectionName || 'MISSING',
    adminUser: adminUser || 'MISSING',
  });

  if (!connectionName || !adminUser || !adminPassword) {
    const missing = [
      !connectionName && 'CLOUD_SQL_CONNECTION_NAME',
      !adminUser && 'CLOUD_SQL_ADMIN_USER',
      !adminPassword && 'CLOUD_SQL_ADMIN_PASSWORD',
    ].filter(Boolean);
    
    console.error('❌ Missing environment variables:', missing);
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // create project first to get a stable uuid for db/user names
  console.log('\n📝 Creating Prisma project record...');
  const project = await prisma.project.create({
    data: {
      institutionId: iid,
      name: parsed.data.name,
      db_name: 'PENDING',
      db_user: 'PENDING',
      db_pwd: password,
    },
  });
  console.log('✅ Prisma project created:', {
    id: project.id,
    name: project.name,
  });

  try {
    console.log('\n🏗️  Creating tenant database...');
    const { dbName, dbUser } = await createTenantDatabase({
      projectUuid: project.id,
      projectName: project.name,
      password,
    });

    console.log('✅ Tenant database created:', { dbName, dbUser });

    console.log('\n🔐 Applying tenant grants...');
    await applyTenantGrants({
      connectionName,
      adminUser,
      adminPassword,
      dbName,
      dbUser,
    });

    console.log('✅ Grants applied successfully');

    console.log('\n💾 Updating Prisma project with database credentials...');
    const updatedProject = await prisma.project.update({
      where: { id: project.id },
      data: {
        db_name: dbName,
        db_user: dbUser,
        db_pwd: password,
      },
    });

    console.log('✅ Project updated with credentials');
    console.log('✅ === CREATE PROJECT COMPLETED ===\n');
    
    return updatedProject;
  } catch (error) {
    console.error('\n❌ === CREATE PROJECT FAILED ===');
    console.error('Error details:', error);
    
    console.log('🧹 Cleaning up pending project...');
    try {
      await prisma.project.delete({
        where: { id: project.id },
      });
      console.log('✅ Pending project cleaned up');
    } catch (cleanupError) {
      console.error('❌ Failed to clean up project:', cleanupError);
    }
    
    console.log('❌ === CREATE PROJECT CLEANUP COMPLETED ===\n');
    throw error;
  } finally {
    revalidateTag(t("inst", iid), "max")
  }

}

export async function create_institution(
  name: string, 
  user_id: string
) {
  const res = await prisma.institution.create({
    data: {
      name,
      ownerId: user_id,
      plan: "Basic",
      slug: `cbdinst_${user_id}`
    }
  })
  
  revalidateTag(t("user", user_id), "max")

  redirect(`/institutions/${res.id}`)
}


