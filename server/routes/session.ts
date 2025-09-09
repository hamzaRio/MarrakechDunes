import { Router, Request, Response } from "express";

const router = Router();

router.post("/init", (req: Request, res: Response) => {
  if (!req.session.initialized) req.session.initialized = true;
  res.json({ ok: true });
});

export default router;
