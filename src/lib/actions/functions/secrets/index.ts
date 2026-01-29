"use server";

import { EdgeFunctionSecretType } from '@/lib/types';
import { t } from '@/lib/utils';
import {SecretManagerServiceClient} from '@google-cloud/secret-manager';
import { revalidateTag } from 'next/cache';
const client = new SecretManagerServiceClient();
const parent = `projects/${process.env.GCP_PROJECT_ID!}`;

export async function createSecret(sec: EdgeFunctionSecretType, projectId: string) {
    const [secret] = await client.createSecret({
        parent: parent,
        secretId: `${projectId}-${sec.name}`,
        secret: { replication: { automatic: {} } },
    });

  // Add the initial version (the actual encrypted value)
    await client.addSecretVersion({
        parent: secret.name,
        payload: { data: Buffer.from(sec.value, 'utf8') },
    });

    revalidateTag(t("secrets", projectId), "max")
}

export async function updateSecret(key: string, neVal: string, projectId: string) {
  await client.addSecretVersion({
    parent: `${parent}/secrets/${`${projectId}-${key}`}`,
    payload: { data: Buffer.from(neVal, 'utf8') },
  });

  revalidateTag(t("secrets", projectId), "max")
}

export async function deleteSecret(key: string, projectId: string) {
    await client.deleteSecret({
        name: `${parent}/secrets/${`${projectId}-${key}`}`,
    });

    revalidateTag(t("secrets", projectId), "max")
}
