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
import { Button } from "@/components/ui/button"
import { Trash2Icon, TriangleAlertIcon } from "lucide-react"
import { Dispatch, SetStateAction } from "react"
import { toast } from "sonner"

export default function DeleteDialog({
  toBeDeleted,
  open,
  onOpenChange,
  projectId,
  schema,
  name,
  table,
  deleteFunction,
}: {
  open: boolean,
  onOpenChange: Dispatch<SetStateAction<boolean>>
  toBeDeleted: string,
  projectId: string
  schema: string
  name: string,
  table?: string
  deleteFunction: (projectId: string, schema: string, name: string, table?: string) => Promise<void>;
}) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
    >
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
          <AlertDialogCancel
            onClick={e => {
              e.stopPropagation()
            }}
          >Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={async (e) => {
              e.stopPropagation()
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
