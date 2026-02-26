import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { getEdgeFunctions } from '@/lib/actions/functions/cache-actions'
import { AlertTriangle, CopyIcon } from 'lucide-react'
import React from 'react'
import ConfigFunc from './_components/ConfigFunc'

const page = async ({ params }: PageProps<"/proj/[projectId]/functions/[slug]/overview">) => {

  const p = await params

  const all_funcs = await getEdgeFunctions(p.projectId)

  const func = all_funcs.find(f => f.slug === p.slug)

  if (!func) throw new Error("Cannot find function");

  const maketime = new Date(parseInt(func.created_at.seconds) * 1000 + (func.created_at.nanos / 1000000))
  const updatetime = new Date(parseInt(func.updated_at.seconds) * 1000 + (func.updated_at.nanos / 1000000))

  return (
    <div className='flex flex-1 items-start gap-12 p-6 text-muted-foreground'>
      <div className='flex flex-col gap-2 justify-between'>
    
        <h2 className='col-span-2 font-bold text-xl text-white mb-8'>Details</h2>
        
        <div className='flex items-center gap-30'>
          {/* Row 1: Slug */}
          <p>Slug</p>
          <span className='font-semibold text-white'>{p.slug}</span>
        </div>

        <div className='flex items-center gap-30'>

          {/* Row 2: URL */}
          <p>URL</p>
          <div className='relative group flex items-center'>
            <Input 
              className='w-46 min-w-46 max-w-46 text-muted-foreground py-4! pr-24'
              value={func.url}
            />
            <Button
              className='flex items-center gap-2 absolute right-1 opacity-100! h-7! min-h-7! max-h-7! bg-secondary!'
              variant={"outline"}
              
            >
              <CopyIcon />
              <p>Copy</p>
            </Button>
          </div>
        </div>

        <div className='flex items-center gap-23'>
          {/* Row 3: Created */}
          <p>Created</p>
          <span className='font-semibold text-white'>{maketime.toLocaleString()}</span>
        </div>

        <div className='flex items-center gap-13'>
          {/* Row 4: Last Updated */}
          <p>Last Updated</p>
          <span className='font-semibold text-white'>{updatetime.toLocaleString()}</span>
        </div>



      </div>

      <div className='flex flex-col gap-4 min-w-0 flex-1'>
        <h2 className='col-span-2 font-bold text-xl text-white mb-2'>Configuration</h2>
        <ConfigFunc func={func}/>
      </div>
    </div>
  )
}

export default page