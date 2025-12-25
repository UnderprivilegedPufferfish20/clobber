import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Trash2Icon, TriangleAlertIcon } from "lucide-react"
import { toast } from "sonner"

export default function DeleteDialog({
  toBeDeleted,
  projectId,
  schema,
  name,
  table,
  deleteFunction
}: {
  toBeDeleted: string,
  projectId: string
  schema: string
  name: string,
  table?: string
  deleteFunction: (projectId: string, schema: string, name: string, table?: string) => Promise<void>;
}) {
  return (
    <AlertDialog
    >
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          className="flex items-center gap-2"
        >
          <Trash2Icon className="h-4 w-4" />
          Delete {toBeDeleted}
        </DropdownMenuItem>
      </AlertDialogTrigger>

      <AlertDialogContent className="flex flex-col gap-8">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <TriangleAlertIcon className="stroke-indigo-500" />
            Confirm delete {name}
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
              try {
                await deleteFunction(projectId, schema, name, table)
                toast.success(`${toBeDeleted} deleted.`, { id: `delete-${toBeDeleted}` })
              } catch (error) {
                toast.error(
                  `Failed to delete ${toBeDeleted}: ${
                    error instanceof Error ? error.message : "Unknown error"
                  }`,
                  { id: `delete-${toBeDeleted}` }
                )
              }
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
