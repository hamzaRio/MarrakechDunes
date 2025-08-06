# 🐪 MarrakechDunes

🕌 A full-stack Moroccan adventure booking platform built with **Vite**, **React**, **Tailwind CSS**, **Node.js**, and **MongoDB**.

---

## ✨ Features

- 🏜️ Book Moroccan desert adventures, spa, and cultural experiences
- 🔐 Admin panel to manage activities and availability
- 📲 WhatsApp-based booking confirmation
- 💵 Cash payment integration (PayPal/Card planned)
- 🚀 Fully deployable to Render (backend) and Vercel (frontend)

---

## 🧰 Tech Stack

- **Frontend**: Vite + React + TypeScript + Tailwind CSS  
- **Backend**: Node.js + Express + TypeScript  
- **Database**: MongoDB Atlas  
- **Deployment**: Render (server), Vercel (client)  
- **CI/CD**: GitHub Actions  

---

## ⚙️ Local Development

```bash
# 1. Install dependencies from root
npm install

# 2. Start frontend (in client/)
cd client
npm run dev

# 3. Start backend (in server/)
cd server
npm run dev

```

## 🚀 Deployment Checklist

### Render (Backend)
1. Set environment variables: `MONGODB_URI`, `SESSION_SECRET`, `JWT_SECRET`, `ADMIN_DEFAULT_PASSWORD`, and `CLIENT_URL` (comma separated list of frontend URLs).
2. Deploy the repo and ensure the `/attached_assets` folder is present.
3. After deployment, review Render logs for MongoDB, CORS, or 404 errors.

### Vercel (Frontend)
1. Set the environment variable `VITE_API_URL` to your Render backend URL.
2. The build step runs `scripts/check-attached-assets.cjs` to copy `/attached_assets` into `client/public/attached_assets`.
3. After deployment, verify images load and clear the Vercel cache when assets change.

### Verifying Deployment
Run the helper script to check API endpoints and static assets:

```bash
node scripts/check-deployment.mjs
```

Test CORS headers manually:

```bash
curl -I -H "Origin: https://your-frontend.vercel.app" \
  https://your-backend.onrender.com/api/health
```

Always review backend and frontend logs after each deploy to catch MongoDB, CORS, or 404 errors early.
