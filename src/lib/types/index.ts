import { LucideIcon } from "lucide-react";
import { User } from "../db/generated";
import { DATA_TYPES_LIST, FUNCTION_RETURN_TYPES_LIST } from "../constants";

export interface AuthContextType {
  user: User | null;
  signIn: () => Promise<void>;
  signOut: () => void;
  loading: boolean;
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
  STRING = 'string',
  INT = 'integer',
  FLOAT = 'float',
  BOOL = 'boolean',
  DateTime = 'datetime',
  BYTES = "bytes",
  JSON = "JSON"
}

export type TableViewProps = {
  projectId: string;
};

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

export type QueryFilters = Record<string, [FilterOperator, string]>


export type FUNCTION_RETURN_TYPE_TYPE = (typeof FUNCTION_RETURN_TYPES_LIST)[number]
export type DATA_TYPE_TYPE = (typeof DATA_TYPES_LIST)[number]
export type INDEX_TYPE = (typeof INDEX_TYPES)
export type TRIGGER_EVENT_TYPE = (typeof TRIGGER_EVENTS)
export type TRIGGER_TYPE_TYPE = (typeof TRIGGER_TYPE)
export type TRIGGER_ORIENTATION_TYPE = (typeof TRIGGER_ORIENTATION)


