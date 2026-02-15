import { get_sso_providers } from '@/lib/actions/auth/cache-actions'
import OAuthProviderCard from './_components/OAuthProviderCard'
import AuthSignInPage from './_components/AuthSignInPage'

const page = async ({ params }: PageProps<"/proj/[projectId]/auth/sign_in">) => {

  const p = await params

  const providers = await get_sso_providers(p.projectId)

  const enabled_options = providers.filter(p => p.enabled)
  const disabled_options = providers.filter(p => !p.enabled)


  return <AuthSignInPage enabled_options={enabled_options} disabled_options={disabled_options}/>
}




export default page