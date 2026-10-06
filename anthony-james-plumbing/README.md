# Anthony James Plumbing — website + owner dashboard

One-page marketing site with animated water/pipe motion graphics (pure CSS/SVG/canvas, no external assets) and a zero-dependency Node backend.

## Run
```bash
cd anthony-james-plumbing
ADMIN_PASSWORD='choose-a-strong-password' npm start   # PORT=3000 by default
```
- Site: `http://localhost:3000/`  · Owner dashboard: `http://localhost:3000/admin`
- If `ADMIN_PASSWORD` is not set, a random password is printed on first start (stored hashed in `data/auth.json`; changeable in the dashboard).

## Owner dashboard
- **Quote requests**: status (new/contacted/quoted/won/lost), private notes, search/filter, delete, CSV export.
- **Website content**: phone, email, hours, address, headline, about text, banner, services, reviews, rating. Saved changes go live immediately.
- **Account**: change password.

## Notes
- Data lives in `data/db.json` (git-ignored). Back it up; on hosts with ephemeral disks, use a persistent volume or swap `loadDb/saveDb` for a hosted DB.
- Serve over HTTPS in production.
- Review text comes from the public Google listing; edit copy and claims in the dashboard to match the business.
