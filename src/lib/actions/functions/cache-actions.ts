"use cache";

import { EdgeFunctionSecretType, EdgeFunctionType } from "@/lib/types";
import getFunctionClient, { gcloud_project_id } from ".";
import { cacheTag } from "next/cache";
import { t } from "@/lib/utils";

export async function getEdgeFunctions(
    projectId: string,
): Promise<EdgeFunctionType[]> {
  cacheTag(t("edge-functions", projectId))
    
  const client = await getFunctionClient();
  const parent = `projects/${gcloud_project_id}/locations/us-central1`;

  try {
    // Fetches 2nd Gen Cloud Run functions
    const [functions] = await client.listFunctions({ parent });
    const edgeFunctions: EdgeFunctionType[] = functions.filter(fn => {
      console.log(fn.name)
      return fn.name?.includes(`${projectId}-`)
    }).map((fn) => {
      // The 'name' is the full path: projects/{p}/locations/{l}/functions/{name}
      const slug = fn.name?.split("/").pop()?.replace(`${projectId}-`, "") || "unknown";
        

      const func: EdgeFunctionType = {
        slug,
        url: fn.name || "",
        createdAt: fn.updateTime, // v2 metadata usually tracks updateTime for the current revision
        updatedAt: fn.updateTime,
        deploymentCount: 1, // API metadata doesn't natively track total historical deployments
        files: [
          {
            name: "source",
            // The actual code is stored in Cloud Storage; this provides the reference path
            code: "",
          },
        ],
      }

      return func
    });

    return edgeFunctions as EdgeFunctionType[];
  } catch (error) {
    console.error("Error listing Cloud Run functions:", error);
    throw error;
  }
}

export async function getEdgeFunctionSecrets(
  projectId: string
): Promise<EdgeFunctionSecretType[]> {
  return []
}