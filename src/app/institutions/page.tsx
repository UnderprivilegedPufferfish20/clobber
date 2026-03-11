import { getUser } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import InstiPage from "./_components/InstiPage"
import { getUserById } from "@/lib/actions/auth/cache-actions"
import { HeaderSeperator } from "../proj/_components/BreadcrumbHeader"
import Logo from "@/components/Logo"

const page = async () => {
  const isLoggedIn = await getUser()
  
  if (!isLoggedIn) {
    console.log("User not found")
    redirect('/')
  };

  const user = await getUserById(isLoggedIn.id)

  if (!user) throw new Error("User not found");

  
  
  return (
    <div className='fullscreen min-h-0 flex items-center justify-center overflow-y-hidden overflow-x-hidden pt-24'>

      <header className="fixed top-0 left-0 right-0 z-100 bg-secondary border-b-2">
        <div className="flex items-center justify-between py-3 px-5 h-16.25">
          <div className="flex items-center gap-3 w-full z-0">
      
            <div className="hidden md:block mr-2">
              <Logo text={false} iconSize={32}/>
            </div>
      
      
      
            <HeaderSeperator />
            <p className='text-lg font-semibold ml-2'>Institutions</p>
          
            
          </div>
        </div>
      </header>



      <div className='w-5xl min-w-5xl max-w-5xl h-screen min-h-screen max-h-screen'>
        <InstiPage 
          user={user}
        />
      </div>
    </div>

  )
}

export default page

