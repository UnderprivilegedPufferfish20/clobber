import { get_institution_by_id } from '@/lib/actions/database/cache-actions'
import React from 'react'
import MemberCard from './_components/cards/MemberCard'
import { getUser } from '@/lib/actions/auth'
import AddTeamMemberDialog from './_components/AddTeamMemberDialog'

const page = async ({params}: PageProps<"/institutions/[institution_id]/team">) => {
  const p = await params

  const u = await getUser()
  if (!u) throw new Error("NO USER");

  const inst = await get_institution_by_id(p.institution_id)

  if (!inst) throw new Error("Institution not found");

  console.log("@MEMEBERS: ", inst.members)


  return (
    <div className='flex flex-col fullheight'>

      <div className='flex fullwidth items-baseline justify-between mb-8 p-2'>
        <h1 className='text-2xl font-bold'>Team</h1>
        <AddTeamMemberDialog iid={p.institution_id} user_id={u.id}/>
      </div>

      <header className='bg-secondary flex fullwidth items-center not-last:border-r p-2 rounded-t-lg'>
        
          <p className='pl-5 mr-7'>Picture</p>
        
        
          <p className='mr-25'>Name</p>
        
        
          <p>Email</p>
        
      </header>

      <MemberCard 
        {...inst.owner}
        owner={true}
      />

      {inst.members.map(m => (
        <MemberCard 
          {...m}
          key={m.id}
          owner={false}
        />
      ))}

    </div>
  )
}

export default page