import { z } from 'zod'

export const createDatabaseSchema = z.object({
  name: z.string().max(30)
})