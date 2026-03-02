"use client";

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { FunctionSquareIcon } from 'lucide-react';
import { Dispatch, Fragment, SetStateAction, useState } from 'react';

const FunctionSelectSheet = ({
  setFunction,
  setFunctionSchema,
  name,
  schema,
  functions
}: {
  setFunctionSchema: Dispatch<SetStateAction<string>>;
  setFunction: Dispatch<SetStateAction<string>>;
  name: string,
  schema: string,
  functions: Record<string, string[]>
}) => {


  const [open, onOpenChange] = useState(false)

  const hasAnyFunctions = Object.values(functions).some(q => q.length > 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        {!name || !schema ? (
            <div
                className={`flex items-center justify-center fullwidth relative rounded-md border-dashed border border-border py-2 mt-2`}
              >
              <Button variant="secondary" className="max-w-3xs" type="button" onClick={() => onOpenChange(true)}>
                Select Function
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between text-muted-foreground fullwidth relative rounded-md border-dashed border border-border p-2">
              <div className="flex items-center gap-2">
                <FunctionSquareIcon className="w-6 h-6"/>
                <div className="flex items-center">
                  {schema}.<span className="text-white">{name}</span>
                </div>
              </div>

              <Button
                variant={"secondary"}
                onClick={() => onOpenChange(true)}
              >
                Change
              </Button>
            </div>
          )}
      </SheetTrigger>
      <SheetContent className="z-500 md:max-w-md overflow-x-hidden overflow-y-scroll flex flex-col gap-8">
        <SheetHeader className='mb-0!'>
          <SheetTitle>Select a function</SheetTitle>
          <SheetDescription>
            Only functions that return a trigger
          </SheetDescription>
        </SheetHeader>
        <Separator />
        {!hasAnyFunctions ? (
          <div className='fullwidth flex items-center flex-1 justify-center'>
            <div className='flex flex-col gap-2'>
              <h1>No available functions</h1>
            </div>
          </div>
        ) : (
          <>
            {Object.entries(functions).map(([schemaName, functions]) => {
              
              if (functions.length === 0) {
                return null; // Skip rendering for empty schemas
              }

              return (
                <Fragment key={schemaName}>
                
                
                  <div className="flex flex-col gap-2">
                    <p className="font-semibold text-lg ml-3 text-muted-foreground">{schemaName}</p>
                    
                    <div className="w-full">
                      {functions.map((f: string) => (
                        <div 
                          key={f}
                          onClick={(e) => {
                            setFunction(f);
                            setFunctionSchema(schemaName);
                            onOpenChange(false);
                          }} 
                          className='flex items-center gap-2 font-semibold text-xl px-6 hover:bg-secondary/50 p-1 cursor-pointer'
                        >
                          
                            <div className='flex items-center gap-2'>
                              <FunctionSquareIcon className="w-5 h-5" />
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

export default FunctionSelectSheet;