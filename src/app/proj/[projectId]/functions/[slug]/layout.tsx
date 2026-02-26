import React, { PropsWithChildren } from 'react'
import Sidebar from './_components/Sidebar'

const FunctionLayout = ({children}: PropsWithChildren ) => {
  return (
    <div className='flex fullscreen flex-1'>
        <Sidebar />
        <div className='overflow-y-hidden overflow-x-hidden h-full flex-1 min-w-0'>
            {children}
        </div>
    </div>
  )
}

export default FunctionLayout