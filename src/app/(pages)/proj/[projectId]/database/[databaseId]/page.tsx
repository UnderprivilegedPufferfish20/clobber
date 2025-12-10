import { getTableById } from '@/lib/actions/tables/getTableById'
import { ColumnarData } from '@/lib/types/table'
import { Table2Icon } from 'lucide-react'
import React from 'react'

const page = async ({ params, searchParams }: PageProps<"/proj/[projectId]/database/[databaseId]">) => {

  const p = await params;
  const sp = await searchParams

  if (!sp.table) {
    return (
      <div className='w-full h-max min-h-max max-h-max flex items-center justify-center'>
        <div className='flex flex-col items-center gap-2'>
          <Table2Icon size={106}/>
          <p>Database Id: {p.databaseId}</p>
          <p className='text-muted-foreground text-2xl'>No table selected</p>
        </div>
      </div>
    )
  }
}

export default page