import { getIndexes } from '@/lib/actions/storage/vectors/cache-actions';
import React from 'react'
import IndexPage from '../_components/pages/IndexPage';
import VectorsPage from '../_components/pages/VectorsPage';

const page = async ({ params, searchParams }: PageProps<"/proj/[projectId]/storage/vectors">) => {

  const p = await params;
  const sp = await searchParams;

  const indexes = await getIndexes(p.projectId)

  const index = sp['index'] as string || ""

  return (
    <>
      {index ? (
        <IndexPage />
      ): (
        <VectorsPage 
          projectId={p.projectId}
          indexDetails={indexes}
        />
      )}
    </>
  )
}

export default page