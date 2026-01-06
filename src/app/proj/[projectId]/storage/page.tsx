import Loader from '@/components/Loader';
import { Separator } from '@/components/ui/separator'
import React, { Suspense } from 'react'
import { StorageNavbar } from './_components/NavBar';
import FilesPage from './_components/pages/FilesPage';
import { getBucketNames } from '@/lib/actions/storage/files/cache-actions';
import FoldersPage from './_components/pages/FoldersPage';
import { getFolderData } from '@/lib/actions/storage/files/folder/cache-actions';

type PageType = 
  | "files"
  | "vectors"
  | "rag"

const BucketsPage = async ({ params, searchParams }: PageProps<"/proj/[projectId]/storage">) => {
  const p = await params;
  const sp = await searchParams;

  // Determine current page - default to table_editor
  const currentPage = (sp["page"] as PageType) || 'files';

  let pageContent: React.ReactNode;

  switch (currentPage) {
    case 'files': {
      if (sp['path']) {
        const folderData = await getFolderData(p.projectId, sp["path"] as string)

        pageContent = (
          <>
            <div className='flex-1'>
              <FoldersPage 
                bucketName={(sp['path'] as string).split("/")[0]}
                folderData={folderData}
              />
            </div>
          </>
        )
        break
      }

      const buckets = await getBucketNames(p.projectId);
      pageContent = (
        <>
          <div className="flex-1">
            <FilesPage projectId={p.projectId} bucketDetails={buckets} />
          </div>
        </>
      );
      break;
    }
    default: {
      pageContent = <p>Not Implemented</p>;
    }
  }

  return (
    <Suspense fallback={<Loader sz={168} />}>
      <div className="fullscreen flex flex-col overflow-hidden">
        <header className="w-full h-20 min-h-20 max-h-20 flex gap-2 items-center-safe p-2 px-4">
          <span className="font-semibold text-3xl mr-8">Storage</span>
          <StorageNavbar />
        </header>

        <Separator />

        <div className="flex-1 flex overflow-hidden fullscreen">
          {pageContent}
        </div>
      </div>
    </Suspense>
  );
}

export default BucketsPage