import { createServer } from "http";
import next from "next";
import { initSocketServer } from "@/lib/socket-server";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = Number(process.env.PORT || 3000);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

async function bootstrap() {
  await app.prepare();
  const httpServer = createServer((req, res) => handle(req, res));
  initSocketServer(httpServer);
  httpServer.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`> ScanMitra server ready on http://${hostname}:${port}`);
  });
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server:", error);
  process.exit(1);
});
