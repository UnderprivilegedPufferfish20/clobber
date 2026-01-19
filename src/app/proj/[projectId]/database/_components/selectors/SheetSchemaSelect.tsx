"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getSchemas } from '@/lib/actions/database/cache-actions';
import { useQuery } from '@tanstack/react-query';
import { BoxesIcon } from 'lucide-react';
import React, { Dispatch, SetStateAction } from 'react'

const SheetSchemaSelect = ({
  projectId,
  value,
  onValueChange
}:{
  projectId: string,
  value: string,
  onValueChange: Dispatch<SetStateAction<string>>
}) => {
  const { data: schemas, isPending: isSchemasPending } = useQuery({
    queryKey: ['schemas', projectId],
    queryFn: () => getSchemas(projectId)
  })

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="fullwidth">
        <SelectValue placeholder="select a schema..."/>
      </SelectTrigger>

      <SelectContent className="z-500">
        {schemas && schemas.map(s => (
          <SelectItem
            className="flex items-center gap-2" 
            key={s} 
            value={s}
          >
            <BoxesIcon className="w-6 h-6"/>
            <h2 className="font-semibold text-lg">{s}</h2>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default SheetSchemaSelect