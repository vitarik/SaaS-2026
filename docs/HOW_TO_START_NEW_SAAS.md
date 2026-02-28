# How to start a new SaaS from this template

1) Copy the repo folder and rename it.
2) Keep:
- `server/src/modules/auth`
- `server/src/modules/users`
- `client/*` (or replace with your UI)
3) Delete or ignore:
- `server/legacy_family_planner` (example / previous app)
4) Create your new business module:
- `server/src/modules/<your_app>/...`
- Add routes in `server/src/app.js`
