'use server';


import z from "zod";
import { getUser } from "../auth";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import fs from 'fs/promises';
import { generateProjectPassword, getConnectionString, getDataDirectory } from "@/lib/utils";
import { allocatePort, initializeDatabase } from "../database";
import { createProjectSchema, inviteUsersSchema } from "@/lib/types/schemas";

export async function getProjectById(id: string) {
  const user = await getUser()
    
  if (!user) throw new Error("No active user");

  return await prisma.project.findUnique({
    where: {
      id,
    },
    include: {
      collaborators: true,
      owner: true,
      databases: true,
    }
  })
}

export default async function createProject(
  form: z.infer<typeof createProjectSchema>,
  ownerId: string
) {
  const { success, data } = createProjectSchema.safeParse(form);
  if (!success) throw new Error("Invalid form data");

  // ✅ Only generate these ONCE
  const password = generateProjectPassword();
  const port = await allocatePort();

  const dataDir = getDataDirectory(data.name);
  const connectionString = getConnectionString(port, password);

  const exists = await fs.stat(dataDir).then(() => true).catch(() => false);
  if (exists) {
    // This state is dangerous: cluster exists but no DB record → password/port unknown
    throw new Error(
      `Data directory already exists for "${data.name}" but no Project record was found. ` +
      `Delete ${dataDir} or adopt/reset it explicitly.`
    );
  }

  await initializeDatabase(dataDir, password, port);


  return await prisma.project.create({
    data: {
      ownerId,
      name: data.name,
      superuser_pwd: password,
      con_string: connectionString
    },
  });
}

export async function addCollaborator(form: z.infer<typeof inviteUsersSchema>, projectId: string) {
    const user = await getUser()
    
    if (!user) {
        throw new Error("No user authenticated");
    }

    const { success, data } = inviteUsersSchema.safeParse(form)

    if (!success) {
        // You might want to return a more detailed error or status object in a real app
        throw new Error("Invalid form data"); 
    }

    const invitedUser = await prisma.user.findUnique({
        where: {
            email: data.email
        },
        // Ensure you select the ID, which is needed for the connection
        select: { id: true } 
    })

    if (!invitedUser) {
        // Corrected variable name from 'inviteUser' to 'invitedUser'
        throw new Error("User not found"); 
    }

    if (invitedUser.id === user.id) throw new Error("You're the owner");

    // Optional check: Ensure the user being invited isn't already a collaborator or the owner
    // This requires checking the project's current collaborators before updating.
    // We can handle this by letting the database constraint handle it, or pre-check here:

    const project = await prisma.project.findUnique({
        where: {
            id: projectId
        },
        // Include current collaborators to check existence
        include: {
            collaborators: {
                select: { id: true }
            }
        }
    })

    if (!project) {
        throw new Error("Project not found");
    }

    const isAlreadyCollaborator = project.collaborators.some(c => c.id === invitedUser.id);
    if (isAlreadyCollaborator) {
        throw new Error("User is already a collaborator");
    }

    // --- The finished part ---
    await prisma.project.update({
        where: {
            id: projectId
        },
        data: {
            collaborators: {
                // Use Prisma's 'connect' syntax to link the existing user record 
                // to the project's collaborators relationship
                connect: {
                    id: invitedUser.id,
                }
            }
        }
    });

    // Optional: Revalidate the path where the project is displayed to show the new collaborator
    // Adjust the path to match your project details page URL structure
    revalidatePath(`/dashboard/projects/${projectId}`); 
}

