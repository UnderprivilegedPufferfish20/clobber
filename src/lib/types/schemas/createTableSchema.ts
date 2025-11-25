import { z } from 'zod'

export const createTableSchema = z.object({
  name: z.string().min(1, { message: "Must provide name" }).max(15, { message: "Name cannot excede 15 characters" })
})