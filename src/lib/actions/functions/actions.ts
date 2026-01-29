'use server';

import { EdgeFunctionType } from "@/lib/types";
import JSZip from "jszip";
import getFunctionClient, { gcloud_project_id } from ".";
import { Storage } from "@google-cloud/storage";
import { revalidateTag } from "next/cache";
import { t } from "@/lib/utils";

export async function uploadEdgeFunction(
  func: EdgeFunctionType,
  projectId: string
) {
  const client = await getFunctionClient();
  const parent = `projects/${gcloud_project_id}/locations/us-central1`;
  const storage = new Storage({ projectId: gcloud_project_id });

  let sourceObjectName: string;

  try {
    const zip = new JSZip();
    func.files.forEach((file) => {
      zip.file(file.name, file.code);
    });

    zip.file("package.json", JSON.stringify({
      "name": `${projectId}-${func.slug}`,
      "version": "1.0.0",
      "main": "index.ts", 
      "dependencies": {
        "@google-cloud/functions-framework": "^3.4.0"  
      }
    }));


    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    sourceObjectName = `${projectId}/functions/${func.slug}/source.zip`;

    await storage.bucket(process.env.STORAGE_BUCKET_NAME!).file(sourceObjectName).save(zipBuffer, {
      contentType: "application/zip",
    });

    const functionId = `${projectId}-${func.slug}`;
    const functionPath = `${parent}/functions/${functionId}`;

    const [operation] = await client.createFunction({
      parent,
      functionId,
      function: {
        name: functionPath,
        buildConfig: {
          runtime: "nodejs24",
          entryPoint: "index",  // Your main handler function name
          source: {
            storageSource: {
              bucket: process.env.STORAGE_BUCKET_NAME!,
              object: sourceObjectName,
            },
          },
          // workerPool: `projects/${gcloud_project_id}/locations/us-central1/workerPools/${process.env.CLOUDBUILD_WORKER_POOL_NAME || 'default-pool'}`,
        },
        serviceConfig: {
          serviceAccountEmail: process.env.GOOGLE_MAIN_SERVICE_ACCOUNT_EMAIL!
        }
      },
    });

    console.log(`Deployment started for ${functionId}...`);
    await operation.promise();

    revalidateTag(t("edge-functions", projectId), "max")

  } catch (error: any) {
    console.error(`Failed to upload/create edge function "${func.slug}":`, error.message);

    if (error.code === 6) {
      throw error;
    }

    try {
      const functionPath = `projects/${gcloud_project_id}/locations/us-central1/functions/${func.slug}`;
      const [operation] = await client.deleteFunction({ name: functionPath });
      await operation.promise();
      console.log(`Cleaned up failed function: ${func.slug}`);
    } catch (deleteError: any) {
      if (deleteError.code === 5) {  // NOT_FOUND: Expected for most failures
        console.log(`No function to delete for ${func.slug} (not found).`);
      } else {
        console.error(`Failed to clean up ${func.slug}:`, deleteError.message);
      }
    }

    if (sourceObjectName!) {
      await storage.bucket(process.env.STORAGE_BUCKET_NAME!).file(sourceObjectName).delete();
    }

    throw error;  // Always re-throw original for caller awareness
  }
}
