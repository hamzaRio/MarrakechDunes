import { Router, Request, Response } from "express";
import session from "express-session";

// Extend Request interface to include proper session typing
interface SessionRequest extends Request {
  session: session.Session & Partial<session.SessionData>;
}

const router = Router();

router.post("/init", (req: SessionRequest, res: Response) => {
  console.log("Session init route called");
  return res.status(200).json({ ok: true, message: "Session initialized" });
});

router.get("/test", (req, res) => res.json({ ok: true }));

export default router;
