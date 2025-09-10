import { Router, Request, Response } from "express";
import session from "express-session";

// Extend Request interface to include proper session typing
interface SessionRequest extends Request {
  session: session.Session & Partial<session.SessionData>;
}

const router = Router();

router.post("/init", (req: SessionRequest, res: Response) => {
  if (!req.session.initialized) {
    req.session.initialized = true;
    // Initialize session with guest user if no user exists
    if (!req.session.user) {
      req.session.user = { 
        id: 'guest', 
        username: 'guest', 
        role: 'guest' 
      };
    }
  }
  res.json({ ok: true, session: req.session });
});

export default router;
