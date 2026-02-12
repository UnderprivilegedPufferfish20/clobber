"use client";

import CustomDialogHeader from '@/components/CustomDialogHeader';
import TextInputDialog from '@/components/TextInputDialog';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { createNamespace, createVector, deleteVector, editVector } from '@/lib/actions/storage/vectors';
import { INDEX_SEARCH_METHOD_OPTIONS } from '@/lib/constants';
import { INDEX_SEARCH_METHOD, IndexVector, IndexVectorWithScore, StorageIndex } from '@/lib/types';
import { useMutation } from '@tanstack/react-query';
import { is, te } from 'date-fns/locale';
import { ArrowLeftIcon, Edit2Icon, EditIcon, EllipsisVerticalIcon, EyeIcon, InboxIcon, ListEndIcon, ListIcon, Move, MoveIcon, SearchIcon, Trash2Icon, XIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from 'react'
import { Dropdown } from 'react-day-picker';
import { toast } from 'sonner';

const IndexPage = ({
  project_id,
  index,
  searchResults
}: {
  project_id: string,
  index: StorageIndex,
  searchResults: IndexVector[] | IndexVectorWithScore[] | null
}) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  if (index.namespaces.length === 0) throw new Error("Must have at least 1 namespace"); 

  const [newNamespaceName, setNewNamespaceName] = useState("")
  const [selectedNamespace, setSelectedNamespace] = useState(index.namespaces[0])
  const [isCreateNamespaceOpen, setIsCreateNamespaceOpen] = useState(false)
  const [isInsertVectorOpen, setIsInsertVectorOpen] = useState(false)

  const [query, setQuery] = useState("")
  const [topk, setTopK] = useState('50')
  const [method, setMethod] = useState<INDEX_SEARCH_METHOD>(INDEX_SEARCH_METHOD.TEXT)

  const search = () => {
    const sp = new URLSearchParams(searchParams)

    if (sp.has("search")) {
      sp.set("search", JSON.stringify({ namespace: selectedNamespace, method, query, topk }))
    } else {
      sp.append("search", JSON.stringify({ namespace: selectedNamespace, method, query, topk }))
    }

    router.push(`${pathname}?${sp}`)
  }


  const methodLabel = useMemo(() => INDEX_SEARCH_METHOD_OPTIONS.find(o => o.method === method)!.label, [method])

  const inputTitle = useMemo(() => {
    switch (method) {
      case INDEX_SEARCH_METHOD.ID:
        return "ID"
      case INDEX_SEARCH_METHOD.TEXT:
        return "Query"
      case INDEX_SEARCH_METHOD.LIST_IDS:
        return <span>Prefix <span className='text-xs text-muted-foreground'>(optional)</span></span>
      case INDEX_SEARCH_METHOD.SPARSE_VECTOR:
        return "Sparse Indices"
      default:
        throw new Error("Invalid method")
    }
  }, [method])

  const inputPlaceholder = useMemo(() => {
    switch (method) {
      case INDEX_SEARCH_METHOD.ID:
        return "comma & space separated IDs"
      case INDEX_SEARCH_METHOD.TEXT:
        return "the quick fox jumps over the lazy brown dog"
      case INDEX_SEARCH_METHOD.LIST_IDS:
        return "Optional prefix"
      case INDEX_SEARCH_METHOD.SPARSE_VECTOR:
        return "eg. 1, 2, 3, ..."
      default:
        throw new Error("Invalid method")
    }
  }, [method])

  const goBtn = useMemo(() => {
    switch (method) {
      case INDEX_SEARCH_METHOD.LIST_IDS:
        return (
          <Button 
            className='flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 transition-colors duration-400 text-white cursor-pointer'
            variant={"default"}
            onClick={search}
          >
            <ListIcon className='w-4 h-4'/>
            List
          </Button>
        )
      default:
        return (
          <Button 
            className='flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 transition-colors duration-400 text-white cursor-pointer'
            variant={"default"}
            onClick={search}
            disabled={!selectedNamespace || !method || !query || !topk}
          >
            <SearchIcon className='w-4 h-4'/>
            Search
          </Button>
        )
    }
  }, [method])

  const [selectedIds, setSelectedIds] = useState<string[]>([])
 
  const resultLabel = useMemo(() => {
    switch (method) {
      case INDEX_SEARCH_METHOD.LIST_IDS:
        return (
          <h1 className='font-semibold text-2xl'>List <span className='text-sm text-muted-foreground'>(limit = {topk})</span></h1>
        )
      case INDEX_SEARCH_METHOD.TEXT:
        return <h1 className='font-semibold text-2xl'>Results <span className='text-sm text-muted-foreground'>(via {index.metric.toLowerCase()} similarity)</span></h1>
      default:
        return <h1 className='font-semibold text-2xl'>Results</h1> 
    }
  }, [method])

  const { mutate: deleteSelected } = useMutation({
    mutationFn: async () => {
      await Promise.all(selectedIds.map(async v => deleteVector(project_id, index.name, selectedNamespace, v)))
    },
    onMutate: () => toast.loading("Deleting...", { id: "delete-selected-vectors" }),
    onError: (e) => toast.error(`Failed to delete: ${e}`, { id: "delete-selected-vectors" }),
    onSuccess: () => {
      toast.success(`${selectedIds.length} vectors deleted`, { id: "delete-selected-vectors" }),
      setSelectedIds([])
    }
  })

  const skipNextMethodEffectRef = useRef(false);

  useEffect(() => {
    if (skipNextMethodEffectRef.current) {
      skipNextMethodEffectRef.current = false;
      return;
    }

    setQuery("");
    router.push(`${pathname}?index=${index.name}`);

    if (method === INDEX_SEARCH_METHOD.LIST_IDS) {
      search();
    }
  }, [method]);

  

  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (selectedIds.length === 0) {
      toast.dismiss("selected-vectors")
      return
    }

    toast(() => (
      <div className='flex items-center justify-between flex-1 w-lg min-w-lg max-w-lg'>
        <div className="flex items-center gap-2">
          <div className="text-white bg-indigo-500 rounded-sm w-6 h-6 flex items-center justify-center">
            <p>{selectedIds.length}</p>
          </div>
          <p className="text-lg">vectors selected</p>
        </div>

        <div className='flex items-center gap-2 shrink-0'>
          <Button
            className='flex items-center gap-2'
            variant={"outline"}
            onClick={() => setIsConfirmDeleteOpen(true)}
          >
            <Trash2Icon className='w-4 h-4'/>
            Delete
          </Button>
          <Button
            className='flex items-center gap-2'
            variant={"outline"}
            onClick={() => {
              skipNextMethodEffectRef.current = true;

              const ids = selectedIds;           // capture before clearing
              setSelectedIds([]);
              setMethod(INDEX_SEARCH_METHOD.ID);
              setQuery(ids.join(", "));
              search();
            }}
          >
            <EyeIcon className='w-4 h-4'/>
            View
          </Button>
          <Button
            size={"icon-sm"}
            variant={"ghost"}
            onClick={() => setSelectedIds([])}
          >
            <XIcon className='w-4 h-4'/>
          </Button>
        </div>
      </div> 
    ), {
      duration: Infinity,
      className: "w-[542px] min-w-[542px] max-w-[542px]",
      id: "selected-vectors",
      position: "bottom-center"
    })
  }, [selectedIds])

  

  

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
            <Link href={`${pathname}?index=${index.name}`} className="font-bold text-3xl">{index.name}</Link>
          </div>
          
          <div className='flex items-center gap-2'>
            

            <Button
              className="flex items-center gap-2"
              variant="outline"
              onClick={() => setIsCreateNamespaceOpen(true)}
            >
              <MoveIcon className="w-6 h-6" />
              Create Namespace
            </Button>
            <Button
              className='flex items-center gap-2'
              variant={"outline"}
              onClick={() => setIsInsertVectorOpen(true)}
            >
              <ListEndIcon className='w-6 h-6'/>
              Insert Embedding
            </Button>
          </div>
        </div>


        <Separator className="mb-6" />

        <div className='flex flex-col gap-2'>
          <h1 className='font-semibold text-2xl'>Search</h1>
          <div className='dark:bg-neutral-900 rounded-md flex items-center gap-6 p-4'>

            <div className='flex flex-col gap-2 w-fit min-w-fit max-w-fit'>
              <p className='text-lg font-semibold'>Namespace</p>
              <Select
                value={selectedNamespace}
                onValueChange={v => setSelectedNamespace(v)}
              >
                <SelectTrigger className='rounded-none! text-sm '>
                  <p>{selectedNamespace}</p>
                </SelectTrigger>
                <SelectContent align='start'>
                  {index.namespaces.map(v => (
                    <SelectItem key={v} value={v} className='flex items-center gap-2'>
                      <MoveIcon className='w-6 h-6'/>
                      <p>{v.toLowerCase()}</p>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>


            <div className='flex flex-col gap-2 w-fit min-w-fit max-w-fit'>
              <p className='text-lg font-semibold'>Method</p>
              <Select
                value={method}
                onValueChange={v => setMethod(v as INDEX_SEARCH_METHOD)}
              >
                <SelectTrigger className='rounded-none!'>
                  <p>{methodLabel}</p>
                </SelectTrigger>
                <SelectContent align='start' className='w-lg min-w-md max-w-md'>
                  {INDEX_SEARCH_METHOD_OPTIONS.map(v => (
                    <SelectItem
                      className='flex items-center gap-8' 
                      key={v.method} 
                      value={v.method}
                    >
                      {<v.icon size={48}/>}

                      <div className='flex flex-col gap-0.5'>
                        <h2 className='text-sm'>{v.label}</h2>
                        <p className='text-xs text-muted-foreground'>{v.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='flex flex-col gap-2 w-full'>
              <p className='text-lg font-semibold'>
                {inputTitle}
              </p>
              <Input
                placeholder={inputPlaceholder}
                value={query}
                className='rounded-none!'
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && selectedNamespace && method && topk) search(); 
                }}
              />
            </div>

            <div className='flex flex-col gap-2 w-15 min-w-15 max-w-15'>
              <p className='text-lg font-semibold'>Top K</p>
              <Input 
                value={topk}
                className='rounded-none!'
                onChange={e => {
                  const v = e.target.value;

                  if (v === "") {
                    setTopK("");
                    return;
                  }
                  if (!/^\d+$/.test(v)) {
                    return;
                  }

                  if (Number(v) && Number(v) > 1000) return;
                  const normalized =
                    v.length > 1 && v.startsWith("0") ? v.replace(/^0+/, "") || "0" : v;

                  setTopK(normalized);
                }}
              />
            </div>

            <Separator orientation="vertical" />

            {goBtn}

            
          </div>
        </div>
        {searchResults && (
          <>
            {searchResults.length > 0 ? (
              <div className='flex flex-col gap-2 mt-6'>
                {resultLabel}
                {method === INDEX_SEARCH_METHOD.LIST_IDS && (
                  <div className='fullwidth bg-neutral-900 flex gap-4 items-center p-4 -mb-2'>
                    <Checkbox
                      className='w-5 h-5' 
                      checked={Boolean(searchResults && searchResults.length === selectedIds.length)}
                      onCheckedChange={checked => {
                        if (checked && searchResults) {
                          setSelectedIds(searchResults.map(sr => sr.id))
                        } else {
                          setSelectedIds([])
                        }
                      }}
                    />
                    <p className='text-sm text-muted-foreground'>Vector ID</p>
                  </div>
                )}
                {searchResults.map((sr, idx) => (
                  <div key={sr.id}>
                    <SearchResultCard 
                      {...sr}
                      id={sr.id}
                      indexName={index.name}
                      namespace={sr.namespace}
                      project_id={project_id}
                      // @ts-ignore
                      score={sr.score ? sr.score : ""}
                      index={idx}
                      method={method}
                      selectedIds={selectedIds}
                      setSelectedIds={setSelectedIds}
                    />
              </div>
            ))}
          </div>
            ) : (
              <div className='fullscreen flex items-center justify-center dark:bg-neutral-900 mt-8 rounded-md'>
                <div className='flex flex-col items-center gap-2'>
                  <InboxIcon size={106}/>
                  <p className='text-2xl'>No Results</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>


      <TextInputDialog 
        headerIcon={MoveIcon}
        action={createNamespace}
        actionArgs={[project_id, index.name, newNamespaceName]}
        errorMessage='Failed to create namespace'
        headerTitle='Create Namespace'
        loadingMessage='Creating...'
        onOpenChange={setIsCreateNamespaceOpen}
        onValueChange={setNewNamespaceName}
        open={isCreateNamespaceOpen}
        successMessage='Namespace Created'
        toastId='create-namespace'
        value={newNamespaceName}
      />

      <InsertEmbeddingDialog 
        open={isInsertVectorOpen}
        onOpenChange={setIsInsertVectorOpen}
        index={index.name}
        namespaces={index.namespaces}
        project_id={project_id}
      />

      <AlertDialog
        open={isConfirmDeleteOpen}
        onOpenChange={setIsConfirmDeleteOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletetion of {selectedIds.length} vectors</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete {selectedIds.length} vectors from your database, and cannot be undone
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancel
            </AlertDialogCancel>
            <Button
              variant={"default"}
              onClick={() => deleteSelected()}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function InsertEmbeddingDialog({
  open,
  onOpenChange,
  namespaces,
  project_id,
  index
}: {
  open: boolean,
  onOpenChange: Dispatch<SetStateAction<boolean>>,
  namespaces: string[],
  project_id: string,
  index: string
}) {
  if (namespaces.length === 0) throw new Error("Must have namespace");

  const [id, setId] = useState("")
  const [text, setText] = useState("")

  const [selectedNamespace, setSelectedNamespace] = useState(namespaces[0])

  const { mutate, isPending } = useMutation({
    mutationFn: () => createVector(project_id, index, selectedNamespace, id, text),
    onMutate: () => toast.loading("Creating...", { id: "create-vector" }),
    onSuccess: () => {
      toast.success("Index inserted", { id: "create-vector" });
      onOpenChange(false);
      setId("")
      setText("")
    },
    onError: (e) => toast.error(`Failed to insert vector: ${e}`, { id: "create-vector" })
  })

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className='flex flex-col gap-8'>

        <CustomDialogHeader 
          icon={ListEndIcon}
          title='Insert Embedding'
        />

        <div className='flex flex-col gap-2'>
          <p>Namespace</p>
          <Select
            value={selectedNamespace}
            onValueChange={v => setSelectedNamespace(v)}
          >
            <SelectTrigger className='fullwidth font-semibold text-lg'>
              <SelectValue className='fullwidth font-semibold text-lg'/>
            </SelectTrigger>
            <SelectContent>
              {namespaces.map(v => (
                <SelectItem key={v} value={v} className='flex items-center gap-2'>
                  <MoveIcon className='w-4 h-4'/>
                  <p className='font-semibold text-lg'>{v}</p>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='flex flex-col gap-2'>
          <Label htmlFor='id'>ID</Label>
          <Input 
            id="id"
            className='fullwidth'
            value={id}
            onChange={e => setId(e.target.value)}
          />
        </div>

        <div className='flex flex-col gap-2'>
          <Label htmlFor='id'>Text</Label>
          <Textarea 
            id="id"
            className='fullwidth'
            value={text}
            onChange={e => setText(e.target.value)}
          />
        </div>

        <DialogFooter className='flex items-center gap-2'>
          <Button
            variant={"secondary"}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant={"default"}
            onClick={() => mutate()}
            disabled={!id || !text || isPending}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SearchResultCard({
  project_id,
  indexName,
  namespace,
  id,
  score,
  text,
  index,
  method,
  selectedIds,
  setSelectedIds
}: {
  project_id: string,
  indexName: string,
  namespace: string
  id: string,
  score?: string,
  text: string,
  index: number,
  method: INDEX_SEARCH_METHOD,
  selectedIds: string[],
  setSelectedIds: Dispatch<SetStateAction<string[]>>
}) {

  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
  const [newText, setNewText] = useState(text)

  const { mutate: del } = useMutation({
    mutationFn: () => deleteVector(project_id, indexName, namespace, id),
    onMutate: () => toast.loading("Deleting...", { id: "delete-vector" }),
    onError: (e) => toast.error(`Failed to delete vector: ${e}`, { id: "delete-vector" }),
    onSuccess: () => toast.success("Vector Deleted", { id: "delete-vector" })
  })

  const { mutate: edit } = useMutation({
    mutationFn: () => editVector(project_id, indexName, namespace, id, newText),
    onMutate: () => toast.loading("Applying Changes...", { id: "edit-vector" }),
    onError: (e) => toast.error(`Failed to apply changes: ${e}`, { id: "edit-vector" }),
    onSuccess: () => {
      toast.success("Changes Applied", { id: "edit-vector" })
      setNewText("")
      setIsEditSheetOpen(false)
    }
  })

  const dropdownMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          onClick={() => {}}
          variant={"ghost"}
          size={"icon-lg"}
          className='cursor-pointer'
        >
          <EllipsisVerticalIcon className='w-4 h-4'/>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem
          className='flex items-center gap-2'
          onClick={() => setIsEditSheetOpen(true)}
        >
          <EditIcon className='w-4 h-4'/>
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setIsConfirmDeleteOpen(true)}
          className='flex items-center gap-2'
        >
          <Trash2Icon className='w-4 h-4'/>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

  return (
    <>
      {method === INDEX_SEARCH_METHOD.LIST_IDS ? (
        <div className='flex items-center gap-4 p-4 dark:bg-neutral-900'>
          <Checkbox 
            className='w-5 h-5'
            checked={selectedSet.has(id)}
            onCheckedChange={checked => {
              if (checked) {
                setSelectedIds(p => [...p, id])
              } else {
                setSelectedIds(p => p.filter(v => v !== id))
              }
            }}
          />

          <h1 className='text-sm'>{id}</h1>
        </div>
      ) : method === INDEX_SEARCH_METHOD.ID ? (
        <div className='fullwidth rounded-lg justify-between flex items-center gap-12 dark:bg-neutral-900 p-2'>
          <div className='flex items-center gap-8'>
            <span className='w-8 rounded-md h-8 flex items-center justify-center font-semibold bg-indigo-500 text-white'>
              {index + 1}
            </span>

            <div className='flex flex-col'>
              <p><span className='font-bold text-muted-foreground'>ID:</span> {id}</p>
              <p><span className='font-bold text-muted-foreground'>Text:</span> {text}</p>
            </div>
          </div>

          {dropdownMenu}

          
        </div>  
      ) : (
        <div className='fullwidth rounded-lg flex items-center justify-between gap-12 dark:bg-neutral-900 p-2'>
          <div className='flex items-center gap-8'>
            <div className='flex items-center gap-4'>
              <span className='w-8 rounded-md h-8 flex items-center justify-center font-semibold bg-indigo-500 text-white'>
                {index + 1}
              </span>

              <div className='flex flex-col'>
                <p><span className='font-bold text-muted-foreground'>ID:</span> {id}</p>
                <p><span className='font-bold text-muted-foreground'>Score:</span> {score ? score : "N/A"}</p>
              </div>
            </div>

            <div className='flex flex-col'>
              <p className='font-bold text-muted-foreground'>Text</p>
              <p>{text}</p>
            </div>
          </div>

          {dropdownMenu}
        </div>  

      )}

      <AlertDialog
        open={isConfirmDeleteOpen}
        onOpenChange={setIsConfirmDeleteOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete this vector from your database, and cannot be undone
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancel
            </AlertDialogCancel>
            <Button
              variant={"default"}
              onClick={() => del()}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={isEditSheetOpen}
        onOpenChange={setIsEditSheetOpen}
      >
        <DialogContent className='flex flex-col gap-8'>

          <CustomDialogHeader 
            icon={Edit2Icon}
            title='Edit Embedding'
          />

          <div className='flex flex-col gap-2'>
            <p>Namespace</p>
            <Input 
              disabled
              value={namespace}
              className='fullwidth cursor-not-allowed'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <Label htmlFor='id'>ID</Label>
            <Input 
              id="id"
              className='fullwidth'
              disabled
              value={id}
            />
          </div>

          <div className='flex flex-col gap-2'>
            <Label htmlFor='txt'>Text</Label>
            <Textarea 
              id="txt"
              className='fullwidth'
              value={newText}
              onChange={e => setNewText(e.target.value)}
            />
          </div>

          <DialogFooter className='flex items-center gap-2'>
            <Button
              variant={"secondary"}
              onClick={() => setIsEditSheetOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant={"default"}
              onClick={() => edit()}
              disabled={text === newText}
            >
              Apply Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default IndexPage