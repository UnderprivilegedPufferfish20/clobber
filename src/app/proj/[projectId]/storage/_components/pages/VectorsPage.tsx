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
import { createIndex } from "@/lib/actions/storage/vectors";
import { getIndexes } from "@/lib/actions/storage/vectors/cache-actions";
import { StorageIndex, VECTOR_INDEX_METRIC, VECTOR_INDEX_TYPE } from "@/lib/types";
import { cn, formatGCSFileSize } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { BoxIcon, FlagIcon, FunctionSquare, FunctionSquareIcon, GlobeIcon, InboxIcon, LibraryBigIcon, Loader2, PackageOpenIcon, Search, SplinePointerIcon, TriangleAlertIcon } from "lucide-react"
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import path from "path";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react"
import { toast } from "sonner";

type Props = {
  projectId: string,
  indexDetails: Awaited<ReturnType<typeof getIndexes>>
}

const VectorsPage = (props: Props) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [open, setOpen] = useState(false)
  const [newIndexName, setNewIndexName] = useState("")

  const pathname = usePathname()

  const projectId = pathname.split('/')[2]
  
  const filteredBuckets = useMemo(() => {
    if (!props.indexDetails) return [];

    const q = searchTerm.trim().toLowerCase();
    if (!q) return props.indexDetails;

    return props.indexDetails.filter(b => b.name.toLowerCase().includes(q))
  }, [searchTerm, props.indexDetails])

  const showEmptySchemaState = !searchTerm && (props.indexDetails?.length ?? 0) === 0;
  const showNoMatchesState = !!searchTerm && filteredBuckets.length === 0;

  

  return (
    <>
      <div className="fullscreen flex flex-col p-8 overflow-y-auto">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-bold text-3xl">Vector Indexes</h1>
            <p className="text-sm text-muted-foreground mt-1">
              The underlying data for LLMs
            </p>
          </div>

          <Button
            variant={"default"}
            onClick={() => setOpen(true)}
          >
            Create Index
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-8 mb-4 justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 w-full sm:w-72"
                placeholder="Search indexes"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

          </div>

          <div className="text-xs text-muted-foreground">
            {`${filteredBuckets.length} index${filteredBuckets.length === 1 ? "" : "s"}`}
          </div>
        </div>

        <Separator className="mb-6" />

        {showEmptySchemaState ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center">
            <InboxIcon size={96} className="text-muted-foreground" />
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold">No indexes in yet</h2>
              <p className="text-muted-foreground text-sm">
                Create your first index to start using RAG & agents
              </p>
            </div>

            <Button
              variant={"default"}
              onClick={() => setOpen(true)}
            >
              Create Index
            </Button>
          </div>
        ) : showNoMatchesState ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <Search size={72} className="text-muted-foreground" />
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">No matches</h2>
              <p className="text-muted-foreground text-sm">
                No indexes match “{searchTerm.trim()}”.
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
              <IndexCard
                {...f}
                key={f.id}
              />
            ))}
        </div>
      )}
      </div>

      <CreateIndexDialog 
        projectId={projectId}
        existingBuckets={props.indexDetails.map(b => b.name)}
        onOpenChange={setOpen}
        open={open}
      />

      
    </>
  )
}

export default VectorsPage

function IndexCard({
  dimensions,
  metric,
  name,
  vector_type
}: StorageIndex) {
  const pathname = usePathname()

  return (
    <Link
      href={`${pathname}?index=${name}`}
      className="flex flex-col gap-2 group rounded-xl border bg-background p-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md hover:border-foreground/20"
    >
      <div className="min-w-0 flex items-center justify-between">
        <div className="group flex items-center gap-2">
          <LibraryBigIcon className="h-6 w-6 text-muted-foreground" />
          <h3 className="font-bold text-2xl">{name}</h3>
        </div>
      </div>

      <Separator />

      <p>Dimensions: {dimensions}</p>
      <p>Metric: {metric}</p>
      <p>Type: {vector_type}</p>
    </Link>
  )
}

function CreateIndexDialog({
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

  const [name, setName] = useState("");
  const [metric, setMetric] = useState<VECTOR_INDEX_METRIC>(VECTOR_INDEX_METRIC.COSINE)
  const [type, setType] = useState<VECTOR_INDEX_TYPE>(VECTOR_INDEX_TYPE.SPARSE)

  const existingBucketsSet = useMemo(() => {
    return new Set(existingBuckets)
  }, [existingBuckets])

  const [dimensions, setDimensions] = useState(500)
  const [isNameError, setIsNameError] = useState(false)
  const [isDimsError, setIsDimsError] = useState(false)
  const [isDimsWarning, setIsDimsWarning] = useState(false)

  useEffect(() => {
    if (dimensions < 256) {
      setIsDimsWarning(true)
      return
    } else {
      if (dimensions > 20_000) {
        setIsDimsWarning(false)
        setIsDimsError(true)
        return
      }
      setIsDimsError(false)
      setIsDimsWarning(false)
      return
    };
  }, [dimensions])

  useEffect(() => {
    if (existingBucketsSet.has(name)) {
      setIsNameError(true)
    } else {
      setIsNameError(false)
    }
  }, [name])

  const { mutate, isPending } = useMutation({
    mutationFn: () => createIndex(projectId, name, type, dimensions, metric),
    onSuccess: () => {
      toast.success("Index Created", { id:"create-storage-index" });
      onOpenChange(false);
      setName("")
    },
    onError: (error) => {
      console.log("Error details:", error);
      if (error.message === 'NEXT_REDIRECT') {
        toast.success("index Added", { id:"create-storage-index" });
        onOpenChange(false);
        return;
      }
      toast.error("Failed to create index", { id:"create-storage-index" })
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
          className="flex flex-col gap-6"
        >
          <DialogContent>
            <CustomDialogHeader 
              icon={SplinePointerIcon}
              title="New Vector Index"
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
                  className={`${isNameError && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500"}`}
                  placeholder="Universally Unique name"
                />
                {isNameError && (
                  <div className="flex items-center gap-2 text-sm text-red-500">
                    <FlagIcon className="w-4 h-4 stroke-red-500"/>
                    <p>Index with this name already exists</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h1>Type</h1>

              <Select
                value={type}
                onValueChange={v => setType(v as VECTOR_INDEX_TYPE)}
              >
                <SelectTrigger className="fullwidth">
                  <SelectValue className="text-xl font-bold"/>
                </SelectTrigger>
                <SelectContent>
                  {Object.values(VECTOR_INDEX_TYPE).map(o => (
                    <SelectItem key={o} value={o} className="font-bold text-xl">
                      {o.toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

            </div>

            <div className="flex flex-col gap-2">
              <h1>Metric</h1>

              <Select
                value={metric}
                onValueChange={v => setMetric(v as VECTOR_INDEX_METRIC)}
              >
                <SelectTrigger className="fullwidth">
                  <SelectValue className="text-xl font-bold"/>
                </SelectTrigger>
                <SelectContent>
                  {Object.values(VECTOR_INDEX_METRIC).map(o => (
                    <SelectItem key={o} value={o} className="font-bold text-xl">
                      {o.toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

            </div>

            <div className="flex flex-col gap-2">
              <h1>Dimensions</h1>
              
              <div className="flex flex-col gap-0.5">
                <Input 
                  
                  value={dimensions}
                  onChange={e => {
                    const v = e.target.value
                    if (!isNaN(Number(v))) {
                      setDimensions(Number(v))
                    }
                  }}
                  className={`fullwidth text-xl font-bold ${isDimsError && 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500'} ${isDimsWarning && 'border-yellow-500 focus-visible:border-yellow-500 focus-visible:ring-yellow-500'}`}
                />
                {isDimsWarning && (
                  <div className="flex items-center gap-2 text-sm text-yellow-500">
                    <TriangleAlertIcon className="w-8 h-8 stroke-yellow-500" />
                    <p>For a vector embedding to be useful, it's reccomended that there be <span className="font-extrabold">at least 256 dimensions</span></p>
                    
                  </div>
                )}
                {isDimsError && (
                  <div className="flex items-center gap-2 text-sm text-red-500">
                    <FlagIcon className="w-4 h-4 stroke-red-500" />
                    <p>Cannot excede <span className="font-semibold">20,000 dimensions</span></p>
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

              <Button onClick={() => mutate()} disabled={isPending || isNameError || name.length === 0 || isDimsError}>
                {!isPending && "Proceed"}
                {isPending && <Loader2 className='animate-spin' />}
              </Button>
            </DialogFooter>
          </DialogContent>
        </form>
      </Dialog>
  )
}