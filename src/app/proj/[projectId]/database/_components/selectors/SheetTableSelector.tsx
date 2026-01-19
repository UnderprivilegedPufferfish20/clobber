"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getSchemas } from '@/lib/actions/database/cache-actions';
import { getTables } from '@/lib/actions/database/tables/cache-actions';
import { useQuery } from '@tanstack/react-query';
import { BoxesIcon, Table2Icon } from 'lucide-react';
import React, { Dispatch, SetStateAction } from 'react'

const SheetTableSelector = ({
  projectId,
  disabled = false,
  schema,
  value,
  onValueChange
}:{
  projectId: string,
  value: string,
  disabled?: boolean
  schema: string,
  onValueChange: Dispatch<SetStateAction<string>>
}) => {
  const { data: tables, isPending: isTablesPending } = useQuery({
    queryKey: ['tables', projectId, schema],
    queryFn: () => getTables(schema, projectId)
  })

  return (
    <Select disabled={disabled} value={value} onValueChange={onValueChange}>
      <SelectTrigger className="fullwidth">
        <SelectValue placeholder={`select a table in "${schema}"...`}/>
      </SelectTrigger>

      <SelectContent className="z-500">
        {tables && tables.map(s => (
          <SelectItem
            className="flex items-center gap-2" 
            key={s} 
            value={s}
          >
            <Table2Icon className="w-6 h-6"/>
            <h2 className="font-semibold text-lg">{s}</h2>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default SheetTableSelector