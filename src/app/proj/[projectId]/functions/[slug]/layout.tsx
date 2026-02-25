import React, { PropsWithChildren } from 'react'
import Sidebar from './_components/Sidebar'

const FunctionLayout = ({children}: PropsWithChildren ) => {
  return (
    <div className='flex fullscreen flex-1'>
        <Sidebar />
        <div className='overflow-y-scroll overflow-x-hidden fullscreen flex-1'>
            {children}
        </div>
    </div>
  )
}

export default FunctionLayout