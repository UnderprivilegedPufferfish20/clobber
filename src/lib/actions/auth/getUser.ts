'use server'

import prisma from "@/lib/db";
import { User, UserCookie } from "@/lib/types/auth";
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

    const user = JSON.parse(userCookie.value) as UserCookie;

    const full_user = await prisma.user.findUnique({
      where: {
        id: user.id
      }
    })

    if (!full_user) throw new Error("GetUser - user in cookie not found");

    console.log('getUser - found user:', full_user.email); // Debug log
    return full_user;
  } catch (error) {
    console.error('getUser - error parsing user cookie:', error);
    return null;
  }
}

export async function getUserById(id: string) {
  return await prisma.user.findUnique({where: {id}, include: { projects: true, SharedProjects: true }})
}

export async function getUserCookie(): Promise<UserCookie | null> {
  const cookiejar = await cookies()

  const user_cookie = cookiejar.get("user");

  if (!user_cookie || !user_cookie.value) return null;

  const data = JSON.parse(user_cookie.value)

  return data as UserCookie;
}