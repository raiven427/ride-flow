import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  type ServerSideEncryption,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function storageConfig() {
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION || "auto";
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

  if (!bucket || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Storage is not configured. Set S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY.",
    );
  }

  return {
    bucket,
    client: new S3Client({
      region,
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
      credentials: { accessKeyId, secretAccessKey },
    }),
    publicBaseUrl: process.env.S3_PUBLIC_BASE_URL?.replace(/\/+$/, ""),
  };
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

function publicUrl(baseUrl: string | undefined, key: string): string | undefined {
  return baseUrl ? `${baseUrl}/${key}` : undefined;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const { bucket, client, publicBaseUrl } = storageConfig();
  const key = appendHashSuffix(normalizeKey(relKey));

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: data,
      ContentType: contentType,
      ServerSideEncryption: process.env.S3_SERVER_SIDE_ENCRYPTION as
        | ServerSideEncryption
        | undefined,
    }),
  );

  return {
    key,
    url: publicUrl(publicBaseUrl, key) || (await storageGetSignedUrl(key)),
  };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: await storageGetSignedUrl(key) };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const { bucket, client } = storageConfig();
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucket, Key: normalizeKey(relKey) }),
    { expiresIn: Number(process.env.S3_SIGNED_URL_TTL_SECONDS || 900) },
  );
}
