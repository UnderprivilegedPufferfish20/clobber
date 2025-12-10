"use server";

import { getUserCookie } from "./getUser";
import { B_URL } from "@/lib/constants";

async function safeJson<T = unknown>(res: Response): Promise<T | null> {
  // If there's no JSON content-type, just return null
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return null;
  }

  // Try to read the body
  const text = await res.text();
  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    // If JSON is invalid, treat as no body instead of throwing
    return null;
  }
}

export default async function authFetch<T = unknown>(
  url: string,
  params: RequestInit
): Promise<T | null> {
  const user_cookie = await getUserCookie();

  if (!user_cookie || !user_cookie.tokens)
    throw new Error("authFetch - no user cookie");

  params.headers = {
    ...params.headers,
    "Content-Type": "application/json",
    Authorization: `Bearer ${user_cookie.tokens.access}`,
  };

  const first_res = await fetch(url, params);

  if (first_res.ok) {
    // Might be JSON, might be empty / non-JSON
    return await safeJson<T>(first_res);
  } else if (first_res.status === 401) {
    console.log("Token expired; refreshing...");

    const ref_response = await fetch(`${B_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref_token: user_cookie.tokens.refresh,
      }),
    });

    if (!ref_response.ok) {
      throw new Error(
        `authFetch - backend failed to refresh: ${ref_response.statusText}`
      );
    }

    const ref_token = await ref_response.json(); // This one *should* always be JSON

    params.headers = {
      ...params.headers,
      Authorization: `Bearer ${ref_token.access_token}`,
    };

    const second_res = await fetch(url, params);

    if (!second_res.ok) {
      throw new Error(
        `authFetch - backend failed after refresh: ${second_res.statusText}`
      );
    }

    // Again, might be JSON or might be empty
    return await safeJson<T>(second_res);
  } else {
    throw new Error(`Backend auth failed: ${first_res.statusText}`);
  }
}
