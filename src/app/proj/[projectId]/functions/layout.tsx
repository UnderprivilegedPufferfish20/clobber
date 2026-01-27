import { Separator } from "@/components/ui/separator";
import { ReactNode } from "react";
import EdgeFunctionsNavbar from "./_components/EdgeFunctionNavbar";

export default function EdgeFunctionsLayout(
  { children }: PageProps<"/proj/[projectId]/functions"> & {
    children: ReactNode;
  }
) {


  return (
    <div className="fullscreen flex flex-col overflow-hidden">
      <header className="w-full h-20 min-h-20 max-h-20 flex gap-2 items-center-safe p-2 px-4">
        <span className="font-semibold text-3xl mr-8">Edge Functions</span>
        <EdgeFunctionsNavbar />
      </header>

      <Separator />

      <div className="flex-1 flex overflow-hidden fullscreen">
        {children}
      </div>
    </div>
  );
}
