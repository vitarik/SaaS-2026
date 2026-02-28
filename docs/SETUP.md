# SaaS Template Setup (SQL + JWT)

## Server
1) Copy env:
- `cp server/.env.example server/.env`

2) Install:
- `cd server && npm i`

3) Create DB and run SQL:
- Create a Postgres database (e.g. `saas_template`)
- Run:
  - `server/sql/001_init.sql`
  - `server/sql/002_users.sql`

4) Run:
- `npm run dev`

Server health:
- `GET http://localhost:5000/api/health`

## Client
1) Install:
- `cd client/client && npm i`

2) Run:
- `npm start`

Login/Register will call `/api/auth/*`.
