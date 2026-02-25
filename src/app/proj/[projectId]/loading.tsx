"use client";

import Loader from "@/components/Loader";
import { Database, Sparkles, Server } from "lucide-react";

export default function loading() {
  return (
    <div className="h-screen min-h-screen max-h-screen w-screen min-w-screen max-w-screen flex flex-1 items-center justify-center overflow-hidden opacity-75">
      <div className="flex flex-col items-center justify-center gap-4">
        <Loader sz={76}/>
        <p className="text-lg text-white">Loading...</p>
      </div>
    </div>
  );
}
