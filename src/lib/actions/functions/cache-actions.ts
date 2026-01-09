"use cache";

import { EdgeFunctionType } from "@/lib/types";
import getFunctionClient, { gcloud_project_id } from ".";

export async function getEdgeFunctions(
    projectId: string,
): Promise<EdgeFunctionType[]> {
    
const client = await getFunctionClient();
  const parent = `projects/${gcloud_project_id}/locations/-`;

  try {
    // Fetches 2nd Gen Cloud Run functions
    const [functions] = await client.listFunctions({ parent });
    const edgeFunctions: EdgeFunctionType[] = functions.map((fn) => {
      // The 'name' is the full path: projects/{p}/locations/{l}/functions/{name}
      const slug = fn.name?.split("/").pop() || "unknown";
        

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