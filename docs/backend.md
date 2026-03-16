# Backend API

FastAPI application serving animation files and metadata. Source in `backend/src/`.

## Startup

`main.py` uses a lifespan context manager:
1. `Global.initialize()` — loads metadata parquet file, validates file paths, loads temporal labels JSONL data
2. Adds `SharedArrayBufferMiddleware` for WASM cross-origin headers
3. Configures CORS for `localhost:5173` (dev)
4. Mounts routers: `/api/storage_local/`, `/api/metadata/`
5. Serves static files from `dist/` at `/` (production)

## Global State (`globals.py`)

- `DATA_ROOT` env var (default `/mnt/bones`) — root of the dataset
- Loads metadata from `{DATA_ROOT}/metadata/` — finds first `.parquet` file in the directory
- Stores as pandas DataFrame accessible via `Global.metadata`
- `files_path` — root directory for animation files (default `{DATA_ROOT}/files/`, overridable via `DATA_FILES_ROOT` env var)
- `temporal_labels_data` — dict mapping `move_org_name` to list of temporal label events, loaded from first `.jsonl` file in the metadata directory. Gracefully handles missing file (empty dict).

## API Routes

### Storage Local Router (`storage_local/main.py`)

All endpoints are registered in `storage_local/main.py` as sub-routers with prefixes. Each endpoint is implemented in a separate `_<name>.py` file.

### SOMA BVH Files

```
GET /api/storage_local/somabvh/?bvhpath=<move_org_name>
GET /api/storage_local/somabvh/?random=true
```

Returns: `{"name": "<move_org_name>", "tree": "<BVH file content>"}`

Looks up path in metadata column `move_uniform_soma_bvh_path`. Note: metadata stores `.csv` extension but actual files are `.bvh` — the endpoint auto-corrects the extension before reading. Handles NaN/missing values gracefully.

### G1 CSV Files

```
GET /api/storage_local/g1csv/?csvpath=<move_org_name>
GET /api/storage_local/g1csv/?random=true
```

Returns: `{"name": "<move_org_name>", "csv": "<CSV file content>"}`

Looks up path in metadata column `move_uniform_g1_csv_path`. Handles NaN/missing values gracefully.

### Metadata

```
GET /api/metadata/<move_org_name>          # Single animation metadata
GET /api/metadata/?page=1&perpage=1000&query=<search>  # Paginated listing
```

The listing endpoint filters to user-facing columns (via `helpers.py:filter_metadata()`).

### Temporal Labels

```
GET /api/storage_local/temporal_labels/?move_org_name=<name>
```

Returns: `{"move_org_name": "<name>", "events": [{"start_time": 0.0, "end_time": 1.88, "description": "..."}]}`

Looks up temporal label events from the JSONL file loaded at startup into `Global.temporal_labels_data`. Returns 404 if no data exists for the given move.

## Backend File Structure

```
backend/src/
  main.py              # FastAPI app setup, lifespan, middleware, static files
  globals.py           # Metadata loading, path config
  helpers.py           # Shared utilities
  storage_local/
    main.py            # Router aggregator — imports and mounts all sub-routers
    __local_helpers.py # Shared helpers for storage_local endpoints
    _somabvh.py        # SOMA BVH endpoint
    _g1csv.py          # G1 CSV endpoint
    _metadata.py       # Storage-local metadata endpoint
    _temporal_labels.py # Temporal label events lookup
  metadata/
    main.py            # Metadata query endpoints
    helpers.py         # Column filtering, metadata utilities
```

## Expected Volume Mounts (Docker)

The `DATA_PATH` environment variable in `shdocker.sh` points to the root of the extracted dataset. Docker Compose mounts it as:

```yaml
volumes:
  - ${DATA_PATH}/metadata:/mnt/bones/metadata   # metadata parquet + temporal labels JSONL
  - ${DATA_PATH}:/mnt/bones/files               # animation data files
```

The dataset directory should contain:
```
metadata/               # parquet metadata file + optional temporal labels JSONL
soma_uniform/bvh/       # SOMA BVH animation files
g1/csv/                 # G1 CSV animation files
```
