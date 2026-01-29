import "server-only";
import { FunctionServiceClient } from "@google-cloud/functions/build/src/v2";
import {GoogleAuth} from 'google-auth-library';

const auth = new GoogleAuth({
  scopes: 'https://www.googleapis.com/auth/cloud-platform',
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

export const gcloud_project_id: string = process.env.GCP_PROJECT_ID!
if (!gcloud_project_id) throw new Error("Missing cloud project id in .env");

// Extend globalThis to store the client singleton, similar to your DB connector
const g = globalThis as unknown as {
  __functionClient?: FunctionServiceClient;
};

export default async function getFunctionClient() {
  if (!g.__functionClient) {
    g.__functionClient = new FunctionServiceClient({ projectId: gcloud_project_id });

  }

  return g.__functionClient;


}