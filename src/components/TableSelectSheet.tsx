"use client"

import { Table2Icon } from "lucide-react";
import { Separator } from "./ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Dispatch, Fragment, SetStateAction, useState } from "react";
import { Button } from "./ui/button";

const TableSelectSheet = ({
  setTable,
  setSchema,
  table,
  tables,
  schema,
}: {
  setSchema: Dispatch<SetStateAction<string>>;
  setTable: Dispatch<SetStateAction<string>>;
  tables: Record<string, string[]>;
  table: string;
  schema: string;
}) => {

  console.log("@TABLES: ", tables)

  const [open, setOpen] = useState(false)

  const noTables = Object.values(tables).every(l => l.length === 0)


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
        {noTables ? (
          <div className='fullwidth flex items-center flex-1 justify-center'>
            <div className='flex flex-col gap-2'>
              <h1>No available Tables</h1>
            </div>
          </div>
        ) : (
          <>
            {Object.entries(tables).map(([schemaName, tableList]) => {


              if (tableList.length === 0) {
                return null;
              }

              return (
                <Fragment key={schemaName}>
                
                
                  <div className="flex flex-col gap-2">
                    <p className="font-semibold text-lg ml-3 text-muted-foreground">{schemaName}</p>
                    
                    <div className="w-full">
                      {tableList.map((f: string) => (
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
                </Fragment>
              );
            })}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default TableSelectSheet;