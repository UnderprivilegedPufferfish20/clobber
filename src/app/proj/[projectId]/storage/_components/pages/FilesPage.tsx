"use client";

import CustomDialogHeader from "@/components/CustomDialogHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogFooter, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator"
import { createBucket } from "@/lib/actions/storage/actions";
import { getBucketNames } from "@/lib/actions/storage/getActions";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { BoxIcon, FunctionSquare, FunctionSquareIcon, InboxIcon, Loader2, PackageOpenIcon, Search } from "lucide-react"
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import path from "path";
import { useMemo, useState } from "react"
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

  const { mutate, isPending } = useMutation({
    mutationFn: () => createBucket(props.projectId, newBucketName),
    onSuccess: () => {
      toast.success("Bucket Created", { id:"create-bucket" });
      setOpen(false);
      setNewBucketName("")
    },
    onError: (error) => {
      console.log("Error details:", error);
      if (error.message === 'NEXT_REDIRECT') {
        toast.success("bucket Added", { id:"create-bucket" });
        setOpen(false);
        return;
      }
      toast.error("Failed to Create bucket", { id:"create-bucket" })
    }
  })

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
                createdAt={f.createdAt}
                id={f.id}
                name={f.name}
                key={f.id}
              />
            ))}
        </div>
      )}
      </div>



      <Dialog
        open={open}
        onOpenChange={setOpen}
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
              <Label htmlFor="name" >Name</Label>
              <Input
                value={newBucketName}
                onKeyDown={e => {
                if (e.key === "Enter") {
                    e.preventDefault()
                    mutate()
                  }
                }}
                onChange={e => setNewBucketName(e.target.value)} 
                id="name"
                placeholder="Universally Unique name"
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

              <Button type='submit' disabled={isPending || props.bucketDetails.map(b => b.name).includes(newBucketName) || newBucketName.length < 5}>
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

export default FilesPage

function BucketCard({
  projectId,
  id,
  name,
  createdAt,
}: {
  projectId: string,
  id: string,
  name: string,
  createdAt: any
}) {
  const pathname = usePathname()

  return (
    <Link
      href={`${pathname}?page=files&path=${name}`}
      className="group rounded-xl border bg-background p-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md hover:border-foreground/20"
    >
      <div className="min-w-0">
          <div className="group flex items-center gap-2">
            <BoxIcon className="h-6 w-6 text-muted-foreground" />
            <h3>{name}</h3>
          </div>
        </div>
    </Link>
  )
}