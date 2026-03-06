"use client";

import CustomDialogHeader from "@/components/CustomDialogHeader";
import { MultiSelectCombobox } from "@/components/MultiSelectCombobox";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogFooter, DialogClose, DialogContent } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { createBucket, deleteBucket, editBucket } from "@/lib/actions/storage/files/actions";
import { getBucketNames } from "@/lib/actions/storage/files/cache-actions";
import { FILE_FORMATS } from "@/lib/constants";
import { createFileBucketSchema } from "@/lib/types/schemas";
import { cn, formatGCSFileSize } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { BoxIcon, Edit2Icon, EditIcon, EllipsisVerticalIcon, FlagIcon, FunctionSquare, FunctionSquareIcon, GlobeIcon, InboxIcon, Loader2, PackageOpenIcon, Search, Trash2Icon } from "lucide-react"
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react"
import { toast } from "sonner";
import z from "zod";

type Props = {
  projectId: string,
  bucketDetails: Awaited<ReturnType<typeof getBucketNames>>
}

const FilesPage = (props: Props) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [open, setOpen] = useState(false)
  const [newBucketName, setNewBucketName] = useState("")

  const pathname = usePathname()

  const projectId = pathname.split('/')[2]
  
  const filteredBuckets = useMemo(() => {
    if (!props.bucketDetails) return [];

    const q = searchTerm.trim().toLowerCase();
    if (!q) return props.bucketDetails;

    return props.bucketDetails.filter(b => b.name.toLowerCase().includes(q))
  }, [searchTerm, props.bucketDetails])

  const showEmptySchemaState = !searchTerm && (props.bucketDetails?.length ?? 0) === 0;
  const showNoMatchesState = !!searchTerm && filteredBuckets.length === 0;

  

  return (
    <>
      <div className="fullscreen flex flex-col p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-bold text-3xl">File Buckets</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Botomless pits to put any kind of data.
            </p>
          </div>

          <Button
            variant={"default"}
            onClick={() => setOpen(true)}
          >
            Create Bucket
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-8 mb-4 justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 w-full sm:w-72"
                placeholder="Search buckets"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

          </div>

          <div className="text-xs text-muted-foreground">
            {`${filteredBuckets.length} bucket${filteredBuckets.length === 1 ? "" : "s"}`}
          </div>
        </div>

        <Separator className="mb-6" />

        {showEmptySchemaState ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center">
            <InboxIcon size={96} className="text-muted-foreground" />
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold">No buckets in yet</h2>
              <p className="text-muted-foreground text-sm">
                Create your first bucket to start storing user data
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
          <div
            className="flex flex-col fullscreen flex-1 overflow-y-auto gap-4"
          >
            {filteredBuckets.map(f => (
              <BucketCard
                projectId={projectId}
                createdAt={f.created_at}
                id={f.id}
                name={f.name}
                key={f.id}
                is_public={f.is_public}
                size_lim={f.size_lim_bytes}
                supported_types={f.allowed_types}
              />
            ))}
        </div>
      )}
      </div>

      <CreateBucketDialog 
        projectId={projectId}
        existingBuckets={props.bucketDetails.map(b => b.name)}
        onOpenChange={setOpen}
        open={open}
      />

      
    </>
  )
}

export default FilesPage

function BucketCard({
  projectId,
  id,
  name,
  createdAt,
  is_public,
  supported_types,
  size_lim
}: {
  projectId: string,
  id: string,
  name: string,
  createdAt: any,
  is_public: boolean,
  supported_types: string[],
  size_lim: bigint
}) {
  const pathname = usePathname()

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const {mutate:delB} = useMutation({
    mutationFn: () => deleteBucket(projectId, name, id),
    onMutate: () => toast.loading(`Deleting '${name}'...`, {id: "del-bucket"}),
    onSuccess: () => toast.success(`'${name}' deleted`, {id: "del-bucket"}),
    onError: (e) => toast.error(`Failed to delete '${name}': ${e}`, {id: "del-bucket"}),
  })


  return (
    <>
    
      <Link
        href={`${pathname}?path=${name}`}
        className="flex flex-col gap-2 group rounded-xl border bg-background p-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md hover:border-foreground/20"
      >
        <div className="min-w-0 flex items-center justify-between">
          <div className="group flex items-center justify-between gap-2 fullwidth">
            <div className="flex items-center gap-2">
              <BoxIcon className="h-6 w-6 text-muted-foreground" />
              <h3 className="font-bold text-2xl">{name}</h3>
            </div>

            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    {is_public && <GlobeIcon className="h-6 w-6"/>}
                  </TooltipTrigger>
                  <TooltipContent>
                    This bucket can be accessed by anyone without authentication
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <EllipsisVerticalIcon 
                    className="w-5 h-5"

                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    className="flex items-center gap-2"
                    onClick={e => {
                      e.stopPropagation()
                      setIsEditOpen(true)
                    }}
                  >
                    <Edit2Icon className="w-5 h-5"/>
                    Edit Bucket
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="flex items-center gap-2"
                    onClick={e => {
                      e.stopPropagation()
                      setConfirmDelete(true)
                    }}
                  >
                    <Trash2Icon className="w-5 h-5"/>
                    Delete Bucket
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
            </div>
          </div>
        </div>

        <Separator />

        <p>Size Cap: {!size_lim ? "None" : formatGCSFileSize(size_lim)}</p>
        <p className="truncate">Supported Types: {supported_types ? supported_types.join(", ") : 'all'}</p>
      </Link>

      <AlertDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete '{name}' and all its items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              onClick={() => delB()}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditBucketDialog 
        onOpenChange={setIsEditOpen}
        open={isEditOpen}
        id={id}
        projectId={projectId}
        bucket={{
          name,
          allowed_types: supported_types,
          is_public,
          file_size_limit: size_lim
        }}
      />
    </>
  )
}

function CreateBucketDialog({
  open,
  onOpenChange,
  existingBuckets,
  projectId
}: {
  open: boolean,
  onOpenChange: Dispatch<SetStateAction<boolean>>,
  existingBuckets: string[],
  projectId: string
}) {

  type SizeLimitUnit = "bytes" | "KB" | "MB" | "GB";

  const sizeLimitUnitOptions: SizeLimitUnit[] = [
    "bytes",
    "KB", 
    "MB",
    "GB"
  ];

  // Helper function to convert size to bytes
  const convertToBytes = (size: number, unit: SizeLimitUnit): bigint => {
    switch (unit) {
      case "bytes": return BigInt(size);
      case "KB": return BigInt(size) * BigInt(1024);
      case "MB": return BigInt(size) * BigInt(1024 * 1024);
      case "GB": return BigInt(size) * BigInt(1024 * 1024 * 1024);
      default: return BigInt(0);
    }
  };

  const [name, setName] = useState("");
  const [allowedTypes, setAllowedTypes] = useState("")
  const [nameExistsErr, setNameExistsErr] = useState(false)

  const existingBucketsSet = useMemo(() => {
    return new Set(existingBuckets)
  }, [existingBuckets])

  const [isPublic, setIsPublic] = useState(false)
  const [isRestrictedSize, setIsRestrictedSize] = useState(false)
  const [isRestrictedTypes, setIsRestrictedTypes] = useState(false)

  const [sizeLimit, setSizeLimit] = useState(12)
  const [sizeLimitUnit, setSizeLimitUnit] = useState<SizeLimitUnit>("MB")
  const [sizeLimitErr, setSizeLimitErr] = useState(false)

  // Convert sizeLimit to bytes whenever sizeLimit or sizeLimitUnit changes
  const sizeLimitInBytes = useMemo(() => {
    if (!isRestrictedSize || sizeLimit === 0) return BigInt(0);
    return convertToBytes(sizeLimit, sizeLimitUnit);
  }, [sizeLimit, sizeLimitUnit, isRestrictedSize]);

  const { mutate, isPending } = useMutation({
    mutationFn: () => createBucket({
      name,
      allowed_types: isRestrictedTypes ? allowedTypes.split(", ").filter(Boolean) : [],
      file_size_limit: isRestrictedSize ? sizeLimitInBytes : BigInt(0), // Now properly converted to bytes
      is_public: isPublic
    }, projectId),
    onSuccess: () => {
      toast.success("Bucket Created", { id:"create-bucket" });
      onOpenChange(false);
      setName("")
    },
    onError: (error) => {
      console.log("Error details:", error);
      if (error.message === 'NEXT_REDIRECT') {
        toast.success("bucket Added", { id:"create-bucket" });
        onOpenChange(false);
        return;
      }
      toast.error("Failed to Create bucket", { id:"create-bucket" })
    }
  })

  useEffect(() => {
    if (existingBucketsSet.has(name)) {
      setNameExistsErr(true)
    } else {
      setNameExistsErr(false)
    }
  }, [name])

  useEffect(() => {
    if (isRestrictedSize && sizeLimit === 0) {
      setSizeLimitErr(true)
    } else {
      setSizeLimitErr(false)
    }
  })

  useEffect(() => {
    setAllowedTypes("")
    setIsPublic(false)
    setIsRestrictedSize(false)
    setIsRestrictedTypes(false)
    setName("")
    setNameExistsErr(false)
    setSizeLimit(12)
    setSizeLimitErr(false)
    setSizeLimitUnit("MB")
  }, [open])


  


  return (
    <Dialog
        open={open}
        onOpenChange={onOpenChange}
      >
        <form
          onSubmit={e => {
            e.preventDefault()
            mutate()
          }}
        >
          <DialogContent>
            <CustomDialogHeader 
              icon={PackageOpenIcon}
              title="New File Bucket"
            />

            <div className="flex flex-col gap-2">
              <Label htmlFor="name" className="fullwidth flex items-center justify-between">
                <h1>Name</h1>
                <p className="text-muted-foreground">Name is permanent
                </p>
              </Label>

              <div className="flex flex-col gap-0.5">
                <Input
                  value={name}
                  onKeyDown={e => {
                  if (e.key === "Enter") {
                      e.preventDefault()
                      mutate()
                    }
                  }}
                  onChange={e => setName(e.target.value)} 
                  id="name"
                  className={`${nameExistsErr && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500"}`}
                  placeholder="Universally Unique name"
                />
                {nameExistsErr && (
                  <div className="flex items-center gap-2 text-sm text-red-500">
                    <FlagIcon className="w-4 h-4 stroke-red-500"/>
                    <p>Index with this name already exists</p>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex items-center fullwidth gap-2 text-sm">
                <Switch 
                  checked={isPublic}
                  onCheckedChange={checked => {
                    if (checked) {
                      setIsPublic(true)
                    } else {
                      setIsPublic(false)
                    }
                  }}
                />
                <div className="flex flex-col">
                  <h2>Public</h2>
                  <p className="text-muted-foreground">Allow anyone to use it without authentication</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center fullwidth gap-2 text-sm">
                <Switch 
                  checked={isRestrictedSize}
                  onCheckedChange={checked => {
                    if (checked) {
                      setIsRestrictedSize(true)
                    } else {
                      setIsRestrictedSize(false)
                    }
                  }}
                />
                <div className="flex flex-col">
                  <h2>Restrict File Size</h2>
                  <p className="text-muted-foreground">Limit size of all inputs</p>
                </div>
              </div>

              {isRestrictedSize && (
                <div className="flex flex-col gap-2 mt-2">
                  <Label htmlFor="sz-limit" >Size Limit</Label>
                  <div className="flex items-center gap-2">
                    
                    <div className="flex flex-col gap-0.5 w-full">
                      <Input 
                        id="sz-limit"
                        type="number" // Added for better number input
                        value={sizeLimit || ""} // Fixed: Handle 0 properly
                        placeholder="0"
                        className={`${sizeLimitErr && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500"}`}
                        onChange={e => {
                          const val = e.target.value;
                          setSizeLimit(val ? Number(val) : 0); // Fixed: Always set a number
                        }}
                      />
                      {sizeLimitErr && (
                        <div className="flex items-center gap-2 text-sm text-red-500">
                          <FlagIcon className="w-4 h-4 stroke-red-500"/>
                          <p>Size limit must be greater than zero</p>
                        </div>
                      )}
                    </div>

                    <Select 
                      value={sizeLimitUnit} // Fixed: Controlled value
                      onValueChange={(value: SizeLimitUnit) => setSizeLimitUnit(value)} // Fixed: Proper typing
                    >
                      <SelectTrigger className="w-24! min-w-24! max-w-24!">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {sizeLimitUnitOptions.map(u => (
                            <SelectItem key={u} value={u}>
                              {u}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex flex-col gap-4">
                <div className="flex items-center fullwidth gap-2 text-sm">
                  <Switch 
                    checked={isRestrictedTypes}
                    onCheckedChange={checked => {
                      if (checked) {
                        setIsRestrictedTypes(true)
                      } else {
                        setIsRestrictedTypes(false)
                      }
                    }}
                  />
                  <div className="flex flex-col">
                    <h2>Restrict MIME Types</h2>
                    <p className="text-muted-foreground">Allow certain types to be uploaded</p>
                  </div>
                </div>

                {isRestrictedTypes && (
                  <div className="flex flex-col gap-2">
                
                    <Label>Allowed Types</Label>

                    <MultiSelectCombobox 
                      value={allowedTypes.split(", ")[0] !== "" ? allowedTypes.split(", ") : []}
                      options={FILE_FORMATS}
                      onChange={v => setAllowedTypes(v.join(", "))}
                      className="fullwidth"
                      searchPlaceholder="Search File Types"
                      placeholder="Will deafault to all if none are selected"
                    />
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  variant={'outline'}
                >
                  Cancel
                </Button>
              </DialogClose>

              <Button onClick={() => mutate()} disabled={isPending || nameExistsErr || sizeLimitErr || name.length === 0}>
                {!isPending && "Proceed"}
                {isPending && <Loader2 className='animate-spin' />}
              </Button>
            </DialogFooter>
          </DialogContent>
        </form>
      </Dialog>
  )
}

function EditBucketDialog({
  open,
  onOpenChange,
  projectId,
  bucket,
  id
}: {
  open: boolean,
  onOpenChange: Dispatch<SetStateAction<boolean>>,
  projectId: string
  bucket: z.infer<typeof createFileBucketSchema>,
  id: string;
}) {
  type SizeLimitUnit = "bytes" | "KB" | "MB" | "GB";

  console.log("@BUCKET: ", bucket)

  const sizeLimitUnitOptions: SizeLimitUnit[] = [
    "bytes",
    "KB", 
    "MB",
    "GB"
  ];

  

  function formatBigIntSize(bytes: bigint): { value: number; unit: SizeLimitUnit } {
    let value = Number(bytes);
    let unitIndex = 0;

    // Iterate through units, dividing by 1024 each step
    while (value >= 1024 && unitIndex < sizeLimitUnitOptions.length - 1) {
      value /= 1024;
      unitIndex++;
    }

    return {
      value: parseFloat(value.toFixed(2)), // Keeps 2 decimal places if needed
      unit: sizeLimitUnitOptions[unitIndex]
    };
  }

  const { value: sizeLimValue, unit: sizeLimUnit } = formatBigIntSize(bucket.file_size_limit)

  // Helper function to convert size to bytes
  const convertToBytes = (size: number, unit: SizeLimitUnit): bigint => {
    switch (unit) {
      case "bytes": return BigInt(size);
      case "KB": return BigInt(size) * BigInt(1024);
      case "MB": return BigInt(size) * BigInt(1024 * 1024);
      case "GB": return BigInt(size) * BigInt(1024 * 1024 * 1024);
      default: return BigInt(0);
    }
  };
  const [allowedTypes, setAllowedTypes] = useState(bucket.allowed_types ? bucket.allowed_types.join(", ") : "")


  const [isPublic, setIsPublic] = useState(bucket.is_public)
  const [isRestrictedSize, setIsRestrictedSize] = useState(bucket.file_size_limit !== null)
  const [isRestrictedTypes, setIsRestrictedTypes] = useState(bucket.allowed_types !== null)

  const [sizeLimit, setSizeLimit] = useState(isRestrictedSize ? sizeLimValue : 12)
  const [sizeLimitUnit, setSizeLimitUnit] = useState<SizeLimitUnit>(isRestrictedSize ? sizeLimUnit : "MB")
  const [sizeLimitErr, setSizeLimitErr] = useState(false)

  // Convert sizeLimit to bytes whenever sizeLimit or sizeLimitUnit changes
  const sizeLimitInBytes = useMemo(() => {
    if (!isRestrictedSize || sizeLimit === 0) return BigInt(0);
    return convertToBytes(sizeLimit, sizeLimitUnit);
  }, [sizeLimit, sizeLimitUnit, isRestrictedSize]);

  const { mutate, isPending } = useMutation({
    mutationFn: () => editBucket(
      projectId,
      id,
      bucket,
      {
        name: bucket.name,
        allowed_types: isRestrictedTypes ? allowedTypes.split(", ") : [],
        file_size_limit: isRestrictedSize ? sizeLimitInBytes : BigInt(0),
        is_public: isPublic
      }
    ),
    onSuccess: () => {
      toast.success("Changes Applied", { id:"edit-bucket" });
      onOpenChange(false);
    },
    onError: (error) => {
      console.log("Error details:", error);
      if (error.message === 'NEXT_REDIRECT') {
        toast.success("Changes Applied", { id:"edit-bucket" });
        onOpenChange(false);
        return;
      }
      toast.error(`Failed to apply changes: ${error}`, { id:"edit-bucket" })
    },
    onMutate: () => toast.loading("Applying Changes...", { id:"edit-bucket" })
  })

  useEffect(() => {
    if (isRestrictedSize && sizeLimit === 0) {
      setSizeLimitErr(true)
    } else {
      setSizeLimitErr(false)
    }
  })

  useEffect(() => {
    setAllowedTypes(bucket.allowed_types ? bucket.allowed_types.join(", ") : "")
    setIsPublic(bucket.is_public)
    setIsRestrictedSize(bucket.file_size_limit !== null)
    setIsRestrictedTypes(bucket.allowed_types !== null)
    setSizeLimit(isRestrictedSize ? sizeLimValue : 12)
    setSizeLimitErr(false)
    setSizeLimitUnit(isRestrictedSize ? sizeLimUnit : "MB")
  }, [open])


  


  return (
    <Dialog
        open={open}
        onOpenChange={onOpenChange}
      >
        <form
          onSubmit={e => {
            e.preventDefault()
            mutate()
          }}
        >
          <DialogContent>
            <CustomDialogHeader 
              icon={EditIcon}
              title={`Edit '${bucket.name}'`}
            />

            <div className="flex flex-col gap-2">

              <div className="flex items-center fullwidth gap-2 text-sm">
                <Switch 
                  checked={isPublic}
                  onCheckedChange={checked => {
                    if (checked) {
                      setIsPublic(true)
                    } else {
                      setIsPublic(false)
                    }
                  }}
                />
                <div className="flex flex-col">
                  <h2>Public</h2>
                  <p className="text-muted-foreground">Allow anyone to use it without authentication</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center fullwidth gap-2 text-sm">
                <Switch 
                  checked={isRestrictedSize}
                  onCheckedChange={checked => {
                    if (checked) {
                      setIsRestrictedSize(true)
                    } else {
                      setIsRestrictedSize(false)
                    }
                  }}
                />
                <div className="flex flex-col">
                  <h2>Restrict File Size</h2>
                  <p className="text-muted-foreground">Limit size of all inputs</p>
                </div>
              </div>

              {isRestrictedSize && (
                <div className="flex flex-col gap-2 mt-2">
                  <Label htmlFor="sz-limit" >Size Limit</Label>
                  <div className="flex items-center gap-2">
                    
                    <div className="flex flex-col gap-0.5 w-full">
                      <Input 
                        id="sz-limit"
                        type="number" // Added for better number input
                        value={sizeLimit || ""} // Fixed: Handle 0 properly
                        placeholder="0"
                        className={`${sizeLimitErr && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500"}`}
                        onChange={e => {
                          const val = e.target.value;
                          setSizeLimit(val ? Number(val) : 0); // Fixed: Always set a number
                        }}
                      />
                      {sizeLimitErr && (
                        <div className="flex items-center gap-2 text-sm text-red-500">
                          <FlagIcon className="w-4 h-4 stroke-red-500"/>
                          <p>Size limit must be greater than zero</p>
                        </div>
                      )}
                    </div>

                    <Select 
                      value={sizeLimitUnit} // Fixed: Controlled value
                      onValueChange={(value: SizeLimitUnit) => setSizeLimitUnit(value)} // Fixed: Proper typing
                    >
                      <SelectTrigger className="w-24! min-w-24! max-w-24!">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {sizeLimitUnitOptions.map(u => (
                            <SelectItem key={u} value={u}>
                              {u}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex flex-col gap-4">
                <div className="flex items-center fullwidth gap-2 text-sm">
                  <Switch 
                    checked={isRestrictedTypes}
                    onCheckedChange={checked => {
                      if (checked) {
                        setIsRestrictedTypes(true)
                      } else {
                        setIsRestrictedTypes(false)
                      }
                    }}
                  />
                  <div className="flex flex-col">
                    <h2>Restrict MIME Types</h2>
                    <p className="text-muted-foreground">Allow certain types to be uploaded</p>
                  </div>
                </div>

                {isRestrictedTypes && (
                  <div className="flex flex-col gap-2">
                
                    <Label>Allowed Types</Label>

                    <MultiSelectCombobox 
                      value={allowedTypes.split(", ")[0] !== "" ? allowedTypes.split(", ") : []}
                      options={FILE_FORMATS}
                      onChange={v => setAllowedTypes(v.join(", "))}
                      className="fullwidth"
                      searchPlaceholder="Search File Types"
                      placeholder="Will deafault to all if none are selected"
                    />
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  variant={'outline'}
                >
                  Cancel
                </Button>
              </DialogClose>

              <Button onClick={() => mutate()} disabled={isPending || sizeLimitErr}>
                {!isPending && "Proceed"}
                {isPending && <Loader2 className='animate-spin' />}
              </Button>
            </DialogFooter>
          </DialogContent>
        </form>
      </Dialog>
  )
}