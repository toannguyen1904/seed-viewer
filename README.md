# BONES-SEED Viewer

A web application for browsing and viewing the BONES-SEED motion capture dataset. Renders skeleton animations on 3D character models in the browser using Three.js, with a searchable file browser and metadata panel.

Supports two character models and animation retargets: **SOMA** (default) and Unitree **G1** robot.

Temporal labels are crated within <TODO> project.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (includes Docker Compose)

That's it. The Docker build handles Node.js, Python, and all dependencies internally.

## Quick Start

### Linux / macOS

```bash
git clone <repo-url>
cd viewer-seed

# Edit DATA_PATH in shdocker.sh to point to your extracted dataset
./shdocker.sh
```

### Windows

```powershell
git clone <repo-url>
cd viewer-seed

# Copy and edit the environment file
copy .env.example .env
# Edit .env to set your DATA_PATH

docker compose up --build
```

The app will be available at **http://localhost:8666**.

## Configuration

All configuration is done through environment variables. Set them in `shdocker.sh` (Linux/macOS) or in a `.env` file (all platforms).

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8666` | Port the app is accessible on |
| `DATA_PATH` | — | Root directory of the extracted dataset |

### Data Directory Structure

`DATA_PATH` should point to the root of the extracted Bones Rigplay dataset:

```
DATA_PATH/
  metadata/               # parquet and csv metadata + .jsonl temporal labels
  soma_proportional/bvh/  # Original mocap on SOMA model - BVH animation files
  soma_uniform/bvh/       # Mocap retargeted to one unified SOMA shape/skeleton - BVH animation files
  g1/csv/                 # Mocap retargeted to G1 robot - Mujoco compatible CSV animation files
```

### Using a `.env` File

Docker Compose automatically reads a `.env` file from the project root. Copy the example and edit it:

```bash
cp .env.example .env
```

Then run `docker compose up --build` on any platform.

## Local Development

For development without Docker, you need:
- Node.js 20.10.0 (see `.nvmrc`)
- Python 3.11
- [PDM](https://pdm-project.org/) (Python package manager)

**Frontend** (terminal 1):
```bash
cd frontend
npm install
npm run dev       # Starts Vite dev server on localhost:5173
```

**Backend** (terminal 2):
```bash
cd backend
pdm install
DATA_ROOT=/path/to/dataset PORT=8080 python src/main.py
```

The Vite dev server proxies `/api` requests to the backend at `localhost:8080`.

## Testing

End-to-end tests use Playwright and run against the deployed app at `http://localhost:8666`:

```bash
cd frontend
npx playwright install   # First time only
npx playwright test      # Run all tests (headless)
```

## SOMA Example

The `soma/` directory contains a minimal example for parsing BONES-SEED motion capture data and running it through the SOMA body model.

## License

Apache 2.0 License. See [LICENSE](LICENSE) for details.
