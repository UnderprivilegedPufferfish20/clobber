"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { getFunctions } from '@/lib/actions/database/functions/cache-actions';
import { extractBody } from '@/lib/utils';
import { useQueries, useQuery } from '@tanstack/react-query';
import { FunctionSquareIcon } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { Dispatch, SetStateAction, useState } from 'react';

interface FunctionData {
  function_name: string;
  schema_name: string;
  definition: string;
}

const FunctionSelectSheet = ({
  setFunction,
  setFunctionSchema,
  makeTriggerPageOpen,
  projectId,
  name,
  schema,
  schemas
}: {
  setFunctionSchema: Dispatch<SetStateAction<string>>;
  setFunction: Dispatch<SetStateAction<string>>;
  projectId: string;
  makeTriggerPageOpen: Dispatch<SetStateAction<boolean>>,
  name: string,
  schema: string,
  schemas: string[]
}) => {

  const funcs = useQueries({
    queries: schemas?.map((schema) => ({
      queryKey: ['functions', projectId, schema],
      queryFn: async () => (await getFunctions(projectId, schema)).filter(f => f.return_type.toLowerCase() === "trigger"),
    })) ?? []
  });


  const [open, onOpenChange] = useState(false)

  const allLoaded = funcs.every(q => !q.isPending);
  const hasAnyFunctions = funcs.some(q => (q.data?.length ?? 0) > 0);

  const showNoFunctionsMessage = allLoaded && !hasAnyFunctions;

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
        {showNoFunctionsMessage ? (
          <div className='fullwidth flex items-center flex-1 justify-center'>
            <div className='flex flex-col gap-2'>
              <h1>No available functions</h1>
            </div>
          </div>
        ) : (
          <>
            {funcs.map((funcQuery, idx) => {
              const schemaName = schemas[idx];
              const functions = funcQuery.data ?? [];

              if (funcQuery.isPending) {
                return (
                  <div key={schemaName} className="flex flex-col gap-2">
                    <p className="text-muted-foreground">{schemaName}</p>
                    <div>Loading functions...</div>
                  </div>
                );
              }

              if (functions.length === 0) {
                return null; // Skip rendering for empty schemas
              }

              return (
                <div key={schemaName} className="flex flex-col gap-2">
                  <p className="text-muted-foreground ml-3">{schemaName}</p>
                  
                  <Accordion type="single" collapsible className="w-full last:border-b">
                    {functions.map((f: FunctionData, funcIdx: number) => (
                      <AccordionItem key={f.function_name} value={`func-${schemaName}-${funcIdx}`} className='first:border-t'>
                        <AccordionTrigger className="flex items-center gap-2 font-semibold text-xl px-6">
                          <div className='flex items-center gap-2'>
                            <FunctionSquareIcon className="w-6 h-6" />
                            <h1
                              className="cursor-pointer hover:underline"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent accordion toggle
                                setFunction(f.function_name);
                                setFunctionSchema(f.schema_name);
                                onOpenChange(false);
                              }}
                            >
                              {f.function_name}
                            </h1>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4 text-balance px-6">
                          <p>{f.definition ? extractBody(f.definition) : ""}</p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              );
            })}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default FunctionSelectSheet;