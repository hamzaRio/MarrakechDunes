import { Router, Request, Response } from "express";
import session from "express-session";

// Extend Request interface to include proper session typing
interface SessionRequest extends Request {
  session: session.Session & Partial<session.SessionData>;
}

const router = Router();

const respond = (_req: Request, res: Response) => res.sendStatus(204);

// Remove GET /init to prevent shadowing of /api/session/init handler
// Keep POST /init if needed by other flows
router.post("/init", respond);
router.get("/test", (req, res) => res.json({ ok: true }));

export default router;
