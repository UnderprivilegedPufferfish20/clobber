import { LucideIcon } from "lucide-react";
import { User } from "../db/generated";

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
  EMAIL = 'email',
  URL = 'url'
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

export type QueryFilters = Record<string, [FilterOperator, string]>



