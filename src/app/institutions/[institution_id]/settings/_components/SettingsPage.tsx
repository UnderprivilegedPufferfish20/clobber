"use client";
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Institution } from '@prisma/client'
import { CopyIcon } from 'lucide-react'
import React, { useState } from 'react'

const SettingsPage = ({
    inst
}: {
    inst: Institution
}) => {
    const [newName, setNewName] = useState(inst.name)

  return (
    <div className='flex flex-col fullheight'>

      
        <h1 className='text-2xl font-bold mb-8 p-2'>Settings</h1>


        <div className='flex flex-col gap-6'>

            <div className="flex flex-col gap-4 p-4 rounded-lg bg-secondary">
            <Label htmlFor="name">
                Name
            </Label>
            <Input
                value={newName}
                id="name"
                onChange={e => setNewName(e.target.value)}
            />
            </div>

            <div className="flex flex-col gap-4 p-4 rounded-lg bg-secondary">
            <Label htmlFor="sl">
                Slug
            </Label>

            <div className='relative group flex items-center'>
                <Input
                    disabled
                    value={inst.slug}
                    id="sl"
                    
                />
                <Button
                    className='flex items-center gap-2 absolute right-1 opacity-100! h-7! min-h-7! max-h-7! bg-secondary!'
                    variant={"outline"}
                    
                    >
                        <CopyIcon className='w-5 h-5'/>
                        <p>Copy</p>
                    </Button>
            </div>
            </div>
        </div>
    </div>
  )
}

export default SettingsPage