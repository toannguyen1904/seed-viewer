from fastapi import APIRouter
from fastapi.responses import JSONResponse
from globals import Global

router = APIRouter()


@router.get("/")
def temporal_labels(filename: str = None):
    """Return temporal label events for a given filename."""
    if filename is None:
        return JSONResponse(status_code=400, content={"error": "filename is required."})

    if Global.temporal_labels_data is None:
        return JSONResponse(status_code=404, content={"error": "No temporal labels data loaded."})

    events = Global.temporal_labels_data.get(filename)
    if events is None:
        return JSONResponse(status_code=404, content={"error": f"No temporal labels for '{filename}'."})

    return {"filename": filename, "events": events}
