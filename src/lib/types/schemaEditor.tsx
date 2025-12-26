import { Node } from "@xyflow/react";
import { SchemaEditorTable } from ".";

export interface SchemaEditorNode extends Node {
  data: SchemaEditorTable
}