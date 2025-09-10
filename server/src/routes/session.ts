import { Router, Request, Response } from "express";
import session from "express-session";

// Extend Request interface to include proper session typing
interface SessionRequest extends Request {
  session: session.Session & Partial<session.SessionData>;
}

const router = Router();

router.post("/init", (req, res) => res.json({ ok: true }));
router.get("/test", (req, res) => res.json({ ok: true }));

export default router;
