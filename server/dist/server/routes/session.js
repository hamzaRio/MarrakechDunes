import { Router } from "express";
const router = Router();
router.post("/init", (req, res) => {
    if (!req.session.initialized)
        req.session.initialized = true;
    res.json({ ok: true });
});
export default router;
