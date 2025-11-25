import React from 'react'
import { Loader2Icon } from 'lucide-react'

const Loader = ({sz = 32}: { sz?: number}) => {
  return <Loader2Icon className='animate-spin' size={sz}/>;
}

export default Loader