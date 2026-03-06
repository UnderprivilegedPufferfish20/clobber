"use client";
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

const page = () => {

  

  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    router.push(`${pathname}/email`)
  })
}




export default page