# Local Dev Login Credentials

## Admin (Internal/Evo)

| Email | Password | User Type |
|-------|----------|-----------|
| christian@evomarketing.co | admin123 | evo (internal) |

## Creator

| Email | Password | User Type | Notes |
|-------|----------|-----------|-------|
| Chloe.despatie@hotmail.com | admin123 | creator | "Chloe D" — 17 campaign assignments (most active creator) |

## Dev Commands

```bash
# Restart frontend (fixes stale webpack/HMR issues)
docker restart evo-dialed-webserver-1

# Restart backend API
docker restart evo-dialed-apiserver-1

# Restart both
docker restart evo-dialed-webserver-1 evo-dialed-apiserver-1

# View frontend logs
docker logs evo-dialed-webserver-1 --tail 20

# View backend logs
docker logs evo-dialed-apiserver-1 --tail 20

# Start everything
docker compose -f compose_dev.yml up -d

# Stop everything
docker compose -f compose_dev.yml down

# Start just frontend
docker compose -f compose_dev.yml up -d webserver
```

## Notes

- API runs at `http://localhost:11793/api`
- Frontend runs at `http://localhost:28528`
- Make sure `API_DEV_URL` in `.env` uses `localhost` (not `127.0.0.1`) for cookies to work
