"use client";

import CustomDialogHeader from '@/components/CustomDialogHeader';
import TextInputDialog from '@/components/TextInputDialog';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '@/components/ui/context-menu';
import { Dialog, DialogClose, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { mimeTypeToIcon } from '@/lib/constants';
import { childName, formatGCSFileSize } from '@/lib/utils';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeftIcon, ArrowUpRightFromSquare, ArrowUpRightFromSquareIcon, BookTypeIcon, CloudUploadIcon, DownloadIcon, EditIcon, FileArchive, FileArchiveIcon, FileTextIcon, FolderIcon, FolderPlusIcon, Heading1, HeadphonesIcon, ImageIcon, Inbox, InboxIcon, LinkIcon, Loader2, LucideIcon, Search, Trash2Icon, VideoIcon, XIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { ChangeEvent, Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import CreateFolderDialog from '../dialogs/CreateFolderDialog';
import MoveObjectSheet from '../sheets/MoveSheet';
import { Checkbox } from '@/components/ui/checkbox';
import { downloadFolder, deleteFolder } from '@/lib/actions/storage/files/folder';
import { getFolderData } from '@/lib/actions/storage/files/folder/cache-actions';
import { uploadFile, downloadObject, deleteObject, renameObject, getURL, downloadSelected } from '@/lib/actions/storage/files/object';
import { FileObject } from '@/lib/types';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';


type Props = {
  bucketName: string,
  folderData: Awaited<ReturnType<typeof getFolderData>>
}

const FoldersPage = (props: Props) => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  
  type MediaTypes = "image" | "audio" | "video" | "text" | "application"

  const mediaTypeToIcon = (t: MediaTypes): LucideIcon => {
    switch (t) {
      case "application":
        return FileArchiveIcon
      case "audio":
        return HeadphonesIcon
      case "image":
        return ImageIcon
      case "text":
        return FileTextIcon
      case "video":
        return VideoIcon
    }
  }

  const MediaTypesList = ["image", "audio", "video", "text", "application"] as MediaTypes[]

  const inputRef = useRef<HTMLInputElement | null>(null);
  const foldersRef = useRef<HTMLDivElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const [filteredType, setFilteredType] = useState<MediaTypes[]>(MediaTypesList)

  const projectId = pathname.split("/")[2]
  const currentPath = searchParams.get("path") as string;

  const [searchTerm, setSearchTerm] = useState("")
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [open, setOpen] = useState(false)

  const [moveSheetOpen, setMoveSheetOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")

  const [selectedObjects, setSelectedObjects] = useState<FileObject[]>([])

  const { mutate: downl } = useMutation({
    mutationFn: async () => {
      const result = await downloadSelected(projectId, selectedObjects)
      const url = URL.createObjectURL(result);

      const a = document.createElement("a");
      a.href = url;


      a.download = "clobber-files.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    },
    onMutate: () => { toast.loading("Downloading...", { id: "download-selected" }) },
    onSuccess: () => { toast.success("Files Downloaded", { id: "download-selected" }) },
    onError: (e) => { toast.error(`Failed to download: ${e}`, { id: "download-selected" }) }
  })

  const { mutate: deleteSelected } = useMutation({
    mutationFn: async () => {
      await Promise.all(selectedObjects.map(async f => await deleteObject(f.id, projectId)))
    },
    onMutate: () => { toast.loading("Deleting...", { id: "delete-selected" }) },
    onSuccess: () => { toast.success("Files deleted", { id: "delete-selected" }) },
    onError: (e) => { toast.error(`Failed to delete: ${e}`, { id: "delete-selected" }) }
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

  const files = useMemo(() => {
    return props.folderData.filter(f => !f.name.endsWith(".placeholder"))
  }, [props.folderData, projectId, currentPath])

  const folders = useMemo(() => {
    return props.folderData.filter(f => f.name.endsWith(".placeholder"))
  }, [props.folderData, projectId, currentPath])

  // MOVED THIS BEFORE useMemo hooks that use it
  const prefix = `${projectId}/${currentPath.replace(/^\/+|\/+$/g, "")}/`;

  const filteredFolders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return folders;
    return folders.filter(f => childName(f, prefix).toLowerCase().includes(q));
  }, [folders, searchTerm]);

    const selectedTypeFilterSet = useMemo(() => {
    return new Set(filteredType)
  }, [filteredType])

  const filteredFiles = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    console.log("@FILES: ", files)
    return files.filter(f => {
      console.log("@@M", f.metadata[0])
      return childName(f, prefix).toLowerCase().includes(q) && selectedTypeFilterSet.has(f.metadata[0]["contentType"].split("/")[0])
    });
  }, [files, searchTerm, selectedTypeFilterSet]);

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
        <div className="flex items-center justify-between pb-4 gap-4">
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
          </div>
        </div>


        <Separator className="mb-6" />

          {selectedObjects.length > 0 ? (
                <div className='flex items-center gap-6 rounded-full fullwidth bg-indigo-500 text-white px-3 m-2 p-0.5 mb-6'>
                  <div className='flex items-center gap-1'>
                    <Button
                      variant={'ghost'}
                      className='h-6 w-6'
                      onClick={() => setSelectedObjects([])}
                    >
                      <XIcon className='w-3 h-3'/>
                    </Button>
                    <p className='text-white'>{selectedObjects.length} items selected</p>
                  </div>

                  <div className='flex items-center gap-0!'>
                    <Button
                      variant={'ghost'}
                      className='flex items-center gap-2'
                      onClick={() => downl()}
                    >
                      <DownloadIcon className='w-3 h-3'/>
                      Download
                    </Button>
                    <Button
                      variant={'ghost'}
                      className='flex items-center gap-2'
                      onClick={() => setMoveSheetOpen(true)}
                    >
                      <ArrowUpRightFromSquareIcon className='w-3 h-3'/>
                      Move
                    </Button>
                    <Button
                      variant={'ghost'}
                      className='flex items-center gap-2'
                      onClick={() => deleteSelected()}
                    >
                      <Trash2Icon className='w-3 h-3'/>
                      Delete
                    </Button>
                  </div>

                </div>
              ) : (
                <div className='flex items-center gap-2 m-2 p-0.5 mb-6'>

                        <Input
                      disabled={props.folderData.length === 0}
                      className={`max-w-3xs ${props.folderData.length === 0 && "cursor-not-allowed"}`}
                      placeholder='Search for resources' 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                  />

                  <DropdownMenu>
                    <DropdownMenuTrigger 
                      asChild
                      disabled={props.folderData.length === 0}
                      className='relative'
                    >
                      <Button
                        variant={"outline"}
                        className='flex items-center gap-2 relative'
                      >
                        <BookTypeIcon className='w-6 h-6'/>
                        File Types
                        <div className={`${MediaTypesList.length === filteredType.length && "hidden"} absolute -top-1 -right-1 w-5 h-5 bg-white text-black text-xs rounded-full flex items-center justify-center shadow-lg border-2 border-background`}> 
                          {Math.abs(filteredType.length - MediaTypesList.length)} 
                        </div> 
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='start' className='w-xs min-w-xs max-w-xs' onClick={e => e.preventDefault()}>
                      <DropdownMenuGroup>
                        <DropdownMenuLabel className='flex items-center fullwidth justify-between'>
                          <h3>File Types to Show</h3>
                          <Button
                            variant={"ghost"}
                            onClick={() => {
                              if (MediaTypesList.length === filteredType.length) {
                                setFilteredType([])
                              } else {
                                setFilteredType(MediaTypesList as MediaTypes[])
                              }
                            }}
                          >
                            {MediaTypesList.length === filteredType.length ? "Deselect All" : "Select All"}
                          </Button>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {MediaTypesList.map(m => {

                          const Icon = mediaTypeToIcon(m)

                          return (
                            <DropdownMenuCheckboxItem
                              onSelect={e => e.preventDefault()} 
                              className='flex items-center justify-between group'
                              key={m} 
                              checked={selectedTypeFilterSet.has(m as MediaTypes)}
                              onCheckedChange={checked => {
                                if (checked) {
                                  setFilteredType(p => [...p, m as MediaTypes])
                                } else {
                                  setFilteredType(p => p.filter(v => v !== m))
                                }
                              }}
                            >
                              <div className='flex items-center gap-2'>
                                <Icon />
                                <h1>{m}</h1>
                              </div>

                              <span
                                className='hidden group-hover:block text-muted-foreground cursor-pointer'
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setFilteredType([m as MediaTypes])
                                }}
                              >
                                Only
                              </span>
                            </DropdownMenuCheckboxItem>

                          )
                        })}
                      </DropdownMenuGroup>
                      
                      
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

        {searchTerm.length !== 0 && filteredFiles.length === 0 && filteredFolders.length === 0 && (
          <div className="fullscreen flex-1 flex flex-col items-center justify-center gap-4 text-center py-8">
            <Search size={48} className="text-muted-foreground" />
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">No matching files</h2>
              <p className="text-muted-foreground text-sm">
                No items match "{searchTerm.trim()}".
              </p>
            </div>
            <Button onClick={() => setSearchTerm("")}>
              Clear Search
            </Button>
          </div>
        )}

        {searchTerm.length === 0 && props.folderData.length === 0 && (
          <div className="fullscreen flex-1 flex flex-col items-center justify-center gap-4 text-center py-8">
            <InboxIcon size={48} className="text-muted-foreground" />
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">This folder is empty</h2>
              <p className="text-muted-foreground text-sm">
                No items inside "{props.bucketName}".
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <Button
                className="flex items-center gap-2"
                variant="outline"
                onClick={onPickFile}
                disabled={isUploadPending}
              >
                <CloudUploadIcon className="w-6 h-6" />
                Upload
              </Button>
              <Button
                className='flex items-center gap-2'
                variant={"outline"}
                onClick={() => setCreateFolderOpen(true)}
              >
                <FolderPlusIcon className='w-6 h-6'/>
                Create Folder
              </Button>
            </div>
          </div>
        )}

        <div className='flex flex-col m-2 gap-8'>
          <div>
            <div 
              ref={foldersRef}
              className='flex gap-2 overflow-x-auto scrollbar-hide'
            >
              {filteredFolders.map((folder) => (
                <FolderCard 
                  key={`folder:${folder.id}`} 
                  object={folder}
                />
              ))}
            </div>
          </div>
          
          <div className='fullscreen'>
              <div className='flex items-center gap-2 flex-wrap'>
                {filteredFiles.map((file) => {

                  console.log("@RENDERED FILE: ", typeof file.created_at)

                  if (typeof file.created_at === 'object') {

                    file.created_at = file.created_at.toLocaleDateString()
                    file.last_accessed_at = file.last_accessed_at.toLocaleDateString()
                    file.updated_at = file.updated_at.toLocaleDateString()
                  }

                
                  return (
                    <FileCard
                      selectedObjects={selectedObjects}
                      setSelectedObjects={setSelectedObjects}
                      key={`file:${file.id}`}
                      object={file}
                    />
                  );
                })}
              </div>
          </div>
        </div>
      </div>

      <CreateFolderDialog 
        createFolderOpen={createFolderOpen}
        setCreateFolderOpen={setCreateFolderOpen}
        projectId={projectId}
        newFolderName={newFolderName}
        setNewFolderName={setNewFolderName}
        path={currentPath}
      />

      <MoveObjectSheet 
        moveSheetOpen={moveSheetOpen}
        setMoveSheetOpen={setMoveSheetOpen}
        objects={selectedObjects}
        projectId={projectId}
      />
    </>
  )
}

export default FoldersPage;

function FileCard({
  object,
  selectedObjects,
  setSelectedObjects
}: {
  object: FileObject,
  selectedObjects: FileObject[],
  setSelectedObjects: Dispatch<SetStateAction<FileObject[]>>
}) {
  const fileMetadata = object.metadata[0]

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const projectId = pathname.split("/")[2]

  const currentPath = searchParams.get("path") as string

  const prefix = `${projectId}/${currentPath.replace(/^\/+|\/+$/g, "")}/`;
  
  const [isNameEditOpen, setIsNameEditOpen] = useState(false);
  const [newObjectName, setNewObjectName] = useState(childName(object, prefix))

  const [isMoveOpen, setIsMoveOpen] = useState(false)

  const [isGetUrlOpen, setIsGetUrlOpen] = useState(false)
  const [urlValidLength, setGetUrlValidLength] = useState("")
  const [selectedTimeFrame, setSelectedTimeFrame] = useState("days")

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)


  const { mutate: download, isPending: isDownloadPending } = useMutation({
    mutationFn: async () => {
      const result = await downloadObject(`${prefix}${childName(object, prefix)}`)

      const blob = new Blob([result.data.buffer as ArrayBuffer], { type: result.fileType });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;


      a.download = `${childName(object, prefix)}`;
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

      const result = await getURL(`${prefix}${childName(object, prefix)}`, millisecondsTimeframe)

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
      deleteObject(object.id, projectId)
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

  useEffect(() => {
    console.log("@@SELECTEDOBJECTS: ", selectedObjects)
  }, [selectedObjects])


  const Icon = mimeTypeToIcon[fileMetadata['contentType']] ?? FileTextIcon

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger className='w-sm min-w-sm max-w-sm'>
          <div className='group flex flex-col gap-6 rounded-xl border bg-background p-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md hover:border-foreground/20'>
            <div className="min-w-0 flex items-center justify-between">
              <div className="group flex items-center gap-2 max-w-3xs">
                {selectedObjects.includes(object) ? (
                  <Checkbox
                    defaultChecked={selectedObjects.includes(object)} 
                    className='bg-indigo-500! text-white! w-6 h-6'
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedObjects(p => [...p, object])
                      } else {
                        setSelectedObjects(p => p.filter(o => o.id !== object.id))
                      }
                    }}
                  />
                ) : (
                  <>
                  <Icon className="group-hover:hidden h-6 w-6 text-muted-foreground" />
                  <Checkbox
                    defaultChecked={selectedObjects.includes(object)} 
                    className='hidden w-6 h-6 group-hover:inline'
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedObjects(p => [...p, object])
                      } else {
                        setSelectedObjects(p => p.filter(o => o.id !== object.id))
                      }
                    }}
                  />
                  </>
                )}
                
                <h3 className='truncate'>{childName(object, prefix)}</h3>
              </div>

              <h2 className='text-muted-foreground'>{formatGCSFileSize(fileMetadata['size'])}</h2>
            </div>

            <footer className='truncate fullwidth flex justify-between items-center text-muted-foreground text-sm'>
              {object.created_at}
              <h3 className='truncate max-w-56'>{fileMetadata['contentType']}</h3>
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
          <ContextMenuItem 
            className='flex items-center gap-2'
            onClick={() => setIsMoveOpen(true)}
          >
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
        actionArgs={[projectId, object.id, `${prefix}${childName(object, prefix)}`, newObjectName]}
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
            <AlertDialogTitle>Confirm delete {childName(object, prefix)}</AlertDialogTitle>
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

      <MoveObjectSheet 
        moveSheetOpen={isMoveOpen}
        setMoveSheetOpen={setIsMoveOpen}
        objects={[object]}
        projectId={projectId}
      />
    </>
  )
}

function FolderCard({
  object
}: {
  object: FileObject
}) {
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const projectId = pathname.split("/")[2]

  const currentPath = searchParams.get("path") as string

  const prefix = `${projectId}/${currentPath.replace(/^\/+|\/+$/g, "")}/`;

  const constructNextPathname = () => {
    const sp = new URLSearchParams(searchParams)
    const curPath = sp.get("path")
    return curPath + `/${childName(object, prefix)}`
  }

  const { mutate: download, isPending: isDownloadPending } = useMutation({
    mutationFn: async () => {
      const result = await downloadFolder(projectId, `${prefix}${childName(object, prefix)}`);

      // Create download link
      const url = URL.createObjectURL(result);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${childName(object, prefix)}.zip`;  // Add .zip extension
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast.success("Download Successful", { id:"download" });
    },
    onMutate(variables, context) {
      toast.loading("Downloading...", { id: "download" })
    },
    onError: (error) => {
      console.log("Error details:", error);
      if (error.message === 'NEXT_REDIRECT') {
        toast.success("Item Downloaded", { id:"download" });
        return;
      }
      toast.error("Failed to download item", { id:"download" })
    }
  })

  const { mutate: deleteItem } = useMutation({
    mutationFn: async () => {
      deleteFolder(projectId, `${currentPath}/${childName(object, prefix)}`)
    },
    onSuccess: () => {
      toast.success("Folder Deleted", { id:"delete-folder" });
    },
    onMutate(variables, context) {
      toast.loading("Deleting folder...", { id:"delete-folder" })
    },
    onError: (error) => {
      console.log("Error details:", error);
      if (error.message === 'NEXT_REDIRECT') {
        toast.success("Folder deleted", { id:"delete-folder" });
        return;
      }
      toast.error("Failed to delete folder", { id:"delete-folder" })
    }
  })

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const [isNameEditOpen, setIsNameEditOpen] = useState(false)
  const [newObjectName, setNewObjectName] = useState("")



  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <Link
            href={`${pathname}?page=files&path=${constructNextPathname()}`}
            className="group rounded-xl border bg-background p-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md hover:border-foreground/20 w-md min-w-md max-w-md"
          >
            <div className="min-w-0">
              <div className="group flex items-center gap-2">
                <FolderIcon className="h-6 w-6 text-muted-foreground" />
                <h3>{childName(object, prefix)}</h3>
              </div>
            </div>
          </Link>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem 
            className='flex items-center gap-2'
            onClick={() => setIsNameEditOpen(true)}
          >
            <EditIcon className='w-6 h-6' />
            Rename
          </ContextMenuItem>
          <ContextMenuItem 
            className='flex items-center gap-2'
            onClick={() => download()}
          >
            <DownloadIcon className='w-6 h-6' />
            Download
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem 
            className='flex items-center gap-2'
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2Icon className='w-6 h-6' />
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
        headerTitle='Rename Folder'
        toastId='rename-folder'
        successMessage='Folder renamed'
        loadingMessage='Renaming...'
        errorMessage='Failed to rename folder'
        actionArgs={[projectId, object.id, `${prefix}${childName(object, prefix)}`, newObjectName]}
      />
      
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm delete {childName(object, prefix)}</AlertDialogTitle>
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