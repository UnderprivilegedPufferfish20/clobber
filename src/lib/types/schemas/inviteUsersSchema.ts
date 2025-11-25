import { z} from 'zod';

export const inviteUsersSchema = z.object({
    email: z.email({ message: "Please enter valid email" }) 
})
