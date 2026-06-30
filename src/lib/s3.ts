import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

  const s3Client = new S3Client({
    region: process.env.OCI_S3_REGION!,
    endpoint: `https://${process.env.OCI_S3_NAMESPACE!}.compat.objectstorage.${process.env.OCI_S3_REGION!}.oraclecloud.com`,
    credentials: {
      accessKeyId: process.env.OCI_S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.OCI_S3_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  });

  const command = new GetObjectCommand({
    Bucket: process.env.OCI_S3_BUCKET_NAME!,
    Key: process.env.S3_PDF_KEY!,
    ResponseContentDisposition: `attachment; filename="${process.env.S3_PDF_KEY}"`,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 300 });
}
