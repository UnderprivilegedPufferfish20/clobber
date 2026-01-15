"use client";

import { RoleType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { UserIcon } from 'lucide-react'
import React from 'react'

const RoleCard = ({
  can_bypass_rls,
  can_create_roles,
  can_login,
  name,
  is_superuser
}: RoleType) => {
  return (
    <div
      className={cn(
        "group rounded-xl border bg-background p-4",
        "transition-all duration-150",
        "hover:-translate-y-0.5 hover:shadow-md",
        "hover:border-foreground/20"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <UserIcon className="h-6 w-6 text-muted-foreground" />
            <h3 className="font-semibold text-2xl truncate">{name}</h3>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoleCard