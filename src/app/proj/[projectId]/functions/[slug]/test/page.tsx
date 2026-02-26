"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";

// 1. Import linter and jsonParseLinter
import { linter } from "@codemirror/lint";
import { json, jsonParseLinter } from "@codemirror/lang-json";
import { useTheme } from "next-themes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InboxIcon, PlusIcon, XIcon } from "lucide-react";

const Page = () => {
  const methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"];
  type methods_type = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD";

  const [method, setMethod] = useState<methods_type>("POST");
  const [body, setBody] = useState("");
  const [headers, setHeaders] = useState<{ k: string; v: string }[]>([{ k: '', v: '' }]);
  const [params, setParams] = useState<{ k: string; v: string }[]>([{ k: '', v: '' }]);

  const {theme} = useTheme()
  return (
    <div className='fullscreen flex flex-1 justify-center py-6 overflow-y-scroll'>
      <div className="flex flex-col gap-8 w-1/3 min-w-1/3 max-w-1/3">
        <div className='flex flex-col gap-2'>
          <h2 className="text-secondary-foreground text-lg font-semibold">Method</h2>
          <Select value={method} onValueChange={v => setMethod(v as methods_type)}>
            <SelectTrigger className="fullwidth flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {methods.map(m => <SelectItem value={m} key={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className='flex flex-col gap-2'>
          <Label className="text-secondary-foreground text-lg font-semibold">Body</Label>
          <div className="rounded-md border border-input overflow-hidden">
            <CodeMirror
              value={body}
              height="256px"
              theme={"none"}
              // 2. Add the linter to the extensions array
              extensions={[json(), linter(jsonParseLinter())]}
              onChange={(value) => setBody(value)}
              className="text-sm [&_.cm-editor]:bg-background! [&_.cm-gutters]:bg-background! [&_.cm-gutters]:border-r-none!"
            />
          </div>
        </div>

        <div className='flex flex-col gap-2'>
          <Label className="text-secondary-foreground text-lg font-semibold">Headers</Label>
          {headers.length > 0 ? (
            <>
              {headers.map((_, index) => (
                <div className="flex fullwidth items-center flex-1 justify-between">
                  <div className="flex items-center gap-0">

                    <Input
                      placeholder="key"
                      className="rounded-tr-none! rounded-br-none!" 
                      value={headers[index].k}
                      onChange={e => {
                        const edited = headers[index]
                        edited.k = e.target.value
                        setHeaders(p => [...p.filter((_,i) => i !== index), edited])
                        
                      }}
                    />

                    <Input 
                      placeholder="value"
                      className="rounded-tl-none! rounded-bl-none!"
                      value={headers[index].v}
                      onChange={e => {
                        const edited = headers[index]
                        edited.v = e.target.value
                        setHeaders(p => [...p.filter((_,i) => i !== index), edited])
                      }}
                    />
                  </div>

                  <Button
                    variant={"ghost"}
                    size={"icon-sm"}
                    onClick={() => setHeaders(p => p.filter((_, i) => i !== index))}
                  >
                    <XIcon />
                  </Button>
                </div>
              ))}
            </>
          ) : (
            <div className="fullwidth h-xs min-h-xs max-h-xs flex flex-1 items-center justify-center">
              <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
                <InboxIcon size={36}/>
                <p className="text-muted-foreground">No headers</p>
              </div>
            </div>
          )}
          
          <div className="flex items-center fullwidth justify-end">
              <Button
                variant={"ghost"}
                className="flex items-center gap-2"
                
                onClick={() => setHeaders(p => [...p, {k:"",v:''}])}
              >
                <PlusIcon />
                <p>Add</p>
              </Button>

          </div>
        </div>


        <div className='flex flex-col gap-2'>
          <Label className="text-secondary-foreground text-lg font-semibold">Query Parameters</Label>
          {params.length > 0 ? (
            <>
              {params.map((_, index) => (
                <div className="flex fullwidth items-center flex-1 justify-between">
                  <div className="flex items-center gap-0">

                    <Input
                      placeholder="key"
                      className="rounded-tr-none! rounded-br-none!" 
                      value={params[index].k}
                      onChange={e => {
                        const edited = params[index]
                        edited.k = e.target.value
                        setParams(p => [...p.filter((_,i) => i !== index), edited])
                        
                      }}
                    />

                    <Input 
                      placeholder="value"
                      className="rounded-tl-none! rounded-bl-none!"
                      value={params[index].v}
                      onChange={e => {
                        const edited = params[index]
                        edited.v = e.target.value
                        setParams(p => [...p.filter((_,i) => i !== index), edited])
                      }}
                    />
                  </div>

                  <Button
                    variant={"ghost"}
                    size={"icon-sm"}
                    onClick={() => setParams(p => p.filter((_, i) => i !== index))}
                  >
                    <XIcon />
                  </Button>
                </div>
              ))}
            </>
          ) : (
            <div className="fullwidth h-xs min-h-xs max-h-xs flex flex-1 items-center justify-center">
              <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
                <InboxIcon size={36}/>
                <p className="text-muted-foreground">No headers</p>
              </div>
            </div>
          )}
          <div className="flex items-center fullwidth justify-end">
              <Button
                variant={"outline"}
                className="flex items-center gap-2"
                
                onClick={() => setParams(p => [...p, {k:"",v:''}])}
              >
                <PlusIcon />
                <p>Add</p>
              </Button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
