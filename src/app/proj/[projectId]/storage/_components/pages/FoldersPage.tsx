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
import { createFolder, downloadObject, getURL, renameObject, uploadFile } from '@/lib/actions/storage/actions';
import { getFolderData } from '@/lib/actions/storage/getActions';
import { fileEndingToIcon } from '@/lib/constants';
import { formatGCSFileSize, listImmediateChildren } from '@/lib/utils';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeftIcon, ArrowUpRightFromSquare, CloudUploadIcon, DownloadIcon, EditIcon, FileTextIcon, FolderIcon, FolderPlusIcon, Heading1, InboxIcon, LinkIcon, Loader2, Search, Trash2Icon } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Object as DbObject } from '@/lib/db/generated';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { deleteObject } from '@/lib/actions/storage/deleteActions';

type Props = {
  bucketName: string,
  folderData: Awaited<ReturnType<typeof getFolderData>>
}

const FoldersPage = (props: Props) => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  const inputRef = useRef<HTMLInputElement | null>(null);
  const foldersRef = useRef<HTMLDivElement | null>(null);

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

  const { folders, files } = useMemo(() => {
    if (!props.folderData) return { folders: [], files: [] };
    return listImmediateChildren(props.folderData, projectId, currentPath);
  }, [props.folderData, projectId, currentPath]);

  // MOVED THIS BEFORE useMemo hooks that use it
  const prefix = `${projectId}/${currentPath.replace(/^\/+|\/+$/g, "")}/`;
  const childName = (o: DbObject) =>
    o.name.slice(prefix.length).split("/").filter(Boolean)[0] ?? o.name;

  const filteredFolders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return folders;
    return folders.filter(f => childName(f).toLowerCase().includes(q));
  }, [folders, searchTerm]);

  const filteredFiles = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return files;
    return files.filter(f => childName(f).toLowerCase().includes(q));
  }, [files, searchTerm]);

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

  useEffect(() => {
    const div = foldersRef.current;
    if (!div) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      div.scrollLeft += e.deltaY;
    };

    div.addEventListener('wheel', handleWheel);
    return () => div.removeEventListener('wheel', handleWheel);
  }, []);

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
                    <div
                      className='flex items-center gap-1' 
                      key={Math.random()}
                    >
                      <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                          <Link href={`${pathname}?page=files&path=${linkToFolder(p)}`}>{p}</Link>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                    </div>
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

        <div className='flex flex-col gap-8'>
          <div>
            <h1 className='text-2xl font-semibold mb-4'>Folders</h1>
            {filteredFolders.length === 0 ? (
              searchTerm ? (
                <div className="flex flex-col items-center justify-center gap-4 text-center py-8">
                  <Search size={48} className="text-muted-foreground" />
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold">No matching folders</h2>
                    <p className="text-muted-foreground text-sm">
                      No folders match "{searchTerm.trim()}".
                    </p>
                  </div>
                  <Button onClick={() => setSearchTerm("")}>
                    Clear Search
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 text-center py-8">
                  <FolderIcon size={48} className="text-muted-foreground" />
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold">No folders yet</h2>
                    <p className="text-muted-foreground text-sm">
                      Create a folder to organize your files
                    </p>
                  </div>
                  <Button onClick={() => setCreateFolderOpen(true)}>
                    Create Folder
                  </Button>
                </div>
              )
            ) : (
              <div 
                ref={foldersRef}
                className='flex gap-2 overflow-x-auto scrollbar-hide p-2 mb-7'
              >
                {filteredFolders.map((folder) => (
                  <FolderCard 
                    key={`folder:${folder.id}`} 
                    name={childName(folder)} 
                  />
                ))}
              </div>
            )}
          </div>
          
          <div className='fullscreen'>
            <h1 className='text-2xl font-semibold mb-4'>Files</h1>
            {filteredFiles.length === 0 ? (
              searchTerm ? (
                <div className="flex flex-col items-center justify-center gap-4 text-center py-8">
                  <Search size={48} className="text-muted-foreground" />
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold">No matching files</h2>
                    <p className="text-muted-foreground text-sm">
                      No files match "{searchTerm.trim()}".
                    </p>
                  </div>
                  <Button onClick={() => setSearchTerm("")}>
                    Clear Search
                  </Button>
                </div>
              ) : (
                <div className="fullscreen flex flex-col items-center justify-center gap-4 text-center py-8">
                  <FileTextIcon size={48} className="text-muted-foreground" />
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold">No files yet</h2>
                    <p className="text-muted-foreground text-sm">
                      Upload a file to get started
                    </p>
                  </div>
                  <Button onClick={onPickFile}>
                    Upload File
                  </Button>
                </div>
              )
            ) : (
              <div className='flex items-center gap-2 flex-wrap'>
                {filteredFiles.map((file) => {

                  const metadata = JSON.parse(file.metadata as string);
                  const metadataObj = Array.isArray(metadata) ? metadata[0] : metadata;
                

                  return (
                    <FileCard
                      key={`file:${file.id}`}
                      name={childName(file)}
                      createdAt={new Date(metadataObj.timeCreated)}
                      size={formatGCSFileSize(metadataObj.size)}
                      type={metadataObj.contentType}
                      id={file.id}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
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

export default FoldersPage;

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
  const [urlValidLength, setGetUrlValidLength] = useState("")
  const [selectedTimeFrame, setSelectedTimeFrame] = useState("days")

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const projectId = pathname.split("/")[2]

  const { mutate: download, isPending: isDownloadPending } = useMutation({
    mutationFn: async () => {
      const result = await downloadObject(`${projectId}/${searchParams.get("path")}/${name}`)

      const blob = new Blob([result.data.buffer as ArrayBuffer], { type: result.fileType });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;


      a.download = `${name}`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast.success("Download Successful", { id:"download" });
      setIsGetUrlOpen(false)
      setGetUrlValidLength("")
      setSelectedTimeFrame('days')
    },
    onMutate(variables, context) {
      toast.loading("Downloading...", { id: "download" })
    },
    onError: (error) => {
      console.log("Error details:", error);
      if (error.message === 'NEXT_REDIRECT') {
        toast.success("Item Downloaded", { id:"download" });
        setIsGetUrlOpen(false)
        setGetUrlValidLength("")
        setSelectedTimeFrame('days')
        return;
      }
      toast.error("Failed to download item", { id:"download" })
    }
  })

  const { mutate: getUrl, isPending: isGetUrlPending } = useMutation({
    mutationFn: async () => {
      let millisecondsTimeframe = 0

      switch (selectedTimeFrame) {
        case "days":
          millisecondsTimeframe = Number(urlValidLength) * 86_400_000
          break
        case "weeks":
          millisecondsTimeframe = Number(urlValidLength) * 604_800_000
          break
        case "months":
          millisecondsTimeframe = Number(urlValidLength) * 2_629_746_000
          break
        case "years":
          millisecondsTimeframe = Number(urlValidLength) * 31_556_952_000
          break
        default:
          throw new Error("Invalid time frame")
      }

      const result = await getURL(`${projectId}/${searchParams.get("path")}/${name}`, millisecondsTimeframe)

      navigator.clipboard.writeText(result)
    },
    onSuccess: () => {
      toast.success("URL copied to clipboard", { id:"get-url" });
      setIsGetUrlOpen(false)
      setGetUrlValidLength("")
      setSelectedTimeFrame("days")
    },
    onMutate(variables, context) {
      toast.loading("Getting URL...", { id:"get-url" })
    },
    onError: (error) => {
      console.log("Error details:", error);
      if (error.message === 'NEXT_REDIRECT') {
        toast.success("URL copied to clipboard", { id:"get-url" });
        setIsGetUrlOpen(false)
        setGetUrlValidLength("")
        setSelectedTimeFrame("days")
        return;
      }
      toast.error("Failed to get URL", { id:"get-url" })
    }
  })

  const { mutate: deleteItem } = useMutation({
    mutationFn: async () => {
      deleteObject(`${projectId}/${searchParams.get("path")}/${name}`, id)
    },
    onSuccess: () => {
      toast.success("Object Deleted", { id:"delete-object" });
      setIsGetUrlOpen(false)
      setGetUrlValidLength("")
      setSelectedTimeFrame("days")
    },
    onMutate(variables, context) {
      toast.loading("Deleting Object", { id:"delete-object" })
    },
    onError: (error) => {
      console.log("Error details:", error);
      if (error.message === 'NEXT_REDIRECT') {
        toast.success("Object deleted", { id:"delete-object" });
        setIsGetUrlOpen(false)
        setGetUrlValidLength("")
        setSelectedTimeFrame("days")
        return;
      }
      toast.error("Failed to delete object", { id:"delete-object" })
    }
  })



  const Icon = fileEndingToIcon[ending] ?? FileTextIcon

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger className='w-sm min-w-sm max-w-sm'>
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
          <ContextMenuItem 
            className='flex items-center gap-2' 
            onClick={e => {
              e.stopPropagation()
              setIsGetUrlOpen(true)
            }}
          >
            <LinkIcon className='w-4 h-4'/>
            Get URL
          </ContextMenuItem>
          <ContextMenuItem 
            className='flex items-center gap-2' 
            onClick={() => setIsNameEditOpen(true)}
          >
            <EditIcon className='w-4 h-4'/>
            Rename
          </ContextMenuItem>
          <ContextMenuItem className='flex items-center gap-2'>
            <ArrowUpRightFromSquare className='w-4 h-4'/>
            Move
          </ContextMenuItem>
          <ContextMenuItem 
            className='flex items-center gap-2' 
            onClick={() => download()}
          >
            <DownloadIcon className='w-4 h-4'/>
            Download
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem 
            className='flex items-center gap-2'
            onClick={() => setIsDeleteDialogOpen(true)}
          >
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

      <Dialog
        open={isGetUrlOpen}
        onOpenChange={setIsGetUrlOpen}
      >
        <form
          onSubmit={e => {
            e.preventDefault()
            getUrl()
          }}
        >
          <DialogContent>
            <CustomDialogHeader 
              icon={LinkIcon}
              title='Get a URL for this resource'
            />

            <div className='flex items-center gap-2 m-2'>
              
              <Input
                min={1}
                placeholder='Usable For...'
                value={urlValidLength}
                onKeyDown={e => {
                if (e.key === "Enter" && !isGetUrlPending && urlValidLength !== "" && Number(urlValidLength) > 0) {
                    e.preventDefault()
                    getUrl()
                  }
                }}
                onChange={e => setGetUrlValidLength(e.target.value)} 
                id="name"
                type="number"
              />
   
              <Select
                value={selectedTimeFrame}
                onValueChange={setSelectedTimeFrame}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Time"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days">Days</SelectItem>
                  <SelectItem value="weeks">Weeks</SelectItem>
                  <SelectItem value="months">Months</SelectItem>
                  <SelectItem value="years">Years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button
                  variant={'outline'}
                >
                  Cancel
                </Button>
              </DialogClose>

              <Button type='submit' disabled={isGetUrlPending || urlValidLength === "" || Number(urlValidLength) <= 0}>
                {!isGetUrlPending && "Proceed"}
                {isGetUrlPending && <Loader2 className='animate-spin' />}
              </Button>
            </DialogFooter>
          </DialogContent>
        </form>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm delete {name}</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className='bg-indigo-500 text-white'
              onClick={e => {
                deleteItem()
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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