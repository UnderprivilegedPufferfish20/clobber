import { cn } from '@/lib/utils'
import { SparklesIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

const Logo = ({
  fontSize = '2xl',
  iconSize = 20,
}: {
  fontSize?: string,
  iconSize?: number
}) => {
  return (
    <Link
      href='/'
      className={cn(
        "flex items-center space-x-2",
        fontSize
      )}
    >
      <SparklesIcon size={iconSize} className="text-indigo-400" />
      <span className="text-2xl font-bold">ClobberDB</span>
    </Link>
  )
}

export default Logo