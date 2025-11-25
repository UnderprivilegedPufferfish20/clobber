import { DATA_TYPES } from ".";

export type ColumnSchema = Record<string, DATA_TYPES>;

/** Column-oriented data: each key matches the column schema key. */
export type ColumnarData = Record<string, unknown[]>;