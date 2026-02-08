"use client";

import CustomDialogHeader from '@/components/CustomDialogHeader';
import TextInputDialog from '@/components/TextInputDialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { createNamespace, createVector } from '@/lib/actions/storage/vectors';
import { INDEX_SEARCH_METHOD_OPTIONS } from '@/lib/constants';
import { INDEX_SEARCH_METHOD, IndexVector, IndexVectorWithScore, StorageIndex } from '@/lib/types';
import { useMutation } from '@tanstack/react-query';
import { is, te } from 'date-fns/locale';
import { ArrowLeftIcon, ListEndIcon, ListIcon, Move, MoveIcon, SearchIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { Dispatch, SetStateAction, useMemo, useState } from 'react'
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
        return <p>Prefix <span className='text-xs text-muted-foreground'>(optional)</span></p>
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

            <div className='flex flex-col gap-2 w-28 min-w-28 max-w-28'>
              <p className='text-lg font-semibold'>Top K</p>
              <Input 
                value={topk}
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


        {searchResults && searchResults.length > 0 && (
          <div className='flex flex-col gap-2 mt-6'>
            <h1 className='font-semibold text-2xl'>Results <span className='text-sm text-muted-foreground'>({method === INDEX_SEARCH_METHOD.ID ? "by ID" : index.metric.toLowerCase()})</span></h1>
            {searchResults.map((sr, idx) => (
              <div key={sr.id}>
                <SearchResultCard 
                  {...sr}
                  // @ts-ignore
                  score={sr.score ? sr.score : ""}
                  index={idx}
                />
              </div>
            ))}
          </div>
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
  id,
  score,
  text,
  index
}: {
  id: string,
  score?: string,
  text: string,
  index: number
}) {
  return (
    <div className='fullwidth rounded-lg flex items-center gap-12 dark:bg-neutral-900 p-2'>
      <div className='flex items-center gap-2'>
        <span className='w-12 rounded-md h-12 flex items-center justify-center font-semibold bg-indigo-500 text-white'>
          {index + 1}
        </span>

        <div className='flex flex-col gap-2'>
          <p><span className='font-bold text-muted-foreground'>ID:</span> {id}</p>
          <p><span className='font-bold text-muted-foreground'>Score:</span> {score ? score : "N/A"}</p>
        </div>
      </div>

      <div className='flex flex-col gap-2'>
        <p className='font-bold text-muted-foreground'>Text</p>
        <p>{text}</p>
      </div>


    </div>
  )
}

export default IndexPage