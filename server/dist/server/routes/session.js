import { Router } from "express";
const router = Router();
router.post("/init", (req, res) => {
    console.log("Session init route called");
    return res.status(200).json({ ok: true, message: "Session initialized" });
});
router.get("/test", (req, res) => {
    console.log("Session test route called");
    return res.status(200).json({ ok: true, message: "Session test" });
});
export default router;
