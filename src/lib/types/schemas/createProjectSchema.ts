import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z.string().min(5, { message: "Name must be at least 5 characters" }).max(30, { message: "Name cannot excede 30 characters" })
})