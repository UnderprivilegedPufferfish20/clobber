"use cache";

import { EdgeFunctionSecretType } from '@/lib/types';
import { t } from '@/lib/utils';
import {SecretManagerServiceClient} from '@google-cloud/secret-manager';
import { cacheTag } from 'next/cache';

const client = new SecretManagerServiceClient();
const parent = `projects/${process.env.GCP_PROJECT_ID!}`;

export default async function getSecrets(projectId: string): Promise<EdgeFunctionSecretType[]> {
    cacheTag(t("secrets", projectId))
    const prefix = `${projectId}-`
    const [secrets] = await client.listSecrets({ parent });

    return secrets
        // 1. Filter out the secrets that don't match your prefix
        .filter(secret => secret.name?.split('/').at(-1)?.includes(prefix))
        // 2. Transform the remaining secrets into your "obj" shape
        .map(secret => {
            const secretId = secret.name!.split('/').at(-1)!;
            const key = secretId.replace(prefix, "");
            
            // Return the actual object shape here
            return {
                createdAt: (secret.createTime as any)?.seconds 
                    ? new Date((secret.createTime as any).seconds * 1000).toLocaleDateString()
                    : "N/A",
                name: key,
                updatedAt: new Date().toLocaleDateString(),
                value: "" // Note: Secret values require a separate 'accessSecretVersion' call
            };
        });
}
