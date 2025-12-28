"use client";

import CustomDialogHeader from '@/components/CustomDialogHeader';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { createFolder } from '@/lib/actions/storage/actions';
import { getFolderData } from '@/lib/actions/storage/getActions';
import { cn } from '@/lib/utils';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeftIcon, FolderIcon, FolderPlusIcon, Heading1, InboxIcon, Loader2, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import path from 'path';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

type Props = {
  bucketName: string,
  folderData: Awaited<ReturnType<typeof getFolderData>>
}

const FoldersPage = (props: Props) => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

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

  const filteredItems = useMemo(() => {
      if (!props.folderData) return [];
  
      const q = searchTerm.trim().toLowerCase();
      if (!q) return props.folderData;
  
      return props.folderData.filter(b => b.name.toLowerCase().includes(q))
    }, [searchTerm, props.folderData])
  
    const showEmptyState = !searchTerm && (props.folderData?.length ?? 0) === 0;
    const showNoMatchesState = !!searchTerm && filteredItems.length === 0;

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
                          <Link href={linkToFolder(p)}>{p}</Link>
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
          <div
            className={cn(
              "grid gap-4",
              "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            )}
          >
            {props.folderData.map(f => (
              <FolderCard
                name={f.name.slice(`${projectId}/${currentPath}`.length + 1).slice(0, -13)}
              />
            ))}
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
      className="group rounded-xl border bg-background p-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md hover:border-foreground/20"
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