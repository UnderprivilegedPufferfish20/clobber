'use client';
import { EdgeFunctionType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { FunctionSquare } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation';

const EdgeFunctionCard = ({
    created_at,
    deployment_count,
    files,
    slug,
    updated_at,
    url
}: EdgeFunctionType) => {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <>
        <Link
            href={`${pathname}/${slug}`} 
            className={cn(
                      "group rounded-xl border bg-background p-4",
                      "transition-all duration-150",
                      "hover:-translate-y-0.5 hover:shadow-md",
                      "hover:border-foreground/20"
                    )}
        >
            <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="group flex items-center gap-2">
              <FunctionSquare className="h-6 w-6 text-muted-foreground" />
                <h3 
                  className="font-semibold text-2xl truncate"
                >
                  {slug}
                </h3>
            </div>

            

            <div className="group flex items-center gap-2">
              
                <p className="text-lg text-muted-foreground mt-1 truncate">
                  <span className="font-mono truncate">{url}</span>
                </p>
            
            </div>

          </div>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "shrink-0 rounded-md border px-2 py-1 text-[11px] font-mono",
                "text-muted-foreground bg-muted/30",
                "group-hover:text-foreground group-hover:border-foreground/20"
              )}
            >
              {files.length} files
            </span>

            
          </div>
        </div>
        </Link>
    </>
  )
}

export default EdgeFunctionCard