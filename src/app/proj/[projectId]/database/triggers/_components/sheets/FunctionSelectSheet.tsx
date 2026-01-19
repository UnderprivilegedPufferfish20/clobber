"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { getSchemas } from '@/lib/actions/database/cache-actions';
import { getFunctions } from '@/lib/actions/database/functions/cache-actions';
import { extractBody } from '@/lib/utils';
import { useQueries, useQuery } from '@tanstack/react-query';
import { FunctionSquareIcon } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { Dispatch, SetStateAction } from 'react';

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
  open,
  onOpenChange
}: {
  setFunctionSchema: Dispatch<SetStateAction<string>>;
  setFunction: Dispatch<SetStateAction<string>>;
  open: boolean;
  projectId: string;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  makeTriggerPageOpen: Dispatch<SetStateAction<boolean>>
}) => {

  const pathname = usePathname()
  const router = useRouter()

  const { data: schemas, isPending: isSchemasPending } = useQuery({
    queryKey: ['schemas', projectId],
    queryFn: () => getSchemas(projectId)
  });

  const funcs = useQueries({
    queries: schemas?.map((schema) => ({
      queryKey: ['functions', projectId, schema],
      queryFn: async () => (await getFunctions(projectId, schema)).filter(f => f.return_type.toLowerCase() === "trigger"),
      enabled: !!schemas
    })) ?? []
  });

  if (isSchemasPending) {
    return <div>Loading...</div>;
  }

  if (!schemas?.length) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="z-500 md:max-w-md overflow-x-hidden overflow-y-scroll flex flex-col gap-2">
          <p className="text-muted-foreground">No schemas found</p>
        </SheetContent>
      </Sheet>
    );
  }

  const allLoaded = funcs.every(q => !q.isPending);
  const hasAnyFunctions = funcs.some(q => (q.data?.length ?? 0) > 0);

  const showNoFunctionsMessage = allLoaded && !hasAnyFunctions;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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
              <Button
                variant={"secondary"}
                onClick={() => {
                  onOpenChange(false)
                  makeTriggerPageOpen(false)

                  const parts = pathname.split('/');
                  parts.pop(); // Remove the last segment
                  parts.push('functions'); // Add 'functions'
                  router.push(parts.join('/'));
                }}
              > 
                Go to functions
              </Button>
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
                          <p>{extractBody(f.definition)}</p>
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