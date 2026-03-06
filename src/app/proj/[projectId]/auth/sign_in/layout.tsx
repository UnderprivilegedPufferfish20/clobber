import React, { PropsWithChildren } from 'react'
import Sidebar from '../_components/Sidebar'

const layout = ({children}: PropsWithChildren) => {
  return (
    <div className='flex flex-1 fullscreen'>
        <Sidebar />
        {children}
    </div>
  )
}

export default layout