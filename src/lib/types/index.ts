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
};

export type ColumnDefinition<
  TColumns extends string,
  TData extends Record<TColumns, unknown[]>
> = {
  /**
   * The key into the `data` object.
   */
  key: TColumns;
  /**
   * Optional label to show in the header; falls back to `key`.
   */
  label?: string;
  /**
   * Optional custom cell renderer.
   */
  render?: (args: {
    value: TData[TColumns][number] | undefined;
    rowIndex: number;
    columnKey: TColumns;
  }) => React.ReactNode;
};

export type ColumnTableProps<
  TColumns extends string,
  TData extends Record<TColumns, unknown[]>
> = {
  /**
   * Column definitions (order, labels, custom renderers)
   */
  columns: ColumnDefinition<TColumns, TData>[];
  /**
   * Column-oriented data: { columnKey: [v0, v1, v2, ...] }
   */
  data: TData;
  /**
   * Optional key generator for each row.
   */
  getRowKey?: (rowIndex: number) => React.Key;
  /**
   * Message shown when there are no rows.
   */
  emptyMessage?: string;
};

