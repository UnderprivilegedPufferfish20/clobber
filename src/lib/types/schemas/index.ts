import { z } from 'zod'

export const createDatabaseSchema = z.object({
  name: z.string().min(5, { message: "Name cannot be less than 5 characters" }).max(30, { message: "Name cannot exceed 30 characters" })
})

export const createProjectSchema = z.object({
  name: z.string().min(5, { message: "Name must be at least 5 characters" }).max(30, { message: "Name cannot excede 30 characters" })
})

export const createTableSchema = z.object({
  name: z.string().min(1, { message: "Must provide name" }).max(15, { message: "Name cannot excede 15 characters" })
})

export const createSchemaScheam = z.object({
  name: z.string().min(1, { message: "Must provide name" }).max(15, { message: "Name cannot excede 15 characters" })
})
export const createQuerySchema = z.object({
  name: z.string().min(1, { message: "Must provide name" }).max(15, { message: "Name cannot excede 15 characters" })
})

export const createFolderSchema = z.object({
  name: z.string().min(1, { message: "Must provide name" }).max(15, { message: "Name cannot excede 15 characters" })
})

export const inviteUsersSchema = z.object({
    email: z.email({ message: "Please enter valid email" }) 
})


