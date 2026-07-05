import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function createS3Client(): S3Client {
  return new S3Client({
    region: process.env.OCI_S3_REGION!,
    endpoint: `https://${process.env.OCI_S3_NAMESPACE!}.compat.objectstorage.${process.env.OCI_S3_REGION!}.oraclecloud.com`,
    credentials: {
      accessKeyId: process.env.OCI_S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.OCI_S3_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  });
}

export function isS3Configured(): boolean {
  return !!(
    process.env.OCI_S3_BUCKET_NAME &&
    process.env.OCI_S3_ACCESS_KEY_ID &&
    process.env.OCI_S3_SECRET_ACCESS_KEY &&
    process.env.OCI_S3_NAMESPACE &&
    process.env.OCI_S3_REGION &&
    process.env.S3_PDF_KEY
  );
}

export async function getDownloadUrl(): Promise<string> {
  if (!isS3Configured()) {
    throw new Error("S3 is not configured");
  }

  const command = new GetObjectCommand({
    Bucket: process.env.OCI_S3_BUCKET_NAME!,
    Key: process.env.S3_PDF_KEY!,
    ResponseContentDisposition: `attachment; filename="${process.env.S3_PDF_KEY}"`,
  });

  return getSignedUrl(createS3Client(), command, { expiresIn: 300 });
}

export async function uploadFile(key: string, file: Buffer, contentType: string): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: process.env.OCI_S3_BUCKET_NAME!,
    Key: key,
    Body: file,
    ContentType: contentType,
  });
  await createS3Client().send(command);
}

export async function getFileSignedUrl(key: string, fileName: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.OCI_S3_BUCKET_NAME!,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${fileName}"`,
  });
  return getSignedUrl(createS3Client(), command, { expiresIn: 300 });
}

export async function uploadPublicImage(key: string, file: Buffer, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.OCI_PUBLIC_BUCKET_NAME!,
    Key: key,
    Body: file,
    ContentType: contentType,
  });
  await createS3Client().send(command);
  return `https://objectstorage.${process.env.OCI_S3_REGION!}.oraclecloud.com/n/${process.env.OCI_S3_NAMESPACE!}/b/${process.env.OCI_PUBLIC_BUCKET_NAME!}/o/${encodeURIComponent(key)}`;
}

export async function deletePublicImage(key: string): Promise<void> {
  const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
  await createS3Client().send(new DeleteObjectCommand({
    Bucket: process.env.OCI_PUBLIC_BUCKET_NAME!,
    Key: key,
  }));
}
