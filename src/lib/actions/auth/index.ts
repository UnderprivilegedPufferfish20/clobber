'use server'

import prisma from "@/lib/db";
import { User } from "@/lib/db/generated";
import { UserCookie } from "@/lib/types";
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

    const full_user = await prisma.user.findUnique({
      where: {
        id: user.id
      }
    })

    if (!full_user) throw new Error("GetUser - user in cookie not found");

    return full_user;
  } catch (error) {
    console.error('getUser - error parsing user cookie:', error);
    return null;
  }
}

export async function getUserById(id: string) {
  return await prisma.user.findUnique({where: {id}, include: { projects: { include: { databases: true } }   , SharedProjects: { include: { databases: true } } }})
}