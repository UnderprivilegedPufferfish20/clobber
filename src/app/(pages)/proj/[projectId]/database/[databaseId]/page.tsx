import CustomDataTable from '@/app/(pages)/proj/[projectId]/database/[databaseId]/_components/CustomDataTable'
import { getTableById } from '@/lib/actions/tables/getTableById'
import { ColumnarData } from '@/lib/types/table'
import { generateSchema } from '@/lib/utils'
import { Table2Icon } from 'lucide-react'
import React from 'react'

const page = async ({params, searchParams}: { params: { projectId: string, databaseId: string }, searchParams:{ table: string }  }) => {
  const p = await params
  const sp = await searchParams

  if (!sp.table) {
    return (
      <div className='w-full h-max min-h-max max-h-max flex items-center justify-center'>
        <div className='flex flex-col items-center gap-2'>
          <Table2Icon size={106}/>
          <p className='text-muted-foreground text-2xl'>No table selected</p>
        </div>
      </div>
    )
  }

  const table = await getTableById(sp.table)
  if (!table) throw new Error("Couldn't find table");

  const schema = generateSchema(table)

  console.log("@@SCHEMA: ", schema)






  return (
    <CustomDataTable 
      columns={schema}
      title={table.name}
      data={JSON.parse(table.data) as ColumnarData}
      className='w-full mt-4'
    />
  )
}

export default page