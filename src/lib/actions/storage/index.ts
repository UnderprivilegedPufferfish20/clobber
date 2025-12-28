import "server-only";
import { Storage, Bucket } from "@google-cloud/storage";
import path from "path";

const g = globalThis as unknown as {
  __storageClient?: Storage;
  __bucket?: Bucket;
};

const BUCKET_NAME = "testing123456ffff";
const PROJECTID = "clobber-469419";

function storageClient(): Storage {
  if (!g.__storageClient) {
    const keyFilename = path.join(process.cwd(), "ADC-key.json");

    console.log("keyFilename: ", keyFilename)

    g.__storageClient = new Storage({
      keyFilename,
      projectId: PROJECTID
    });
  }

  return g.__storageClient;
}

export default function getBucket(): Bucket {
  if (!g.__bucket) {
    const client = storageClient();
    g.__bucket = client.bucket(BUCKET_NAME);
  }

  return g.__bucket;
}
