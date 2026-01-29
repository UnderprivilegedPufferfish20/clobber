import { getEdgeFunctionSecrets } from "@/lib/actions/functions/cache-actions"
import SecretsPage from "../_components/SecretsPage"
import getSecrets from "@/lib/actions/functions/secrets/cache-actions"

export default async function page({ params, searchParams }: PageProps<"/proj/[projectId]/database/functions">) {
  const p = await params
  
  const functions = await getSecrets(p.projectId)

  return (
    <SecretsPage 
      data={functions}
      projectId={p.projectId}
    />
  )
} 