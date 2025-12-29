"use client";

import CustomDialogHeader from '@/components/CustomDialogHeader';
import TextInputDialog from '@/components/TextInputDialog';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '@/components/ui/context-menu';
import { Dialog, DialogClose, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { createFolder, renameObject, uploadFile } from '@/lib/actions/storage/actions';
import { getFolderData } from '@/lib/actions/storage/getActions';
import { fileEndingToIcon } from '@/lib/constants';
import { cn, listImmediateChildren } from '@/lib/utils';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeftIcon, ArrowUpRightFromSquare, CloudUploadIcon, DownloadIcon, EditIcon, FileTextIcon, FolderIcon, FolderPlusIcon, Heading1, InboxIcon, LinkIcon, Loader2, Search, Trash2Icon } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { ChangeEvent, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Object as DbObject } from '@/lib/db/generated';

type Props = {
  bucketName: string,
  folderData: Awaited<ReturnType<typeof getFolderData>>
}

const FoldersPage = (props: Props) => {
  console.log("@@FOLDERDATA: ", props.folderData)

  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  const inputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const projectId = pathname.split("/")[2]
  const currentPath = searchParams.get("path") as string;

  const [searchTerm, setSearchTerm] = useState("")
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [open, setOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")

  const { mutate, isPending } = useMutation({
    mutationFn: () => createFolder(projectId, newFolderName, searchParams.get("path")!),
    onSuccess: () => {
      toast.success("Folder Created", { id:"create-folder" });
      setOpen(false);
      setNewFolderName("")
    },
    onError: (error) => {
      console.log("Error details:", error);
      if (error.message === 'NEXT_REDIRECT') {
        toast.success("folder Added", { id:"create-folder" });
        setOpen(false);
        return;
      }
      toast.error("Failed to Create folder", { id:"create-folder" })
    }
  })

  const { mutate: upload, isPending: isUploadPending } = useMutation({
    mutationFn: async (f: File) => {
      const fileName = f.name;
      const arrayBuffer = await f.arrayBuffer();

      return uploadFile(projectId, currentPath, fileName, arrayBuffer)
    },
    onSuccess: () => {
      toast.success("Upload Successful", { id:"upload" });
    },
    onMutate(variables, context) {
      toast.loading("Uploading...", { id: "upload" })
    },
    onError: (error) => {
      console.log("Error details:", error);
      if (error.message === 'NEXT_REDIRECT') {
        toast.success("Item Uploaded", { id:"cupload" });
        setOpen(false);
        return;
      }
      toast.error("Failed to upload item", { id:"upload" })
    }
  })

  const filteredItems = useMemo(() => {
    if (!props.folderData) return [];

    const q = searchTerm.trim().toLowerCase();
    if (!q) return props.folderData;

    return props.folderData.filter(b => b.name.toLowerCase().includes(q))
  }, [searchTerm, props.folderData])

  const { folders, files } = useMemo(() => {
    if (!props.folderData) return { folders: [], files: [] };
    return listImmediateChildren(props.folderData, projectId, currentPath);
  }, [props.folderData, projectId, currentPath]);

  const showEmptyState = !searchTerm && props.folderData.every(f => f.name.slice(`${projectId}/${currentPath}`.length + 1) === ".placeholder");
  const showNoMatchesState = !!searchTerm && filteredItems.length === 0;

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    if (!f) return;

    setFile(f);
    setFileName(f.name);

    // optional: auto-upload immediately after selection
    upload(f);

    // allow re-selecting the SAME file later (important UX detail)
    e.currentTarget.value = "";
  }

  const onPickFile = () => inputRef.current?.click();

  const prefix = `${projectId}/${currentPath.replace(/^\/+|\/+$/g, "")}/`;
  const childName = (o: DbObject) =>
    o.name.slice(prefix.length).split("/").filter(Boolean)[0] ?? o.name;

  return (
    <>
      <div className="fullscreen flex flex-col p-8 overflow-y-auto">
        <div className="flex items-center justify-between gap-4 pb-4">
          <div className='flex gap-2 items-baseline justify-baseline'>
            <ArrowLeftIcon 
              className='w-6 h-6 cursor-pointer'
              onClick={() => {
                router.push(`${pathname}`)
              }}
            />
            <Link href={`${pathname}?page=files&path=${props.bucketName}`} className="font-bold text-3xl">{props.bucketName}</Link>

            <Breadcrumb className='ml-4 my-auto'>
              <BreadcrumbList>
                {currentPath.split("/").filter(f => f !== props.bucketName).map(p => {
                  
                  const linkToFolder = (folderName: string) => {
                    const index = currentPath.indexOf(folderName)

                    const endIndex = index + folderName.length

                    return currentPath.substring(0, endIndex)
                  }

                  return (
                    <>
                      <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                          <Link href={`${pathname}?page=files&path=${linkToFolder(p)}`}>{p}</Link>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                    </>
                  )
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          
          <div className='flex items-center gap-2'>
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={onFileChange}
              />

              <Button
                className="flex items-center gap-2"
                variant="outline"
                onClick={onPickFile}
                disabled={isUploadPending}
              >
                <CloudUploadIcon className="w-6 h-6" />
                Upload
              </Button>
            </div>
            <Button
              className='flex items-center gap-2'
              variant={"outline"}
              onClick={() => setCreateFolderOpen(true)}
            >
              <FolderPlusIcon className='w-6 h-6'/>
              Create Folder
            </Button>
            <Input
              className='max-w-3xs'
              placeholder='Search for resources' 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>


        <Separator className="mb-6" />

        {showEmptyState ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center">
            <InboxIcon size={96} className="text-muted-foreground" />
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold">No items yet</h2>
              <p className="text-muted-foreground text-sm">
                Create a folder or upload a file
              </p>
            </div>

            <Button
              variant={"default"}
              onClick={() => setOpen(true)}
            >
              Create Bucket
            </Button>
          </div>
        ) : showNoMatchesState ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <Search size={72} className="text-muted-foreground" />
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">No matches</h2>
              <p className="text-muted-foreground text-sm">
                No buckets match “{searchTerm.trim()}”.
              </p>
            </div>
            <Button
              onClick={() => setSearchTerm("")}
            >
              Clear Search
            </Button>
          </div>
        ) : (
          <div className='flex flex-col gap-8'>

            <h1 className='text-2xl font-semibold'>Folders</h1>
            <div 
              className='flex gap-2 overflow-hidden hover:overflow-x-scroll p-2 mb-7 scroll-mb-6'
            >
              {folders.map((folder) => (
                <FolderCard 
                  key={`folder:${folder.id}`} 
                  name={childName(folder)} 
                />
              ))}
            </div>
            
            <h1 className='text-2xl font-semibold mt-6'>Files</h1>
            <div className='grid grid-cols-6 gap-2'>
              {files.map((file) => (
                <FileCard 
                  key={`file:${file.id}`} 
                  name={childName(file)}
                  createdAt={file.createdAt}
                  size='1.2 Mb'
                  type='text/plain'
                  id={file.id} 
                />
              ))}
            </div>

          </div>
        )}
      </div>

      <Dialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
      >
        <form
          onSubmit={e => {
            e.preventDefault()
            mutate()
          }}
        >
          <DialogContent>
            <CustomDialogHeader 
              icon={FolderPlusIcon}
              title="New Folder"
            />

            <div className="flex flex-col gap-2">
              <Label htmlFor="name" >Name</Label>
              <Input
                value={newFolderName}
                onKeyDown={e => {
                if (e.key === "Enter") {
                    e.preventDefault()
                    mutate()
                  }
                }}
                onChange={e => setNewFolderName(e.target.value)} 
                id="name"
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  variant={'outline'}
                >
                  Cancel
                </Button>
              </DialogClose>

              <Button type='submit' disabled={isPending || props.folderData.map(b => b.name).includes(newFolderName) || newFolderName === ""}>
                {!isPending && "Proceed"}
                {isPending && <Loader2 className='animate-spin' />}
              </Button>
            </DialogFooter>
          </DialogContent>
        </form>
      </Dialog>
    </>
  )
}

export default FoldersPage

function FileCard({
  id,
  name,
  createdAt,
  type,
  size
}: {
  id: string,
  name: string,
  createdAt: Date,
  type: string,
  size: string
}) {
  const [fileName, ending] = name.split(".")

  const [isNameEditOpen, setIsNameEditOpen] = useState(false);
  const [newObjectName, setNewObjectName] = useState(name)

  const [isGetUrlOpen, setIsGetUrlOpen] = useState(false)

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const projectId = pathname.split("/")[2]

  const { mutate: download, isPending: isDownloadPending } = useMutation({
    mutationFn: async (f: File) => {
      const fileName = f.name;
      const arrayBuffer = await f.arrayBuffer();

      return uploadFile(projectId, currentPath, fileName, arrayBuffer)
    },
    onSuccess: () => {
      toast.success("Upload Successful", { id:"upload" });
    },
    onMutate(variables, context) {
      toast.loading("Uploading...", { id: "upload" })
    },
    onError: (error) => {
      console.log("Error details:", error);
      if (error.message === 'NEXT_REDIRECT') {
        toast.success("Item Uploaded", { id:"cupload" });
        setOpen(false);
        return;
      }
      toast.error("Failed to upload item", { id:"upload" })
    }
  })

  

  const { mutate: getUrl, isPending: isGetUrlPending } = useMutation({
    mutationFn: async (f: File) => {
      const fileName = f.name;
      const arrayBuffer = await f.arrayBuffer();

      return uploadFile(projectId, currentPath, fileName, arrayBuffer)
    },
    onSuccess: () => {
      toast.success("Upload Successful", { id:"upload" });
    },
    onMutate(variables, context) {
      toast.loading("Uploading...", { id: "upload" })
    },
    onError: (error) => {
      console.log("Error details:", error);
      if (error.message === 'NEXT_REDIRECT') {
        toast.success("Item Uploaded", { id:"cupload" });
        setOpen(false);
        return;
      }
      toast.error("Failed to upload item", { id:"upload" })
    }
  })



  const Icon = fileEndingToIcon[ending] ?? FileTextIcon

  return (
    <>
    
      <ContextMenu>
        <ContextMenuTrigger>
          <div className='group flex flex-col gap-6 rounded-xl border bg-background p-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md hover:border-foreground/20'>
            <div className="min-w-0 flex items-center justify-between">
              <div className="group flex items-center gap-2">
                <Icon className="h-6 w-6 text-muted-foreground" />
                <h3>{name}</h3>
              </div>

              <h2 className='text-muted-foreground'>{size}</h2>
            </div>

            <footer className='fullwidth flex justify-between items-center text-muted-foreground text-sm'>
              {createdAt.toLocaleDateString()}
              <h3>{type}</h3>
            </footer>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem className='flex items-center gap-2'>
            <LinkIcon className='w-4 h-4'/>
            Get URL
          </ContextMenuItem>
          <ContextMenuItem className='flex items-center gap-2' onClick={() => setIsNameEditOpen(true)}>
            <EditIcon className='w-4 h-4'/>
            Rename
          </ContextMenuItem>
          <ContextMenuItem className='flex items-center gap-2'>
            <ArrowUpRightFromSquare className='w-4 h-4'/>
            Move
          </ContextMenuItem>
          <ContextMenuItem className='flex items-center gap-2'>
            <DownloadIcon className='w-4 h-4'/>
            Download
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem className='flex items-center gap-2'>
            <Trash2Icon className='w-4 h-4'/>
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <TextInputDialog
        open={isNameEditOpen}
        onOpenChange={setIsNameEditOpen} 
        action={renameObject}
        value={newObjectName}
        onValueChange={setNewObjectName}
        headerIcon={EditIcon}
        headerTitle='Rename Item'
        toastId='rename-object'
        successMessage='Item renamed'
        loadingMessage='Renaming...'
        errorMessage='Failed to rename item'
        defaultState={name}
        actionArgs={[projectId, id, `${projectId}/${searchParams.get("path")}/${name}`, newObjectName]}
      />
    </>
  )
}

function FolderCard({
  name
}: {
  name: string
}) {
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const constructNextPathname = () => {
    const sp = new URLSearchParams(searchParams)
    const curPath = sp.get("path")
    return curPath + `/${name}`
  }



  return (
    <Link
      href={`${pathname}?page=files&path=${constructNextPathname()}`}
      className="group rounded-xl border bg-background p-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md hover:border-foreground/20 w-md min-w-md max-w-md"
    >
      <div className="min-w-0">
          <div className="group flex items-center gap-2">
            <FolderIcon className="h-6 w-6 text-muted-foreground" />
            <h3>{name}</h3>
          </div>
        </div>
    </Link>
  )
}