# Office Map Nest Backend

NestJS rewrite of the original Spring `map-service` backend.

## Run

```bash
npm install
docker compose up -d
npm run start:dev
```

Default port is `8080`, so the existing Vite proxy can keep using `/api`.

## Local Defaults

- API: `http://localhost:8080`
- Frontend CORS origin: `http://localhost:5173`
- PostgreSQL: `localhost:5432`, database `map_service`, user `postgres`, password `postgres`
- TypeORM `synchronize: true` is enabled for local testing.

Static files are stored in `uploads/offices` and served as `/uploads/**`.
