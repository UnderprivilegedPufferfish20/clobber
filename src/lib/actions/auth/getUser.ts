'use server'

import prisma from "@/lib/db";
import { User } from "@/lib/types/auth";
import { cookies } from "next/headers"

export async function getUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    
    if (!cookieStore) {
      console.error('getUser - cannot access cookies');
      return null;
    }

    const userCookie = cookieStore.get('user');
    
    if (!userCookie || !userCookie.value) {
      console.log('getUser - no user cookie found');
      return null;
    }

    const user = JSON.parse(userCookie.value) as User;
    console.log('getUser - found user:', user.email); // Debug log
    return user;
  } catch (error) {
    console.error('getUser - error parsing user cookie:', error);
    return null;
  }
}

export async function getUserById(id: string) {
  return await prisma.user.findUnique({where: {id}, include: { projects: true }})
}