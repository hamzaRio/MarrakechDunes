import { Router, Request, Response } from "express";
import session from "express-session";

// Extend Request interface to include proper session typing
interface SessionRequest extends Request {
  session: session.Session & Partial<session.SessionData>;
}

const router = Router();

router.post("/init", (req: SessionRequest, res: Response) => {
  if (!req.session.initialized) req.session.initialized = true;
  res.json({ ok: true });
});

export default router;
