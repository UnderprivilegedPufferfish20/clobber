'use client'; // Mark the component as a Client Component

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SomeClientPage() {
  const router = useRouter();
  const pathname = usePathname()

  useEffect(() => {
    router.push(`${pathname}/overview`); // Redirect
  }, [router]);

}
