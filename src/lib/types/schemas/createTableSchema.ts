import { z } from 'zod'

export const createTableSchema = z.object({
  name: z.string().max(15)
})