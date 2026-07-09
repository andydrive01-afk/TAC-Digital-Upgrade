import app from "./app";
import { logger } from "./lib/logger";

// Fail fast on missing secrets so no admin token can ever be minted or verified
// with a predictable fallback string.
if (!process.env["SESSION_SECRET"]) {
  console.error("FATAL: SESSION_SECRET environment variable is required but not set.");
  process.exit(1);
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
