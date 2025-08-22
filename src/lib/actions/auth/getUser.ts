'use server'

import { User } from "@/lib/types/auth";
import { cookies } from "next/headers"

export async function getUser() {
  const cookieStore = await cookies()

  if (!cookieStore) throw new Error('getUser - cannot access cookies');

  const user = cookieStore.get('user')

  if (!user) return;
  return JSON.parse(user.value) as User
}