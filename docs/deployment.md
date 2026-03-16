# Deployment

## Docker (Production)

### Quick Start

1. Edit `shdocker.sh` to set paths:
   ```bash
   DATA_PATH=/path/to/your/extracted/dataset  # Contains metadata/, soma_uniform/, g1/, etc.
   PORT=8666
   ```
2. Run: `./shdocker.sh`
3. Access at `http://localhost:8666`

### Docker Build Stages (`Dockerfile`)

1. **Node stage** — Node 20.10.0, `npm install`, `npm run build` → produces `frontend/public/dist/`
2. **PDM stage** — Python 3.11, `pdm install` → produces `.venv/`
3. **Final stage** — Python 3.11 slim image with `.venv/` and `dist/`, runs `python src/main.py`

### Volume Mounts (`docker-compose.yml`)

```yaml
volumes:
  - ${DATA_PATH}/metadata:/mnt/bones/metadata
  - ${DATA_PATH}:/mnt/bones/files
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8080 (internal), 8666 (docker-compose) | FastAPI server port |
| `DATA_ROOT` | `/mnt/bones` | Root data path inside container (metadata at `{DATA_ROOT}/metadata/`, files at `{DATA_ROOT}/files/`) |
| `DATA_FILES_ROOT` | `{DATA_ROOT}/files` | Override for animation files directory |

## Local Development

**Frontend** (terminal 1):
```bash
cd frontend
nvm use           # Node 20.10.0
npm install
npm run dev       # localhost:5173, proxies /api → localhost:8080
```

**Backend** (terminal 2):
```bash
cd backend
pdm install
# Set DATA_ROOT env var or use default /mnt/bones
python src/main.py   # localhost:8080
```

The Vite dev server proxies all `/api` requests to the backend at `localhost:8080`, so the frontend and backend can be developed independently.

## E2E Tests

Playwright tests run against the deployed app at `http://localhost:8666`. From `frontend/`:

```bash
npx playwright test                              # All tests, headless
npx playwright test tests/g1-model-switch.spec.ts  # Single file
npx playwright test --headed                     # Visible browser
```

Tests use `?preserveDrawingBuffer` URL param to enable WebGL `readPixels` for pixel-level assertions.
