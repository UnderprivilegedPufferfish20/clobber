import { array, z } from 'zod'
import { DATA_TYPES, FKEY_REFERENCED_ROW_ACTION_DELETED, FKEY_REFERENCED_ROW_ACTION_UPDATED, FUNCTION_RETURN_TYPES, INDEX_TYPES, TRIGGER_EVENTS, TRIGGER_ORIENTATION, TRIGGER_TYPE } from '..'

export const createDatabaseSchema = z.object({
  name: z.string().min(5, { message: "Name cannot be less than 5 characters" }).max(30, { message: "Name cannot exceed 30 characters" })
})

export const createProjectSchema = z.object({
  name: z.string().min(5, { message: "Name must be at least 5 characters" }).max(30, { message: "Name cannot excede 30 characters" })
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

export const createRoleSchema = z.object({
  name: z.string(),
  can_login: z.boolean(),
  can_create_roles: z.boolean(),
  can_bypass_rls: z.boolean(),
  is_superuser: z.boolean()
})

export const createFunctionSchema = z.object({
  name: z.string().min(1, { message: "Must provide name" }).max(15, { message: "Name cannot excede 15 characters" }),
  schema: z.string(),
  returnType: z.union([
    z.enum(Object.values(FUNCTION_RETURN_TYPES)),
    z.string()
  ]),
  args: z.array(z.object({ name: z.string(), dtype: z.enum(Object.values(DATA_TYPES)) })),
  definition: z.string()
})

export const createIndexSchema = z.object({
  schema: z.string().min(1, "Pick a schema"),
  table: z.string().min(1, "Pick a table"),
  cols: z
    .array(z.object({ name: z.string().min(1, "Pick a column"), dtype: z.string() }))
    .min(1, "Add at least one column"),

  type: z.enum(INDEX_TYPES),
});

export const createTriggerSchema = z.object({
  name: z.string().min(1, { message: "Must provide name" }).max(15, { message: "Name cannot excede 15 characters" }),
  schema: z.string(),
  table: z.string(),
  event: z.array(z.enum(TRIGGER_EVENTS)),
  type: z.enum(TRIGGER_TYPE),
  orientation: z.enum(TRIGGER_ORIENTATION),
  functionSchema: z.string(),
  functionName: z.string()
})

export const createEnumSchema = z.object({
  name: z.string().min(1, { message: "Must provide name" }).max(15, { message: "Name cannot excede 15 characters" }),
  values: z.array(z.string())
})







export const createForeignKeyColumnSchema = z.object({
  referencorSchema: z.string(),
  referencorTable: z.string(),
  referencorColumn: z.string(),
  referenceeSchema: z.string(),
  referenceeTable: z.string(),
  referenceeColumn: z.string()
})

export const createForeignKeySchema = z.object({
  cols: createForeignKeyColumnSchema.array(),
  updateAction: z.enum(Object.values(FKEY_REFERENCED_ROW_ACTION_UPDATED)),
  deleteAction: z.enum(Object.values(FKEY_REFERENCED_ROW_ACTION_DELETED))
})

export const createColumnSchema = z.object({
  name: z.string().min(1, { message: "Must provide name" }).max(15, { message: "Name cannot excede 15 characters" }),
  dtype: z.enum(Object.values(DATA_TYPES)),
  isArray: z.boolean(),
  default: z.string(),
  isPkey: z.boolean(),
  isUnique: z.boolean(),
  isNullable: z.boolean()
})

export const createTableSchema = z.object({
  name: z.string().min(1, { message: "Must provide name" }).max(15, { message: "Name cannot excede 15 characters" }),
  columns: createColumnSchema.array(),
  fkeys: createForeignKeySchema.array().optional()
})

export const createEdgeFunctionSchema = z.object({
  files: z.object({
    code: z.string(),
    name: z.string()
  }).array()
})




