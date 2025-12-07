"use server";


import { getUserCookie } from "./getUser";
import B_URL from "@/lib/constants";

export default async function authFetch(
    url: string,
    params: RequestInit
) {

    const user_cookie = await getUserCookie()

    if (!user_cookie || !user_cookie.tokens) throw new Error("authFetch - no user cookie");

    params.headers = {
        ...params.headers,
        "Content-Type": "application/json",
        "Authorization": `Bearer ${user_cookie.tokens.access}`
    }

    const first_res = await fetch(url, params);

    if (first_res.ok) {
        return await first_res.json()
    } else if (first_res.status === 401) {
        console.log("Token expired; refreshing...")

        const ref_response = await fetch(`${B_URL}/auth/refresh`, {
            method: "POST",
            body: JSON.stringify({
                ref_token: user_cookie.tokens.refresh
            })
        })

        if (!ref_response.ok) {
            throw new Error(`authFetch - backend failed to refresh: ${ref_response.statusText}`)
        }

        const ref_token = await ref_response.json()

        params.headers = {
            ...params.headers,
            "Authorization": `Bearer ${ref_token.access_token}`
        }


        const second_res = await fetch(url, params)

        if (!second_res.ok) throw new Error(`authFetch - backend failed after refresh: ${second_res.statusText}`);

        return await second_res.json()

    } else {
        throw new Error(`Backend auth failed: ${first_res.statusText}`)
    }


}