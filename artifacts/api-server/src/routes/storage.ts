import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import { LocalObjectStorageService, ObjectNotFoundError } from "../lib/localObjectStorage";

const router: IRouter = Router();
const objectStorageService = new LocalObjectStorageService();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

/**
 * POST /storage/uploads
 *
 * Server-side file upload. Files are stored on local disk under
 * artifacts/api-server/uploads and served back via GET /storage/objects/*.
 * Client sends multipart/form-data with a "file" field.
 */
router.post("/storage/uploads", upload.single("file"), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: "No file provided" });
    return;
  }

  try {
    const { objectPath } = await objectStorageService.saveUpload(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
    );

    res.json({ objectPath, servingUrl: `/api/storage${objectPath}` });
  } catch (err) {
    req.log.error({ err }, "Error uploading file to local storage");
    res.status(500).json({ error: "Upload failed" });
  }
});

/**
 * GET /storage/objects/*
 * GET /storage/public-objects/*
 *
 * Serve uploaded files from local disk. Both routes point at the same
 * local uploads directory since there is no separate public/private
 * bucket concept for local storage.
 */
async function serveObject(req: Request, res: Response, wildcardPath: string) {
  try {
    const objectPath = `/objects/${wildcardPath}`;
    const { filePath, contentType, size } = await objectStorageService.getObjectFile(objectPath);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", String(size));
    res.setHeader("Cache-Control", "public, max-age=3600");

    objectStorageService.createReadStream(filePath).pipe(res);
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      res.status(404).json({ error: "Object not found" });
      return;
    }
    req.log.error({ err: error }, "Error serving object");
    res.status(500).json({ error: "Failed to serve object" });
  }
}

router.get("/storage/objects/*path", async (req: Request, res: Response) => {
  const raw = req.params.path;
  const wildcardPath = Array.isArray(raw) ? raw.join("/") : raw;
  await serveObject(req, res, wildcardPath);
});

router.get("/storage/public-objects/*filePath", async (req: Request, res: Response) => {
  const raw = req.params.filePath;
  const filePath = Array.isArray(raw) ? raw.join("/") : raw;
  await serveObject(req, res, filePath);
});

export default router;
