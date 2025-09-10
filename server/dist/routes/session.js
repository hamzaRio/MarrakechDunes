import { Router } from "express";
const router = Router();
router.post("/init", (req, res) => res.json({ ok: true }));
router.get("/test", (req, res) => res.json({ ok: true }));
export default router;
