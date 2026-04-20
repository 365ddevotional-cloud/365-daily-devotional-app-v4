import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createApp } from "../server/app";

let handlerPromise: Promise<(req: VercelRequest, res: VercelResponse) => void> | null = null;

async function getHandler() {
  if (!handlerPromise) {
    handlerPromise = createApp({ enableStatic: false }).then(({ app }) => {
      return app as unknown as (req: VercelRequest, res: VercelResponse) => void;
    });
  }

  return handlerPromise;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const expressHandler = await getHandler();
  return expressHandler(req, res);
}
