import FilesPage from './_components/pages/FilesPage';
import { getBucketNames } from '@/lib/actions/storage/files/cache-actions';
import FoldersPage from './_components/pages/FoldersPage';
import { getFolderData } from '@/lib/actions/storage/files/folder/cache-actions';


const BucketsPage = async ({ params, searchParams }: PageProps<"/proj/[projectId]/storage">) => {
  const p = await params;
  const sp = await searchParams;

  const currentPath = (sp['path'] as string) || ""

  const folderData = currentPath ? await getFolderData(p.projectId, currentPath) : []
  const buckets = await getBucketNames(p.projectId);

  return (
    <>
      {currentPath ? (
        <FoldersPage 
          bucketName={currentPath.split("/")[0]}
          folderData={folderData}
        />
      ) : (
         <FilesPage projectId={p.projectId} bucketDetails={buckets} />
      )}
    </>
  )
}

export default BucketsPage