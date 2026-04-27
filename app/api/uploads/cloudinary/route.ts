import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

function getErrorCode(error: unknown): string | undefined {
  const direct = (error as { code?: string })?.code;
  if (direct) return direct;
  return (error as { error?: { code?: string } })?.error?.code;
}

function isTransientNetworkError(error: unknown): boolean {
  const code = getErrorCode(error);
  return code === "ECONNRESET" || code === "ETIMEDOUT" || code === "ECONNABORTED";
}

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function uploadWithRetry(
  buffer: Buffer,
  folder: string,
  maxAttempts = 3
): Promise<{ secure_url: string; public_id: string }> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder, resource_type: "auto" }, (error, uploadResult) => {
            if (error || !uploadResult) return reject(error || new Error("Upload failed"));
            resolve({
              secure_url: uploadResult.secure_url,
              public_id: uploadResult.public_id,
            });
          })
          .end(buffer);
      });

      return result;
    } catch (error: unknown) {
      lastError = error;
      const shouldRetry = isTransientNetworkError(error);

      if (!shouldRetry || attempt === maxAttempts) {
        throw error;
      }
      await wait(250 * attempt);
    }
  }

  throw lastError ?? new Error("Upload failed");
}

async function uploadDataUriWithRetry(
  dataUri: string,
  folder: string,
  maxAttempts = 3
): Promise<{ secure_url: string; public_id: string }> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await cloudinary.uploader.upload(dataUri, {
        folder,
        resource_type: "auto",
      });
      return {
        secure_url: result.secure_url,
        public_id: result.public_id,
      };
    } catch (error: unknown) {
      lastError = error;
      if (!isTransientNetworkError(error) || attempt === maxAttempts) {
        throw error;
      }
      await wait(350 * attempt);
    }
  }

  throw lastError ?? new Error("Upload failed");
}

async function saveFileLocally(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<{ secure_url: string; public_id: string }> {
  const extFromName = path.extname(originalName || "").toLowerCase();
  const extFromType = mimeType === "application/pdf" ? ".pdf" : ".jpg";
  const ext = extFromName || extFromType;
  const dir = path.join(process.cwd(), "public", "uploads", "center-proofs");
  await mkdir(dir, { recursive: true });
  const fileName = `${Date.now()}-${randomUUID()}${ext}`;
  const filePath = path.join(dir, fileName);
  await writeFile(filePath, buffer);
  return {
    secure_url: `/uploads/center-proofs/${fileName}`,
    public_id: `local/${fileName}`,
  };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const folder = (formData.get("folder") as string) || "scanmitra/uploads";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    let result: { secure_url: string; public_id: string };
    try {
      result = await uploadWithRetry(buffer, folder);
    } catch (error: unknown) {
      if (!isTransientNetworkError(error)) {
        throw error;
      }

      // Fallback path for local TLS stream resets: upload as a data URI.
      const mimeType = file.type || "application/octet-stream";
      const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;
      try {
        result = await uploadDataUriWithRetry(dataUri, folder);
      } catch (fallbackError: unknown) {
        if (!isTransientNetworkError(fallbackError)) {
          throw fallbackError;
        }
        result = await saveFileLocally(buffer, file.name, mimeType);
      }
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Cloudinary upload error:", error);
    if (isTransientNetworkError(error)) {
      return NextResponse.json(
        { error: "Upload failed due to a temporary network issue. Please try again." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Upload failed. Please verify file and try again." }, { status: 500 });
  }
}
