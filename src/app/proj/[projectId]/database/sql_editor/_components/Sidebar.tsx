"use client"

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator'
import { Prisma, sql, SqlFolder } from '@/lib/db/generated';
import { ArrowUpRightFromSquareIcon, ChevronDownIcon, ChevronRightIcon, CircleIcon, DownloadIcon, EditIcon, EllipsisVerticalIcon, FilePlus, FileSpreadsheetIcon, FolderIcon, FolderOpenIcon, Loader2, PlusIcon, Trash2Icon, TriangleAlertIcon } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { toast } from "sonner";
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import CustomDialogHeader from '@/components/CustomDialogHeader';
import { useMutation } from '@tanstack/react-query';
import { renameFolder, createQuery, moveQueryToRoot, moveQueryIntoFolder, renameQuery, deleteQuery, deleteFolder } from '@/lib/actions/database/sql';
import AddFolderDialog from './dialogs/AddFolderDialog';
import AddQueryDialog, { FolderSelect } from './dialogs/AddQueryDialog';



const SqlEditorSidebar = ({
  folders,
  queries
}: {
  folders: Prisma.SqlFolderGetPayload<{include: { queries: true }}>[],
  queries: sql[]
}) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const selectedQuery = searchParams.get("query");
  const sqlId = searchParams.get("q") || ""; // <-- query id from ?q=
  const projectId = useMemo(() => pathname.split("/")[2] ?? "", [pathname]);

  const [searchTerm, setSearchTerm] = useState('');

  const filteredQueries = useMemo(() => {
    if (!queries || !searchTerm) return [];
    return queries.filter(q => q.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [queries, searchTerm]);


  return (
    <div className='sidebar'>
      <div className="fullwidth flex flex-col">
        <h1 className="text-2xl font-semibold m-4">SQL Editor</h1>
        <Separator className="pt-0!" />

        <div className='flex flex-col mt-2'>
            <div className='mt-4'>
              <div className='flex items-center gap-2 mb-4 px-2'>
                <Input 
                  placeholder="Search queries..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  className="flex-1" 
                />
                <AddButton projectId={projectId} folders={folders!} />
              </div>
              {searchTerm ? (
                <>
                  <div className="mb-2 text-sm text-muted-foreground">{filteredQueries.length} results found</div>
                  {filteredQueries.map(q => (
                    <Query key={q.id} q={q} qid={sqlId} projectId={projectId} folders={folders}/>
                  ))}
                </>
              ) : (
                <>
                  {folders && folders.map(f => (
                    <Folder
                      key={f.id}
                      id={f.id} 
                      name={f.name}
                      queries={f.queries}
                      sqlId={sqlId}
                      projectId={projectId}
                      folders={folders}
                    />
                  ))}
                  {queries && queries.filter(q => !q.folderId).map(q => (
                    <Query key={q.id} q={q} qid={sqlId} projectId={projectId} folders={folders}/>
                  ))}
                </>
              )}
            </div>
        </div>
      </div>
    </div>
  )
}

export default SqlEditorSidebar

type FolderProps = {
  id: string,
  projectId: string,
  sqlId: string,
  name: string,
  queries: sql[],
  folders: SqlFolder[]
}

function AddButton({ projectId, folders }: { projectId: string, folders: SqlFolder[] }) {
  const [openQuery, setOpenQuery] = useState(false);
  const [openFolder, setOpenFolder] = useState(false);

  return (
    <>
      {/* Keep dialogs mounted OUTSIDE the dropdown */}
      <AddQueryDialog
        projectId={projectId}
        open={openQuery}
        folders={folders}
        onOpenChange={setOpenQuery}
        hideTrigger
      />
      <AddFolderDialog
        projectId={projectId}
        open={openFolder}
        onOpenChange={setOpenFolder}
        hideTrigger
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className='bg-gray-50 dark:bg-black/10 dark:hover:bg-gray-900 hover:bg-gray-100 flex items-center justify-center border-2 h-9 w-10'
            variant={'outline'}
          >
              <PlusIcon />
          </Button> 
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => setOpenQuery(true)}>
            Add query
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setOpenFolder(true)}>
            Add folder
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

const downloadQueryTxt = (name: string, body: string) => {
  const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;

  // safe filename
  const base = (name)
    .trim()
    .replace(/[^\w\-]+/g, "_")
    .slice(0, 80);

  a.download = `${base}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
};

function Folder({ name, queries, sqlId, projectId, folders, id }: FolderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [createQueryDialog, setCreateQueryDialog] = useState(false);
  const [editedName, setEditedName] = useState(name)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [queryName, setQueryName] = useState("");

  const { mutate: rename, isPending: isRenamePending } = useMutation({
    mutationFn: () => renameFolder(projectId, id, editedName),
    onSuccess: () => {
      setIsEditingName(false)
      toast.success("Folder renamed", { id:"renamed-Folder" });
      setIsEditingName(false);
    },
    onError: (error) => {
      setEditedName(name)
      console.log("Error details:", error);
      if (error.message === 'NEXT_REDIRECT') {
        toast.success("Folder renamed", { id:"renamed-Folder" });
        return;
      }
      toast.error(`Failed to rename Folder: ${error}`, { id:"renamed-Folder" })
    }
  })

  const { mutate: createQueryInFolder, isPending: isCreatePending } = useMutation({
    mutationFn: () => createQuery({
      name: queryName
    },
    projectId,
    id
    ),
    onSuccess: () => {
      setIsEditingName(false)
      toast.success("Query created", { id:"create-query" });
      setCreateQueryDialog(false);
      setQueryName("")
    },
    onError: (error) => {
      setEditedName(name)
      console.log("Error details:", error);
      if (error.message === 'NEXT_REDIRECT') {
        toast.success("Query created", { id:"create-query" });
        return;
      }
      toast.error(`Failed to create query: ${error}`, { id:"create-query" })
    }
  })

  return (
    <>
    <div 
      onClick={() => setIsOpen(p => !p)} 
      className={`fullwidth ${isOpen ? "" : "hover:bg-white/5"} flex flex-col p-2 hover:cursor-pointer`}
    >
      <ContextMenu>
        <ContextMenuTrigger>

          <div className='flex items-center gap-2'>
            <button className='flex items-center'>
              {isOpen ? (
                <ChevronDownIcon className='stroke-black dark:stroke-white h-5 w-5' />
              ) : (
                <ChevronRightIcon className='stroke-black dark:stroke-white h-5 w-5'/>
              )}
            </button>

            {isOpen ? (
              <FolderOpenIcon className='stroke-black dark:stroke-white h-5 w-5' />
            ) : (
              <FolderIcon className='stroke-black dark:stroke-white h-5 w-5'/>
            )}
            <div className='font-semibold flex gap-2 items-center'>
              {name}
              {queries.map(q => q.id).includes(sqlId) && <CircleIcon className='rounded-full h-2 w-2 bg-indigo-400 stroke-indigo-400'/>}
            </div>
          </div>

        </ContextMenuTrigger>

        <ContextMenuContent className="w-48">
          <ContextMenuItem
            className="flex gap-2 items-center"
            onSelect={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsEditingName(true);
            }}
          >
            <EditIcon className="h-4 w-4" />
            Rename
          </ContextMenuItem>

          <ContextMenuItem
            className="flex gap-2 items-center"
            onSelect={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCreateQueryDialog(true);
            }}
          >
            <PlusIcon className="h-4 w-4" />
            Create Query
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuItem
            onSelect={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDeleteDialogOpen(true);
            }}
            className="flex gap-2 items-center"
          >
            <Trash2Icon className="h-4 w-4" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
        {isOpen && queries.length > 0 && (
          <div className="flex ml-2 mt-2 fullwidth" onClick={(e) => e.stopPropagation()}>
            {/* Vertical separator */}
            <div className="w-1.5 bg-white/10 mr-2 rounded-sm" style={{ minHeight: `${queries.length * 40}px` }} />

            {/* Query list */}
            <div className="flex flex-1 flex-col gap-1">
              {queries.map(q => (
                <Query key={q.id} q={q} qid={sqlId} projectId={projectId} folders={folders} />
              ))}
            </div>
          </div>
        )}
      </div>

      <FolderDeleteDialog 
        name={name}
        id={id}
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
        projectId={projectId}
      />

      <Dialog
        open={isEditingName}
        onOpenChange={setIsEditingName}
      >
        <DialogContent>
          <CustomDialogHeader 
            icon={EditIcon}
            title={'Rename'}
          />

          <form 
            className='space-y-8 w-full p-4'
            onSubmit={(e) => {
              e.preventDefault()
              rename()
            }}
          >
            <Input 
              value={editedName}
              onChange={e => setEditedName(e.target.value)}
              placeholder={name}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  rename()
                }
              }}
            />


            <Button type='submit' className='w-full' disabled={isRenamePending || editedName === "" || editedName === name}>
              {!isRenamePending && "Proceed"}
              {isRenamePending && <Loader2 className='animate-spin' />}
            </Button>
          </form>
          

        </DialogContent>
      </Dialog>

      <Dialog
        open={createQueryDialog}
        onOpenChange={setCreateQueryDialog}
      >
        <DialogContent>
          <CustomDialogHeader 
            icon={FilePlus}
            title={'Create query'}
          />

          <form 
            className='space-y-8 w-full p-4'
            onSubmit={(e) => {
              e.preventDefault()
              createQueryInFolder()
            }}
          >
            <Input 
              value={queryName}
              onChange={e => setQueryName(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  createQueryInFolder()
                }
              }}
            />


            <Button type='submit' className='w-full' disabled={isCreatePending || queryName === ""}>
              {!isRenamePending && "Proceed"}
              {isRenamePending && <Loader2 className='animate-spin' />}
            </Button>
          </form>
          

        </DialogContent>
      </Dialog>
    </>

  );
}




function Query({
  q,
  qid,
  projectId,
  folders
}: {
  q: sql,
  qid: string,
  projectId: string,
  folders: SqlFolder[]
}) {
  const router = useRouter()
  const pathname = usePathname()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [moveToFolderDialogOpen, setMoveToFolderDialogOpen] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(q.name)
  const [folderId, setFolderId] = useState("root")

  const { mutate: move, isPending: isMovePending } = useMutation({
    mutationFn: () => {
      if (folderId === 'root') {
        return moveQueryToRoot(projectId, q.id)
      } else {
        return moveQueryIntoFolder(projectId, q.id, folderId)
      }
    },
    onSuccess: () => {
      setFolderId("")
      toast.success("Query Moved", { id:"move-Query" });
      setMoveToFolderDialogOpen(false);
    },
    onError: (error) => {
      setFolderId("")
      console.log("Error details:", error);
      if (error.message === 'NEXT_REDIRECT') {
        toast.success("Query Moved", { id:"move-Query" });
        setMoveToFolderDialogOpen(false);
        return;
      }
      toast.error(`Failed to move Query: ${error}`, { id:"move-Query" })
    }
  })

  const { mutate: rename, isPending: isRenamePending } = useMutation({
    mutationFn: () => renameQuery(projectId, q.id, editedName),
    onSuccess: () => {
      setIsEditingName(false)
      toast.success("Query renamed", { id:"renamed-Query" });
      setMoveToFolderDialogOpen(false);
    },
    onError: (error) => {
      setEditedName(q.name)
      console.log("Error details:", error);
      if (error.message === 'NEXT_REDIRECT') {
        toast.success("Query renamed", { id:"renamed-Query" });
        setMoveToFolderDialogOpen(false);
        return;
      }
      toast.error(`Failed to rename Query: ${error}`, { id:"renamed-Query" })
    }
  })



  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
          <div 
            className={cn(
              'group flex gap-3 items-center justify-between p-2 hover:bg-white/5 hover:cursor-pointer',
              q.id === qid ? 
                  'bg-indigo-500 text-white hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600!' 
                  : 'text-black hover:bg-white/5! dark:text-white dark:hover:text-white!'
            )}
            onClick={() => {
              router.push(`${pathname}?page=sql_editor&q=${q.id}`)
            }}
          >
            <div className='flex items-center gap-2'>
              <FileSpreadsheetIcon className='h-5 w-5'/>
              <h1 className='font-semibold'>{q.name}</h1>
            </div>

            <QueryDropdown
              setEditedName={setEditedName}
              setIsEditingName={setIsEditingName} 
              setMoveToFolderDialogOpen={setMoveToFolderDialogOpen}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              query={q}
              projectId={projectId}
              folders={folders}
            />

          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-48">
          <ContextMenuItem
            className="flex gap-2 items-center"
            onSelect={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsEditingName(true);
            }}
          >
            <EditIcon className="h-4 w-4" />
            Rename
          </ContextMenuItem>

          <ContextMenuItem
            className="flex gap-2 items-center"
            onSelect={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMoveToFolderDialogOpen(true);
            }}
          >
            <ArrowUpRightFromSquareIcon className="h-4 w-4" />
            Move
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuItem
            className="flex gap-2 items-center"
            onSelect={(e) => {
              e.preventDefault();
              e.stopPropagation();
              try {
                downloadQueryTxt(q.name, q.query);
                toast.success("Download Successful", { id: "download-query" })
              } catch (error) {
                toast.error(`Failed to download query: ${error}`, { id: "download-query" })
              }
              
            }}
          >
            <DownloadIcon className="h-4 w-4" />
            Download
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuItem
            onSelect={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDeleteDialogOpen(true);
            }}
            className="flex gap-2 items-center"
          >
            <Trash2Icon className="h-4 w-4" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <DeleteDialog 
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
        q={q}
        projectId={projectId}
      />

      <Dialog
        open={moveToFolderDialogOpen}
        onOpenChange={setMoveToFolderDialogOpen}
      >
        <DialogContent className='px-0'>
          <CustomDialogHeader 
            icon={FolderIcon}
            title={'Move'}
          />

          <form 
            className='space-y-8 w-full p-4'
            onSubmit={(e) => {
              e.preventDefault()
              move()
            }}
          >
            <FolderSelect 
              folderId={folderId}
              setFolderId={setFolderId}
              folders={folders}
              query={q}
            />

            <Button type='submit' className='w-full' disabled={isMovePending || folderId === ""}>
              {!isMovePending && "Proceed"}
              {isMovePending && <Loader2 className='animate-spin' />}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditingName}
        onOpenChange={setIsEditingName}
      >
        <DialogContent>
          <CustomDialogHeader 
            icon={EditIcon}
            title={'Rename'}
          />

          <form 
            className='space-y-8 w-full p-4'
            onSubmit={(e) => {
              e.preventDefault()
              rename()
            }}
          >
            <Input 
              value={editedName}
              onChange={e => setEditedName(e.target.value)}
              placeholder={q.name}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  rename()
                }
              }}
            />


            <Button type='submit' className='w-full' disabled={isRenamePending || editedName === "" || editedName === q.name}>
              {!isRenamePending && "Proceed"}
              {isRenamePending && <Loader2 className='animate-spin' />}
            </Button>
          </form>
          

        </DialogContent>
      </Dialog>
    </>
  )
}

function QueryDropdown({
  className,
  query,
  projectId,
  setEditedName,
  setIsEditingName,
  setMoveToFolderDialogOpen,
  folders
}: {
  className: string;
  query: sql;
  projectId: string;
  folders: SqlFolder[];
  setEditedName: Dispatch<SetStateAction<string>>;
  setIsEditingName: Dispatch<SetStateAction<boolean>>;
  setMoveToFolderDialogOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [open, setOpen] = useState(false);

  return (
    <>
      <DropdownMenu
        onOpenChange={setOpen}
        open={open}
      >
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
            className={cn(className, open && "opacity-100")}
          >
            <EllipsisVerticalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-48">
          <DropdownMenuItem 
            className="flex gap-2 items-center"
            onSelect={(e) => {
              e.preventDefault();
              setIsEditingName(true)
              setOpen(false)
            }}
          >
            <EditIcon className="h-4 w-4"/>
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="flex gap-2 items-center"
            onSelect={(e) => {
              e.preventDefault();
              setMoveToFolderDialogOpen(true)
              setOpen(false)
            }}
          >
            <ArrowUpRightFromSquareIcon className="h-4 w-4"/>
            Move
          </DropdownMenuItem>
          <DropdownMenuSeparator />

          <DropdownMenuItem 
            className="flex gap-2 items-center"
            onSelect={(e) => {
              e.preventDefault();
              try {
                downloadQueryTxt(query.name, query.query);
                toast.success("Download Successful", { id: "download-query" })
              } catch (error) {
                toast.error(`Failed to download query: ${error}`, { id: "download-query" })
              }
              setOpen(false)
            }}
          >
            <DownloadIcon className="h-4 w-4"/>
            Download
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onSelect={(e) => {
              e.preventDefault();
              setDeleteDialogOpen(true)
              setOpen(false)
            }} 
            className="flex gap-2 items-center"
          >
            <Trash2Icon className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteDialog 
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
        q={query}
        projectId={projectId}
      />
    </>
  )
}

function DeleteDialog({
  q,
  projectId,
  open,
  setOpen
}: {
  q: sql,
  projectId: string,
  open: boolean,
  setOpen: Dispatch<SetStateAction<boolean>>;
}) {

  return (
    <AlertDialog
      open={open}
      onOpenChange={setOpen}
    >
      <AlertDialogContent className="flex flex-col gap-8">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <TriangleAlertIcon className="stroke-indigo-500" />
            Confirm delete {q.name}
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
                await deleteQuery(projectId, q.id)
                toast.success(`Query deleted.`, { id: `delete-query` })
              } catch (error) {
                toast.error(
                  `Failed to delete query: ${
                    error instanceof Error ? error.message : "Unknown error"
                  }`,
                  { id: `delete-query` }
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

function FolderDeleteDialog({
  name,
  id,
  projectId,
  open,
  setOpen
}: {
  name: string,
  id: string,
  projectId: string,
  open: boolean,
  setOpen: Dispatch<SetStateAction<boolean>>;
}) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={setOpen}
    >
      <AlertDialogContent className="flex flex-col gap-8">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <TriangleAlertIcon className="stroke-indigo-500" />
            Confirm delete {name}
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone, and will remove all queries inside.
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
                await deleteFolder(projectId, id)
                toast.success(`Folder deleted.`, { id: `delete-Folder` })
              } catch (error) {
                toast.error(
                  `Failed to delete Folder: ${
                    error instanceof Error ? error.message : "Unknown error"
                  }`,
                  { id: `delete-Folder` }
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