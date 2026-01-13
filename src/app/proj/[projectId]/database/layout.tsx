import { Separator } from "@/components/ui/separator";
import { ReactNode } from "react";
import { DatabaseNavbar } from "./_components/NavMenu";

export default function DatabasePageLayout(
  { children }: PageProps<"/proj/[projectId]/database"> & {
    children: ReactNode;
  }
) {


  return (
    <div className="fullscreen flex flex-col overflow-hidden">
      <header className="w-full h-20 min-h-20 max-h-20 flex gap-2 items-center-safe p-2 px-4">
        <span className="font-semibold text-3xl mr-8">Database</span>
        <DatabaseNavbar />
      </header>

      <Separator />

      <div className="flex-1 flex overflow-hidden fullscreen">
        {children}
      </div>
    </div>
  );
}
