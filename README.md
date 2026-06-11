# Factory Module Backend

Production-minded Express and MongoDB API starter.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Default API base:

```text
http://localhost:4000/api
```

## Routes

```text
GET    /api/health
GET    /api/v1/factories
POST   /api/v1/factories
GET    /api/v1/factories/:id
PATCH  /api/v1/factories/:id
DELETE /api/v1/factories/:id
```

Create factory payload:

```json
{
  "name": "Main Factory",
  "code": "FACT-001",
  "location": "Kochi",
  "isActive": true
}
```

## Layout

```text
src/
  app.js
  server.js
  config/
  db/
  middlewares/
  modules/
    factory/
    health/
  routes/
  utils/
```

## Scripts

```bash
npm run dev
npm start
npm run lint
npm test
```
