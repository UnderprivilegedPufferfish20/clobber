import { get_institution_by_id } from "@/lib/actions/database/cache-actions"
import ProjectsPage from "./_components/pages/ProjectsPage";
import { Suspense } from "react";
import Loader from "@/components/Loader";

const page = async ({ params }: PageProps<"/institutions/[institution_id]">) => {
  const p = await params

  const inst = await get_institution_by_id(p.institution_id)

  if (!inst) throw new Error("Institution not found");

  return (
    <Suspense fallback={<Loader sz={96}/>}>
      <ProjectsPage 
        inst={inst}
      />
    </Suspense>
  )
}

export default page