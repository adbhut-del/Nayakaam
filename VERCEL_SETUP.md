# Vercel + Neon setup for Nayakaam

Follow these steps after pushing the latest code to GitHub.

## Part 1 — Neon database (admin data)

1. Go to [vercel.com](https://vercel.com) → your **Nayakaam website** project.
2. Open **Storage** → your database **neon-cordovan-battery** (or create **Postgres / Neon**).
3. Click **Connect to Project** → select the **same** Nayakaam site project.
4. Enable **Production** (and **Preview** if you use it) → **Connect**.
5. Open project **Settings** → **Environment Variables**.
6. Confirm these exist (values hidden is OK):
   - `POSTGRES_URL`
   - `DATABASE_URL`
7. **Deployments** → **⋯** on latest → **Redeploy** → wait for **Ready**.

Tables `highlights` and `messages` are created automatically on first visit.

**Test:** open `https://YOUR-SITE.vercel.app/api/health`  
You should see `"database": "neon"`.

---

## Part 2 — Vercel Blob (uploaded images, optional but recommended)

Without Blob, uploaded JPG/PNG files may disappear on Vercel. YouTube URLs still work without Blob.

1. In the same Vercel project → **Storage** → **Create Database** → **Blob**.
2. Name it (e.g. `nayakaam-images`) → **Create** → **Connect to Project**.
3. Vercel adds `BLOB_READ_WRITE_TOKEN` to environment variables.
4. **Redeploy** again.

**Test:** add a highlight in admin with an **uploaded image** (not only YouTube). Image should still load after redeploy.

---

## Part 3 — Use admin panel

1. Open `https://YOUR-SITE.vercel.app/admin.html`
2. Login: `admin` / `admin123` (change in `admin.js` before going live)
3. Add projects → they save to **Neon**
4. Homepage **Projects** section updates automatically

---

## Part 4 — Push code from your PC

```powershell
cd C:\Users\PC\Downloads\Nayakaam
git add .
git commit -m "Neon database and Vercel Blob support"
git push
```

Vercel redeploys from GitHub if the project is linked.

---

## Part 5 — Verify in Neon Console

1. **Storage** → Neon → **Open in Neon Console**
2. **SQL Editor**:

```sql
SELECT id, title, created_at FROM highlights ORDER BY created_at DESC;
```

3. Add a row in admin → run query again → row should appear.

---

## Optional — Contact email

**Settings** → **Environment Variables** → add:

| Name | Value |
|------|--------|
| `GMAIL_USER` | your Gmail |
| `GMAIL_PASSWORD` | Gmail App Password |
| `RECEIVER_EMAIL` | inbox for inquiries |
| `MAIL_ENABLED` | `true` |

Redeploy after adding.

---

## Checklist

- [ ] Neon connected to Nayakaam project
- [ ] `POSTGRES_URL` on project env vars
- [ ] Code pushed and deployment **Ready**
- [ ] `/api/health` shows `"database": "neon"`
- [ ] Admin adds highlight; survives redeploy
- [ ] (Optional) Blob connected; `BLOB_READ_WRITE_TOKEN` set
- [ ] (Optional) Uploaded image works after redeploy
