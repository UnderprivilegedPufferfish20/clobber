"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { EdgeFunctionType } from "@/lib/types";
import { AlertTriangle } from "lucide-react";
import { EdgeFunctionDefinition } from "next/dist/build/webpack/plugins/middleware-plugin";
import { useState } from "react";

const ConfigFunc = ({
    func
}: {
    func: EdgeFunctionType
}) => {
    const [slug, setSlug] = useState(func.slug)
    const [pub, setPublic] = useState(false)
    const [delOpen, setDelOpen] = useState(false)

  return (
    <>
        <div className='bg-secondary/70 p-4 rounded-lg flex flex-col gap-7 fullwidth flex-1'>

            <div className="flex items-center gap-6 justify-between">    
                <div className="flex flex-col gap-2">
                    <Label htmlFor='name' className="text-white">Name</Label>
                    <p className="text-xs">This will not change the URL or the slug</p>
                </div>
                <Input 
                    id='name'
                    onChange={e => setSlug(e.target.value)}
                    className='text-muted-foreground max-w-2xs'
                    value={func.slug}
                />
            </div>

            <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col gap-2">
                    <Label htmlFor='pub' className="text-white">Public</Label>
                    <p className="text-xs max-w-3xs">
                        Switching this off makes this function available to the entire internet without authentication. Highly reccomend that this stays off
                    </p>
                </div>
                <Switch 
                    id='pub'
                    checked={pub}
                    onCheckedChange={checked => {
                        if (checked) {
                            setPublic(true)
                        } else {
                            setPublic(false)
                        }
                    }}
            
                />
            </div>

            
    

   


            <Button
            variant={"destructive"}
            className='flex items-center gap-2'
            >
            <AlertTriangle />
            Delete
            </Button>
      </div>
    </>
  )
}

export default ConfigFunc