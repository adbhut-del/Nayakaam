# Nayakaam Productions

Website and admin panel for project highlights. Deployed on [Vercel](https://vercel.com).

## Local development

```bash
pip install -r requirements.txt
python server.py
```

- Site: http://localhost:5000  
- Admin: http://localhost:5000/admin.html (default login: `admin` / `admin123`)

Data is stored in `nayakaam_productions.db` (SQLite) and uploaded images in `uploads/`.

## Vercel + Neon (production)

**Full step-by-step:** see [VERCEL_SETUP.md](VERCEL_SETUP.md)

1. Connect **Neon** (`neon-cordovan-battery`) to your Nayakaam Vercel project.
2. Redeploy — tables are created automatically.
3. Optional: add **Vercel Blob** for persistent image uploads.
4. Test: `https://your-site.vercel.app/api/health` → `"database": "neon"`.
5. Add content at `/admin.html`.

### Optional: copy local SQLite to Vercel Postgres

If you already have data in `nayakaam_productions.db` locally:

```bash
set POSTGRES_URL=postgres://...   # from Vercel → Storage → .env.local
pip install -r requirements.txt
python scripts/migrate_to_postgres.py
```

### Uploaded images on Vercel

Uploaded image files still go to `/tmp` on Vercel and may disappear after a while. For production, prefer:

- A **YouTube** (or Instagram) video URL so the thumbnail is stored as a public URL, or  
- Later: [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) for file storage.

### Environment variables (Vercel → Settings → Environment Variables)

| Variable | Purpose |
|----------|---------|
| `POSTGRES_URL` | Set automatically when Postgres storage is linked |
| `GMAIL_USER` | Sender for contact form emails |
| `GMAIL_PASSWORD` | Gmail app password |
| `RECEIVER_EMAIL` | Where contact notifications are sent |
| `MAIL_ENABLED` | `true` or `false` |
