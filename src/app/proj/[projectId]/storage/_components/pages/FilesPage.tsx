"use client";

import CustomDialogHeader from "@/components/CustomDialogHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogFooter, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { createBucket } from "@/lib/actions/storage/files/actions";
import { getBucketNames } from "@/lib/actions/storage/files/cache-actions";
import { cn, formatGCSFileSize } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { BoxIcon, FunctionSquare, FunctionSquareIcon, GlobeIcon, InboxIcon, Loader2, PackageOpenIcon, Search } from "lucide-react"
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import path from "path";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react"
import { toast } from "sonner";

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
      <div className="fullscreen flex flex-col p-8 overflow-y-auto">
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
            className={cn(
              "grid gap-4",
              "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            )}
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

  console.log("size_lim: ", size_lim)

  return (
    <Link
      href={`${pathname}?path=${name}`}
      className="flex flex-col gap-2 group rounded-xl border bg-background p-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md hover:border-foreground/20"
    >
      <div className="min-w-0 flex items-center justify-between">
        <div className="group flex items-center gap-2">
          <BoxIcon className="h-6 w-6 text-muted-foreground" />
          <h3 className="font-bold text-2xl">{name}</h3>
        </div>

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
      </div>

      <Separator />

      <p>Size Cap: {!size_lim ? "None" : formatGCSFileSize(size_lim)}</p>
      <p className="truncate">Supported Types: {supported_types ? supported_types.join(", ") : 'all'}</p>
    </Link>
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
  const [allowedTypesError, setAllowedTypesError] = useState(false)

  useEffect(() => {
    if (allowedTypes.length === 0) {
      setAllowedTypesError(false)
      return
    };

    const parts = allowedTypes.split(", ")

    if (parts.length === 0) {
      setAllowedTypesError(false)
      return
    }

    if (!parts.every(p => p.includes("/"))) {
      setAllowedTypesError(true)
    } else {
      setAllowedTypesError(false)
    }
  }, [allowedTypes])

  const existingBucketsSet = useMemo(() => {
    return new Set(existingBuckets)
  }, [existingBuckets])

  const [isPublic, setIsPublic] = useState(false)
  const [isRestrictedSize, setIsRestrictedSize] = useState(false)
  const [isRestrictedTypes, setIsRestrictedTypes] = useState(false)

  const [sizeLimit, setSizeLimit] = useState(0)
  const [sizeLimitUnit, setSizeLimitUnit] = useState<SizeLimitUnit>("MB")

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
                placeholder="Universally Unique name"
              />

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
                    <Input 
                      id="sz-limit"
                      type="number" // Added for better number input
                      value={sizeLimit || ""} // Fixed: Handle 0 properly
                      placeholder="0"
                      onChange={e => {
                        const val = e.target.value;
                        setSizeLimit(val ? Number(val) : 0); // Fixed: Always set a number
                      }}
                    />

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
                    <Label className="fullwidth flex items-center justify-between" htmlFor="mime-types">
                      <h1>Allowed Types</h1>
                      <p className="text-muted-foreground">Comma separated</p>
                    </Label>
                    <Input
                      className={`${allowedTypesError && "border-red-500! focus:border-red-500! ring-red-500!"}`}
                      id="mime-types" 
                      placeholder="image/jpeg, image/png, audio/mpeg, video/mp4"
                      value={allowedTypes}
                      onChange={e => setAllowedTypes(e.target.value)}
                    />
                    {allowedTypesError && (
                      <p className="text-red-500 text-sm">Must be comma seperated & include a slash</p>
                    )}
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

              <Button onClick={() => mutate()} disabled={isPending || existingBucketsSet.has(name) || name.length < 5}>
                {!isPending && "Proceed"}
                {isPending && <Loader2 className='animate-spin' />}
              </Button>
            </DialogFooter>
          </DialogContent>
        </form>
      </Dialog>
  )
}