import { Separator } from "@/components/ui/separator";
import { ReactNode } from "react";
import { RealtimeNavbar } from "./_components/NavBar";

export default function DatabasePageLayout(
  { children }: PageProps<"/proj/[projectId]/realtime"> & {
    children: ReactNode;
  }
) {


  return (
    <div className="fullscreen flex flex-col overflow-hidden">
      <header className="w-full h-20 min-h-20 max-h-20 flex gap-2 items-center-safe p-2 px-4">
        <span className="font-semibold text-3xl mr-8">Realtime</span>
        <RealtimeNavbar />
      </header>

      <Separator />

      <div className="flex-1 flex overflow-hidden fullscreen">
        {children}
      </div>
    </div>
  );
}
