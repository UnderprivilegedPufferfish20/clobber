'use server'

import { prisma } from '@/lib/db' // Adjust the import path for your Prisma client instance
import { getUser } from '@/lib/actions/auth/getUser' // Adjust the import path for your auth helper
import { inviteUsersSchema } from '@/lib/types/schemas/inviteUsersSchema' // Adjust the import path for your Zod schema
import { z } from 'zod'
import { revalidatePath } from 'next/cache' // Optional: use for Next.js cache invalidation

// Define the shape of your form data expected by the action
type FormDataType = z.infer<typeof inviteUsersSchema>

// The main server action function
export default async function addCollaborator(projectId: string, form: FormDataType) {
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
