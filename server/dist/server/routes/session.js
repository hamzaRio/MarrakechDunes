import { Router } from "express";
const router = Router();
router.post("/init", (req, res) => {
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
