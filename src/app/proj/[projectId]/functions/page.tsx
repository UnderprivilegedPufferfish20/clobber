import CardPage from "@/components/CardPage";
import { getFunctions } from "@/lib/actions/database/functions/cache-actions";
import { getEdgeFunctions } from "@/lib/actions/functions/cache-actions";
import { EdgeFunctionType } from "@/lib/types";
import EdgeFunctionsPage from "./_components/EdgeFunctionsPage";

export default async function FunctionsPage({ params, searchParams }: PageProps<"/proj/[projectId]/database/functions">) {
  const p = await params
  
  const functions = await getEdgeFunctions(p.projectId)

  return (
    <EdgeFunctionsPage 
      data={functions}
    />
  )
} 