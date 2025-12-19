"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { addRow, getCols } from "@/lib/actions/database/actions";
import { useQuery } from "@tanstack/react-query"
import { ScrollArea } from "@/components/ui/scroll-area"

function AddRowSheet({
    projectId,
    table,
    schema,
    open,
    onOpenChange,
    hideTrigger
}: {
    hideTrigger: boolean, table: string,
    projectId: string, open: boolean; onOpenChange: any,
    schema: string
}) {
  const [formData, setFormData] = useState<Record<string, any>>({})

  const {
    data: cols,
    isLoading: isColsLoading
  } = useQuery({
    queryKey: ["getCols", projectId, schema, table],
    queryFn: () => getCols(schema, projectId, table)
  })

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
    // You can now pass formData to your addRow action
    console.log("Submitting:", formData)
    await addRow(schema, projectId, table, formData)
    onOpenChange(false)
  }

  // Helper to map DB types to HTML input types
  const getInputType = (type: string) => {
    switch (type) {
      case 'integer': return 'number';
      case 'datetime': return 'datetime-local';
      default: return 'text';
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {!hideTrigger && (
        <SheetTrigger asChild>
            <Button variant="outline">Open</Button>
        </SheetTrigger>
      )}
      <SheetContent className="z-100 sm:max-w-[450px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Add Row</SheetTitle>
          <SheetDescription>
            Enter the details for the new row in <strong>{table}</strong>.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 pr-4 my-4">
          <div className="grid gap-4 py-4">
            {isColsLoading ? (
              <p className="text-sm text-muted-foreground text-center">Loading columns...</p>
            ) : (
              cols && Object.entries(cols).map(([colName, colType]) => (
                <div key={colName} className="grid gap-2">
                  <Label htmlFor={colName} className="capitalize">
                    {colName.replace(/_/g, ' ')}
                  </Label>
                  <Input
                    id={colName}
                    type={getInputType(colType as string)}
                    placeholder={`Enter ${colName}...`}
                    onChange={(e) => handleInputChange(colName, e.target.value)}
                  />
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="mt-auto">
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <Button onClick={handleSubmit} type="submit">Save Row</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export default AddRowSheet;
