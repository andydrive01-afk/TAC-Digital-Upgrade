import { createReadStream, existsSync } from "fs";
import { mkdir, readFile, stat, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

const UPLOADS_ROOT = path.resolve(process.cwd(), "uploads");

function safeJoin(root: string, relativePath: string): string {
  const resolved = path.resolve(root, relativePath);
  if (!resolved.startsWith(root)) {
    throw new ObjectNotFoundError();
  }
  return resolved;
}

export class LocalObjectStorageService {
  private async ensureUploadsDir(): Promise<void> {
    await mkdir(UPLOADS_ROOT, { recursive: true });
  }

  async saveUpload(
    buffer: Buffer,
    originalName: string,
    contentType: string,
  ): Promise<{ objectPath: string }> {
    await this.ensureUploadsDir();

    const objectId = randomUUID();
    const ext = (originalName.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
    const fileName = ext ? `${objectId}.${ext}` : objectId;
    const filePath = safeJoin(UPLOADS_ROOT, fileName);

    await writeFile(filePath, buffer);
    await writeFile(`${filePath}.meta.json`, JSON.stringify({ contentType }));

    return { objectPath: `/objects/${fileName}` };
  }

  async getObjectFile(objectPath: string): Promise<{ filePath: string; contentType: string; size: number }> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    const relativePath = objectPath.slice("/objects/".length);
    const filePath = safeJoin(UPLOADS_ROOT, relativePath);

    if (!existsSync(filePath)) {
      throw new ObjectNotFoundError();
    }

    let contentType = "application/octet-stream";
    try {
      const meta = JSON.parse(await readFile(`${filePath}.meta.json`, "utf-8")) as { contentType?: string };
      if (meta.contentType) contentType = meta.contentType;
    } catch {
      // no metadata file, fall back to default content type
    }

    const stats = await stat(filePath);
    return { filePath, contentType, size: stats.size };
  }

  createReadStream(filePath: string) {
    return createReadStream(filePath);
  }
}
