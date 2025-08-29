import React from 'react'

const page = async ({params}: { params: { projectId: string, databaseId: string } }) => {
  const p = await params

  return (
    <h1>men</h1>
  )
}

export default page