import { copyFile, readdir, rm } from "node:fs/promises";

await copyFile("dist-admin/admin.html", "dist-admin/index.html");
await rm("dist-admin/manifest.webmanifest", { force: true });
for (const file of await readdir("dist-admin")) {
  if (file === "sw.js" || file.startsWith("workbox-")) {
    await rm(`dist-admin/${file}`, { force: true });
  }
}
