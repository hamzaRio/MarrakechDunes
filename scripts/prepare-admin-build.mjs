import { rm } from "node:fs/promises";

await rm("dist-admin", { recursive: true, force: true });
