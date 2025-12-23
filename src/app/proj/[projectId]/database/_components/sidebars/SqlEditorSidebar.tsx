"use client"

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton';
import { Prisma, sql, SqlFolder } from '@/lib/db/generated';
import { ChevronDownIcon, ChevronRightIcon, FileSpreadsheetIcon, FolderIcon, FolderOpenIcon, PlusIcon } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import AddFolderDialog from '../dialogs/AddFolderDialog';
import AddQueryDialog from '../dialogs/AddQueryDialog';
import { cn } from '@/lib/utils';



const SqlEditorSidebar = ({
  folders,
  queries
}: {
  folders: Prisma.SqlFolderGetPayload<{include: { queries: true }}>[],
  queries: sql[]
}) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const selectedQuery = searchParams.get("query");
  const sqlId = searchParams.get("q") || ""; // <-- query id from ?q=
  const projectId = useMemo(() => pathname.split("/")[2] ?? "", [pathname]);


  const [searchTerm, setSearchTerm] = useState('');

  const filteredQueries = useMemo(() => {
    if (!queries || !searchTerm) return [];
    return queries.filter(q => q.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [queries, searchTerm]);


  return (
    <div className='sidebar'>
      <div className="fullwidth flex flex-col">
        <h1 className="text-2xl font-semibold m-4">SQL Editor</h1>
        <Separator className="pt-0!" />

        <div className='flex flex-col mt-2'>
            <div className='mt-4 px-2'>
              <div className='flex items-center gap-2 mb-4'>
                <Input 
                  placeholder="Search queries..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  className="flex-1" 
                />
                <AddButton projectId={projectId} folders={folders!} />
              </div>
              {searchTerm ? (
                <>
                  <div className="mb-2 text-sm text-muted-foreground">{filteredQueries.length} results found</div>
                  {filteredQueries.map(q => (
                    <Query key={q.id} q={q} qid={sqlId} />
                  ))}
                </>
              ) : (
                <>
                  {folders && folders.map(f => (
                    <Folder
                      key={f.id} 
                      name={f.name}
                      queries={f.queries}
                      sqlId={sqlId}
                    />
                  ))}
                  {queries && queries.filter(q => !q.folderId).map(q => (
                    <Query key={q.id} q={q} qid={sqlId} />
                  ))}
                </>
              )}
            </div>
        </div>
      </div>
    </div>
  )
}

export default SqlEditorSidebar

type FolderProps = {
  sqlId: string,
  name: string,
  queries: sql[]
}

function Folder({ name, queries, sqlId }: FolderProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      onClick={() => setIsOpen(p => !p)} 
      className={`fullwidth ${isOpen ? "" : "hover:bg-white/5"} flex flex-col p-2 hover:cursor-pointer`}
    >
      <div className='flex items-center gap-2'>
        <button className='flex items-center'>
          {isOpen ? (
            <ChevronDownIcon className='stroke-black dark:stroke-white h-5 w-5' />
          ) : (
            <ChevronRightIcon className='stroke-black dark:stroke-white h-5 w-5'/>
          )}
        </button>

        {isOpen ? (
          <FolderOpenIcon className='stroke-black dark:stroke-white h-5 w-5' />
        ) : (
          <FolderIcon className='stroke-black dark:stroke-white h-5 w-5'/>
        )}
        <h1 className='font-semibold'>{name}</h1>
      </div>

      {isOpen && queries.length > 0 && (
        <div className="flex ml-2 mt-2">
          {/* Vertical separator */}
          <div className="w-1.5 bg-white/10 mr-2 rounded-sm" style={{ minHeight: `${queries.length * 40}px` }} />

          {/* Query list */}
          <div className="flex flex-col gap-1">
            {queries.map(q => (
              <Query key={q.id} q={q} qid={sqlId} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AddButton({ projectId, folders }: { projectId: string, folders: SqlFolder[] }) {
  const [openQuery, setOpenQuery] = useState(false);
  const [openFolder, setOpenFolder] = useState(false);

  return (
    <>
      {/* Keep dialogs mounted OUTSIDE the dropdown */}
      <AddQueryDialog
        projectId={projectId}
        open={openQuery}
        folders={folders}
        onOpenChange={setOpenQuery}
        hideTrigger
      />
      <AddFolderDialog
        projectId={projectId}
        open={openFolder}
        onOpenChange={setOpenFolder}
        hideTrigger
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className='bg-gray-50 dark:bg-black/10 dark:hover:bg-gray-900 hover:bg-gray-100 flex items-center justify-center border-2 h-9 w-10'
            variant={'outline'}
          >
              <PlusIcon />
          </Button> 
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => setOpenQuery(true)}>
            Add query
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setOpenFolder(true)}>
            Add folder
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

function Query({
  q,
  qid
}: {
  q: sql,
  qid: string
}) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div 
      className={cn(
        'flex gap-3 items-center px-4 py-2 hover:bg-white/5 hover:cursor-pointer',
        q.id === qid ? "bg-indigo-600/20 border-l-4 border-indigo-500" : ""
      )}
      onClick={() => {
        router.push(`${pathname}?page=sql_editor&q=${q.id}`)
      }}
    >
      <FileSpreadsheetIcon className='h-5 w-5'/>
      <h1 className='font-semibold'>{q.name}</h1>
    </div>
  )
}