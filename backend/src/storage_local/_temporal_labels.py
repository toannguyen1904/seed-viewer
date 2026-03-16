from fastapi import APIRouter
from fastapi.responses import JSONResponse
from globals import Global

router = APIRouter()


@router.get("/")
def temporal_labels(move_org_name: str = None):
    """Return temporal label events for a given move_org_name."""
    if move_org_name is None:
        return JSONResponse(status_code=400, content={"error": "move_org_name is required."})

    if Global.temporal_labels_data is None:
        return JSONResponse(status_code=404, content={"error": "No temporal labels data loaded."})

    events = Global.temporal_labels_data.get(move_org_name)
    if events is None:
        return JSONResponse(status_code=404, content={"error": f"No temporal labels for '{move_org_name}'."})

    return {"move_org_name": move_org_name, "events": events}
