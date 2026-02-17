import { LucideIcon } from "lucide-react";
import z from "zod";
import { createColumnSchema, createEdgeFunctionSchema, createForeignKeyColumnSchema, createForeignKeySchema, createTableSchema } from "./schemas";
import { Dispatch, SetStateAction } from "react";
import { User } from "@prisma/client";

export interface AuthContextType {
  user: User | null;
  signIn: () => Promise<void>;
  signOut: () => void;
  loading: boolean;
}

export type AuthUserType = {
  id: string,
  email: string,
  last_sign_in_at: Date,
  created_at: Date,
  updated_at: Date,
  phone: string
}

export type EdgeFunctionType = {
  files: { name: string, code: string }[],
  entry_point_function_name: string,
  url: string,
  created_at: any,
  updated_at: any,
  deployment_count: number,
  slug: string
}

export type EdgeFunctionSecretType = {
  name: string,
  value: string,
  created_at: string,
  updated_at: string
}

export interface UserCookie {
  id: string,
  tokens: {
    access: string,
    refresh: string
  }
}

export interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
}

export enum VECTOR_INDEX_TYPE {
  DENSE = "DENSE",
  SPARSE = "SPARSE"
}

export enum VECTOR_INDEX_METRIC {
  COSINE = "COSINE",
  EUCLIDEAN = "EUCLIDEAN",
  DOTPRODUCT = "DOT_PRODUCT"
}

export enum INDEX_SEARCH_METHOD {
  TEXT = "TEXT",
  ID = "ID",
  SPARSE_VECTOR = "SPARSE_VECTOR",
  LIST_IDS = "LIST_IDS"
}

export type StorageIndex = {
  id: string,
  project_id: string,
  namespaces: string[],
  name: string,
  dimensions: number,
  vector_type: VECTOR_INDEX_TYPE,
  metric: VECTOR_INDEX_METRIC
}

export type IndexVector = {
  id: string,
  namespace: string,
  text: string,
  embedding: number[]
}

export interface IndexVectorWithScore extends IndexVector {
  score: number
}

export type FileStorageBucket = {
  id: string,
  name: string,
  project_id: string,
  created_at: string,
  updated_at: string
  size_lim_bytes: bigint,
  allowed_types: string[],
  is_public: boolean
}

export type FileObject = {
  id: string,
  name: string,
  bucketId: string,
  created_at: string,
  last_accessed_at: string,
  updated_at: string,
  metadata: any
}

export interface Plan {
  name: string;
  originalPrice?: number;
  description: string;
  price: number;
  color: string;
  popular: boolean;
  icon: React.ReactNode;
  features: string[];
}

export interface PlansRecord {
  monthly: Plan;
  yearly: Plan;
}

export enum DATA_TYPES {
  BIGINT = "bigint", // int8
  BIGSERIAL = "bigserial", // serial8

  VECTOR = "VECTOR",

  BIT = "bit", // bit(n)
  BIT_VARYING = "bit varying", // varbit(n)

  BOOLEAN = "boolean", // bool

  BOX = "box",
  BYTEA = "bytea",

  CHARACTER = "character", // char(n)
  CHARACTER_VARYING = "character varying", // varchar(n)

  CIDR = "cidr",
  CIRCLE = "circle",

  DATE = "date",

  DOUBLE_PRECISION = "double precision", // float8
  INET = "inet",

  INTEGER = "integer", // int4 / int
  INTERVAL = "interval", // interval [fields] [(p)]

  JSON = "json",
  JSONB = "jsonb",

  LINE = "line",
  LSEG = "lseg",

  MACADDR = "macaddr",
  MACADDR8 = "macaddr8",

  MONEY = "money",

  NUMERIC = "numeric", // numeric(p,s) / decimal(p,s)

  PATH = "path",

  PG_LSN = "pg_lsn",
  PG_SNAPSHOT = "pg_snapshot",

  POINT = "point",
  POLYGON = "polygon",

  REAL = "real", // float4

  SMALLINT = "smallint", // int2
  SMALLSERIAL = "smallserial", // serial2
  SERIAL = "serial", // serial4

  TEXT = "text",

  TIME = "time", // time(p) [without time zone]
  TIME_TZ = "time with time zone", // timetz

  TIMESTAMP = "timestamp", // timestamp(p) [without time zone]
  TIMESTAMPTZ = "timestamp with time zone", // timestamptz

  TSQUERY = "tsquery",
  TSVECTOR = "tsvector",

  TXID_SNAPSHOT = "txid_snapshot", // deprecated (see pg_snapshot)

  UUID = "uuid",
  XML = "xml",
}

export interface DatabaseObjectAddSheetProps {
  projectId: string,
  schemas: string[],
  open: boolean,
  onOpenChange: Dispatch<SetStateAction<boolean>>;
}



export type EditingCell = {
  rowKey: string;
  col: string;
  initial: string;
};

// in "@/lib/types"
export type FilterConfig = {
  column: string;
  operator: FilterOperator;
  value: string;
};

export type ColumnSortType = {
  column: string,
  dir: "ASC" | "DESC"
}


export type PostgresInstance = {
  port: number;
  projectName: string;
  dataDir: string;
  password: string;
  connectionString: string;
};

export type CreateProject = {
  projectName: string;
  password: string;
};

export type ExecuteQuery = {
  query: string;
  projectId: string;
}

export enum FilterOperator {
  EQUALS = "=",
  NOT_EQUAL = "<>",
  GREATER_THAN = ">",
  LESS_THAN = "<",
  GREATER_THAN_OR_EQUAL_TO = ">=",
  LESS_THAN_OR_EQUAL_TO = "<=",
  LIKE = "~~",
  IN = "IN",
  IS = "IS"
}

export type DataTypeType = {
  dtype: DATA_TYPES,
  description: string,
  icon: LucideIcon
}

export enum INDEX_TYPES {
  BTREE = 'BTREE',
  HASH = 'HASH',
  GiST = 'GiST',
  SPGiST = 'SPGiST',
  GIN = 'GIN',
  BRIN = 'BRIN'
}

export enum FKEY_REFERENCED_ROW_ACTION_UPDATED {
  NONE = "NO ACTION", 
  CASCADE = "CASCADE",
  RESTRICT = 'RESTRICT'
}

export enum FKEY_REFERENCED_ROW_ACTION_DELETED {
  NONE = "NO ACTION", 
  CASCADE = "CASCADE",
  RESTRICT = 'RESTRICT',
  SET_DEFAUKT = "SET DEFAULT",
  SET_NULL = "SET NULL"
}

export enum FUNCTION_RETURN_TYPES {
  STRING = 'string',
  INT = 'integer',
  FLOAT = 'float',
  BOOL = 'boolean',
  DateTime = 'datetime',
  BYTES = "bytes",
  JSON = "JSON",
  VOID = "void",
  RECORD = "record",
  TRIGGER = "TRIGGER"
}

export enum TRIGGER_EVENTS {
  INSERT = "INSERT",
  UPDATE = "UPDATE",
  DELETE = "DELETE"
}

export enum TRIGGER_TYPE {
  BEFORE = "BEFORE",
  AFTER = "AFTER"
}

export enum TRIGGER_ORIENTATION {
  ROW = "ROW",
  STATEMENT = "STATEMENT"
}

export enum DATA_EXPORT_FORMATS {
  CSV = "CSV",
  JSON = "JSON",
  SQL = "SQL"
}


export type INDEX_TYPE = (typeof INDEX_TYPES)
export type TRIGGER_EVENT_TYPE = (typeof TRIGGER_EVENTS)
export type TRIGGER_TYPE_TYPE = (typeof TRIGGER_TYPE)
export type TRIGGER_ORIENTATION_TYPE = (typeof TRIGGER_ORIENTATION)
export type FKEY_REFERENCED_ROW_ACTION_DELETED_TYPE = (typeof FKEY_REFERENCED_ROW_ACTION_DELETED)
export type FKEY_REFERENCED_ROW_ACTION_UPDATED_TYPE = (typeof FKEY_REFERENCED_ROW_ACTION_UPDATED)
export type SELECTED_FKEY_COLS_TYPE = { referencorCol: string, referenceeCol: string }[]

export type ColumnType = z.infer<typeof createColumnSchema>
export type TableType = z.infer<typeof createTableSchema>
export type FkeyType = z.infer<typeof createForeignKeySchema>
export type FkeyColumnType = z.infer<typeof createForeignKeyColumnSchema>


export type JsonNodeData = {
  title: string;
  table: TableType;
};

export type TriggerType = {
  name: string,
  table_name: string,
  schema_name: string,
  function_name: string,
  events: string[],
  timing: string[],
  orientation: string
}

export type IndexType = {
  schema_name: string,
  table_name: string,
  index_name: string,
  access_method: string,
  index_definition: string,
  is_unique: boolean,
  is_primary: boolean
}

export type DatabaseFunctionType = {
  schema_name: string,
  function_name: string,
  return_type: string,
  arguments: string,
  definition: string
}

export type EnumType = {
  enum_schema: string,
  enum_name: string,
  enum_values: string
}

export type RoleType = {
  name: string,
  can_login: boolean,
  can_create_roles: boolean,
  can_bypass_rls: boolean,
  is_superuser: boolean
}
