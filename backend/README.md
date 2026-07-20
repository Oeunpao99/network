# Fiberline Backend

Docker Compose starts PostgreSQL only. The FastAPI application runs locally, applies the Alembic migration, and seeds the existing POP, site, and customer records.

Set the Azure OpenAI variables in the untracked root `.env` file. The frontend uses `VITE_API_URL`, which defaults to `http://localhost:8000`.

Start PostgreSQL:

```powershell
docker compose up -d
```

Run the API locally from `backend`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload
```

Useful endpoints:

- `GET /health`
- `GET` and `POST /api/pops`
- `GET` and `POST /api/customer-sites`
- `GET` and `POST /api/customers`
- `GET` and `POST /api/catalog/products`
- `GET` and `POST /api/quotes`
- `GET` and `POST /api/contracts`
- `GET` and `POST /api/circuits`
- `POST /api/ai/chat`

API documentation is available at `http://localhost:8000/docs`.
