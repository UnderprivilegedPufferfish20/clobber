"use client"

import { Table2Icon } from "lucide-react";
import { Separator } from "./ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Dispatch, SetStateAction, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { getTables } from "@/lib/actions/database/tables/cache-actions";
import { Button } from "./ui/button";

const TableSelectSheet = ({
  setTable,
  setSchema,
  table,
  schema,
  schemas,
  projectId,
}: {
  setSchema: Dispatch<SetStateAction<string>>;
  setTable: Dispatch<SetStateAction<string>>;
  schemas: string[];
  projectId: string;
  table: string;
  schema:string;
}) => {

  const [open, setOpen] = useState(false)

  const tables = useQueries({
    queries: schemas?.map((schema) => ({
      queryKey: ['functions', projectId, schema],
      queryFn: async () => await getTables(schema, projectId),
    })) ?? []
  });


  const allLoaded = tables.every(q => !q.isPending);
  const hasAnyFunctions = tables.some(q => (q.data?.length ?? 0) > 0);

  const showNoFunctionsMessage = allLoaded && !hasAnyFunctions;

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
    >
      <SheetTrigger asChild>
        {!table || !schema ? (
          <div
              className={`flex items-center justify-center fullwidth relative rounded-md border-dashed border border-border py-2 mt-2`}
            >
            <Button variant="secondary" className="max-w-3xs" type="button" onClick={() => setOpen(true)}>
              Select Table
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between text-muted-foreground fullwidth relative rounded-md border-dashed border border-border p-2">
            <div className="flex items-center gap-2">
              <Table2Icon className="w-6 h-6"/>
              <div className="flex items-center">
                {schema}.<span className="text-white">{table}</span>
              </div>
            </div>

            <Button
              variant={"secondary"}
              onClick={() => setOpen(true)}
            >
              Change
            </Button>
          </div>
        )}
      </SheetTrigger>
      <SheetContent className="z-500 md:max-w-md overflow-x-hidden overflow-y-scroll flex flex-col gap-4">
        <SheetHeader className='mb-0!'>
          <SheetTitle>Select a table</SheetTitle>
        </SheetHeader>
        <Separator />
        {showNoFunctionsMessage ? (
          <div className='fullwidth flex items-center flex-1 justify-center'>
            <div className='flex flex-col gap-2'>
              <h1>No available Tables</h1>
            </div>
          </div>
        ) : (
          <>
            {tables.map((tableQuery, idx) => {
              const schemaName = schemas[idx];
              const tables = tableQuery.data ?? [];

              if (tableQuery.isPending) {
                return (
                  <div key={schemaName} className="flex flex-col gap-2">
                    <p className="text-muted-foreground">{schemaName}</p>
                    <div>Loading tables...</div>
                  </div>
                );
              }

              if (tables.length === 0) {
                return null;
              }

              return (
                <>
                
                
                  <div key={schemaName} className="flex flex-col gap-2">
                    <p className="font-semibold text-lg ml-3 text-muted-foreground">{schemaName}</p>
                    
                    <div className="w-full">
                      {tables.map((f: string) => (
                        <div 
                          key={f}
                          onClick={(e) => {
                            setTable(f);
                            setSchema(schemaName);
                            setOpen(false);
                          }} 
                          className='flex items-center gap-2 font-semibold text-xl px-6 hover:bg-secondary/50 p-1 cursor-pointer'
                        >
                          
                            <div className='flex items-center gap-2'>
                              <Table2Icon className="w-5 h-5" />
                              <h1
                                className="font-normal text-lg"
                              >
                                {f}
                              </h1>
                            </div>
                          </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                </>
              );
            })}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default TableSelectSheet;