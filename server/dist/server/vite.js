import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { nanoid } from "nanoid";
// Node-compatible path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Simple logger replacement for createLogger
const viteLogger = {
    info: (msg) => console.log(`[Vite] ${msg}`),
    warn: (msg) => console.warn(`[Vite] ${msg}`),
    error: (msg) => console.error(`[Vite] ${msg}`),
    hasWarned: false
};
export function log(message, source = "express") {
    const formattedTime = new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });
    console.log(`${formattedTime} [${source}] ${message}`);
}
export async function setupVite(app, server) {
    try {
        // Dynamic import to avoid TypeScript issues
        const viteModule = await import("vite");
        const createViteServer = viteModule.default?.createServer || viteModule.createServer;
        const serverOptions = {
            middlewareMode: true,
            hmr: { server },
            allowedHosts: true,
        };
        // Load vite config dynamically at runtime
        const config = (await import(process.env.NODE_ENV === "production"
            ? "../client/vite.config.js"
            : "../client/vite.config.ts")).default;
        const vite = await createViteServer({
            ...config,
            configFile: false,
            customLogger: {
                ...viteLogger,
                error: (msg) => {
                    viteLogger.error(msg);
                    process.exit(1);
                },
            },
            server: serverOptions,
            appType: "custom",
        });
        app.use(vite.middlewares);
        app.use("*", async (req, res, next) => {
            const url = req.originalUrl;
            try {
                const clientTemplate = path.resolve(__dirname, "..", "client", "index.html");
                // always reload the index.html file from disk incase it changes
                let template = await fs.promises.readFile(clientTemplate, "utf-8");
                template = template.replace(`src="/src/main.tsx"`, `src="/src/main.tsx?v=${nanoid()}"`);
                const page = await vite.transformIndexHtml(url, template);
                res.status(200).set({ "Content-Type": "text/html" }).end(page);
            }
            catch (e) {
                vite.ssrFixStacktrace(e);
                next(e);
            }
        });
    }
    catch (error) {
        console.error("Failed to setup Vite:", error);
        throw error;
    }
}
export function serveStatic(app) {
    const distPath = path.resolve(__dirname, "..", "client", "dist");
    if (!fs.existsSync(distPath)) {
        throw new Error(`Could not find the build directory: ${distPath}, make sure to build the client first`);
    }
    app.use(express.static(distPath));
    // fall through to index.html if the file doesn't exist
    app.use("*", (_req, res) => {
        res.sendFile(path.resolve(distPath, "index.html"));
    });
}
