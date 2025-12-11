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