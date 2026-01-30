"use cache";

import { t } from "@/lib/utils";
import { cacheTag } from "next/cache";
import { getProjectById } from "@/lib/actions/database/cache-actions";
import { getTenantPool } from "@/lib/actions/database/tennantPool";

export async function getFolderData(projectId: string, path: string) {
  cacheTag(t("folder-data", `${projectId}/${path}`));

  const project = await getProjectById(projectId);
  if (!project) throw new Error("Project not found");

  const pool = await getTenantPool({
    connectionName: process.env.CLOUD_SQL_CONNECTION_NAME!,
    user: project.db_user,
    password: project.db_pwd,
    database: project.db_name
  });

  const bucketName = path.split("/")[0];
  const bucketResult = await pool.query(`
    SELECT *
    FROM storage.buckets
    WHERE "projectId" = $1 AND name = $2
  `, [projectId, bucketName]);

  if (bucketResult.rowCount !== 1) throw new Error("Bucket not found");

  const bucket = bucketResult.rows[0];

  const normalizedPath = path.replace(/^\/+|\/+$/g, "");
  const prefix = `${projectId}/${normalizedPath}/`;
  const prefixDepth = prefix.split('/').length;

  const placeholder = `${prefix}.placeholder`;

  // Fetch all potential children (starting with prefix)
  const objectsResult = await pool.query(`
    SELECT *
    FROM storage.objects
    WHERE name LIKE $1 || '%' AND name != $2
    ORDER BY name ASC
  `, [prefix, placeholder]);

  const allObjects = objectsResult.rows;

  // Filter in code to get only immediate children
  const immediateChildren = allObjects.filter(obj => {
    const remainingPath = obj.name.slice(prefix.length);
    const parts = remainingPath.split('/');

    // Direct file: one part, not ending with .placeholder
    if (parts.length === 1 && parts[0] !== '.placeholder') {
      return true;
    }

    // Immediate child folder: two parts, second is .placeholder
    if (parts.length === 2 && parts[1] === '.placeholder') {
      return true;
    }

    return false;
  });

  return immediateChildren;
}