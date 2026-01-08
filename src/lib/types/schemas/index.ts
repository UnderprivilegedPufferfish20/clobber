import { array, z } from 'zod'
import { INDEX_TYPES, TRIGGER_EVENTS, TRIGGER_ORIENTATION, TRIGGER_TYPE, type DATA_TYPE_TYPE } from '..'
import { DATA_TYPES_LIST, FKEY_REFERENCED_ROW_ACTION_DELETED_LIST, FKEY_REFERENCED_ROW_ACTION_UPDATED_LIST, FUNCTION_RETURN_TYPES_LIST } from '@/lib/constants'

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
  updateAction: z.enum(FKEY_REFERENCED_ROW_ACTION_UPDATED_LIST),
  deleteAction: z.enum(FKEY_REFERENCED_ROW_ACTION_DELETED_LIST)
})

export const createColumnSchema = z.object({
  name: z.string().min(1, { message: "Must provide name" }).max(15, { message: "Name cannot excede 15 characters" }),
  dtype: z.enum(DATA_TYPES_LIST),
  isArray: z.boolean(),
  default: z.string().optional(),
  isPkey: z.boolean(),
  isUnique: z.boolean(),
  isNullable: z.boolean(),
  fkey: z.object({
    keySchema: z.string(),
    keyTable: z.string(),
    keyColumn: z.string(),
    updateAction: z.enum(FKEY_REFERENCED_ROW_ACTION_UPDATED_LIST),
    deleteAction: z.enum(FKEY_REFERENCED_ROW_ACTION_DELETED_LIST)
  }).optional()
})

export const createFunctionSchema = z.object({
  name: z.string().min(1, { message: "Must provide name" }).max(15, { message: "Name cannot excede 15 characters" }),
  schema: z.string(),
  returnType: z.union([
    z.enum(FUNCTION_RETURN_TYPES_LIST),
    z.string()
  ]),
  args: z.array(z.object({ name: z.string(), dtype: z.enum(DATA_TYPES_LIST) })),
  definition: z.string()
})

export const createIndexSchema = z.object({
  schema: z.string().min(1, "Pick a schema"),
  table: z.string().min(1, "Pick a table"),

  // ✅ field-array friendly: cols is [{ value: "col" }, ...]
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

export const createTableSchema = z.object({
  name: z.string().min(1, { message: "Must provide name" }).max(15, { message: "Name cannot excede 15 characters" }),
  columns: createColumnSchema.array()
})

export const createEdgeFunctionSchema = z.object({
  files: z.object({
    code: z.string(),
    name: z.string()
  }).array()
})




