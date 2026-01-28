import { getEdgeFunctionSecrets } from "@/lib/actions/functions/cache-actions"
import SecretsPage from "../_components/SecretsPage"

export default async function page({ params, searchParams }: PageProps<"/proj/[projectId]/database/functions">) {
  const p = await params
  
  const functions = await getEdgeFunctionSecrets(p.projectId)

  return (
    <SecretsPage 
      data={functions}
    />
  )
} 