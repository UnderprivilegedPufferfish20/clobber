'use client'

import { Dispatch, ReactNode, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Columns, ArrowUpRightSquareIcon, Link, FolderIcon, ArrowRightIcon, ChevronRightIcon, FileIcon, FolderPlusIcon } from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet"
import CustomDialogHeader from '@/components/CustomDialogHeader'
import { Object as DatabaseObject } from '@/lib/db/generated'
import { useSearchParams } from 'next/navigation'
import { childName } from '@/lib/utils'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import CreateFolderDialog from '../dialogs/CreateFolderDialog'
import { getFolderData } from '@/lib/actions/storage/files/folder/cache-actions'
import { moveObject } from '@/lib/actions/storage/files/object'

function MoveObjectSheet({
  projectId,
  object,
  moveSheetOpen,
  setMoveSheetOpen
}: {
  projectId: string,
  object: DatabaseObject,
  moveSheetOpen: boolean;
  setMoveSheetOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")

  const sp = useSearchParams()
  
  const currentPath = sp.get("path") as string
  const [updatedPath, setUpdatedPath] = useState(currentPath);

  const prefix = useMemo(() => {
    return `${projectId}/${updatedPath.replace(/^\/+|\/+$/g, "")}/`;
  }, [updatedPath])

  const { data } = useQuery({
    queryKey: ["folder-data", updatedPath],
    queryFn: () => getFolderData(projectId, updatedPath),
  })

  useEffect(() => {
    console.log("@@UPDATED PATH: ", updatedPath)
  }, [updatedPath])

  

  const files = useMemo(() => {
    if (!data) return;
    return data.filter(f => !f.name.endsWith(".placeholder"))
  }, [data])

  const folders = useMemo(() => {
    if (!data) return;
    return data.filter(f => f.name.endsWith(".placeholder"))
  }, [data])

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      console.log("@CHILDNAME: ", childName(object, `${projectId}/${currentPath.replace(/^\/+|\/+$/g, "")}/`))

      return moveObject(projectId, object.id, object.name, `${updatedPath}/${childName(object, `${projectId}/${currentPath.replace(/^\/+|\/+$/g, "")}/`)}`)
    },
    onSuccess: () => {
      toast.success("Object Moved Sucessfully", { id: "move-object" });
      setMoveSheetOpen(false);
    },
    onMutate(variables, context) {
      toast.loading("Moving object...", { id: "move-object" })
    },
    onError: (error) => {
      toast.error(error.message || "Failed to move object", { id: "move-object" });
    }
  })

  

  return (
    <Sheet open={moveSheetOpen} onOpenChange={setMoveSheetOpen}>
      <SheetContent className="sm:max-w-md overflow-hidden p-2 z-100">
        <SheetHeader className="mb-4">
          <CustomDialogHeader 
            icon={ArrowUpRightSquareIcon}
            title="Move Object"
          />
          <SheetDescription>
            change the location of "{childName(object, `${projectId}/${currentPath.replace(/^\/+|\/+$/g, "")}/`)}"
          </SheetDescription>
        </SheetHeader>
        <div 
          onSubmit={e => {
            e.preventDefault()
            mutate()
          }} 
          className="flex flex-col flex-1 gap-6"
        >
          
          <header className='fullwidth flex items-center gap-2 flex-nowrap'>
            
              <Breadcrumb className='w-[382px] min-w-[382px] max-w-[382px] rounded-md border whitespace-nowrap flex-nowrap px-2'>
                <ScrollArea className='py-2.5'>
                <BreadcrumbList className='flex-nowrap!'>
                  {updatedPath.split("/").map(p => {
                    
                    const linkToFolder = (folderName: string) => {
                      const index = updatedPath.indexOf(folderName)

                      const endIndex = index + folderName.length

                      const result = updatedPath.substring(0, endIndex)

                      console.log("@NEWLINK: ", result)

                      return result
                    }

                    return (
                      <div
                        className='flex items-center gap-1' 
                        key={Math.random()}
                      >
                        <BreadcrumbItem>
                          <BreadcrumbLink 
                            asChild
                            onClick={() => setUpdatedPath(linkToFolder(p))}
                            className='cursor-pointer'
                          >
                            <p>{p}</p>
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                      </div>
                    )
                  })}
                </BreadcrumbList>
                <ScrollBar orientation='horizontal'/>
              </ScrollArea>
            </Breadcrumb>
              

            <Button
              className='flex items-center gap-2'
              variant={"default"}
              onClick={() => setCreateFolderOpen(true)}
            >
              <FolderPlusIcon className='w-6 h-6'/>
            </Button>

            <CreateFolderDialog 
              createFolderOpen={createFolderOpen}
              setCreateFolderOpen={setCreateFolderOpen}
              projectId={projectId}
              newFolderName={newFolderName}
              setNewFolderName={setNewFolderName}
              path={updatedPath}
            />
          </header>

          

          <ScrollArea className='fullheight rounded-md border p-2'>
              {folders && folders.map(f => {
              return (
                <div
                  key={f.id} 
                  className='group flex items-center justify-between p-2 cursor-pointer'
                  onClick={() => setUpdatedPath(p => `${p}/${f.name.slice(prefix.length, -13)}`)}
                >
                  <div className='flex items-center gap-2'>
                    <FolderIcon className='w-6 h-6'/>
                    <p>{f.name.slice(prefix.length, -13)}</p>
                  </div>
                  <ChevronRightIcon className='w-6 h-6 group-hover:translate-x-1 transition-transform duration-200' />
                </div>
              )
            })}
            {files && files.map(f => {
              return (
                <div 
                  className='p-2 flex items-center gap-2'
                  key={f.id}
                >
                  <FileIcon className='h-6 w-6'/>
                  {childName(f, prefix)}
                </div>
              )
            })}
            {files?.length === 0 && folders?.length === 0 && (
              <div className='flex items-center justify-center flex-col gap-2 text-muted-foreground m-auto'>
                This folder is empty
              </div>
            )}
          </ScrollArea>
          
          
          <div className='fullwidth overflow-x-hidden flex items-center gap-2 justify-start border-t p-2 absolute bottom-0'>
            <Button
              variant={"default"} 
              disabled={isPending || currentPath === updatedPath}
              onClick={() => mutate()}
            >
              {isPending ? <Loader2 className="animate-spin mr-2" /> : "Move"}
            </Button>
            <SheetClose asChild>
              <Button
                variant={"secondary"}
              >
                Cancel
              </Button>
            </SheetClose>
          </div>
        </div>

      </SheetContent>
    </Sheet>
  )
}

export default MoveObjectSheet;
