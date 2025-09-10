import { Router } from "express";
const router = Router();
router.post("/init", (req, res) => {
    return res.status(200).json({ ok: true, message: "Session initialized" });
});
export default router;
