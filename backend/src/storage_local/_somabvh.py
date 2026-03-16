from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from globals import Global

router = APIRouter()


@router.get("/")
def somabvh(bvhpath: str = None, random: bool = False):
    """Serve SOMA BVH animation files."""

    assert bvhpath is not None or random is not None, "Either bvhpath or random must be provided."

    if random:
        move = Global.metadata.sample(n=1)
        move_org_name = move.index[0]
        move = move.iloc[0].to_dict()
        move['move_org_name'] = move_org_name
    else:
        if bvhpath not in Global.metadata.index:
            return JSONResponse(
                status_code=404, content={"error": f"move '{bvhpath}' not found in metadata."}
            )
        move = Global.metadata.loc[bvhpath].to_dict()
        move['move_org_name'] = bvhpath

    path = move["move_mocap_soma_uniform_path"]
    if not path or (isinstance(path, float) and path != path):  # Check for NaN
        return JSONResponse(
            status_code=404, content={"error": f"No SOMA BVH path available for this move."}
        )

    content = Global.read_file(path)
    if content is None:
        return JSONResponse(
            status_code=404, content={"error": f"SOMA BVH file not found: {path}"}
        )

    name = Path(path).stem

    return {
        "name": name,
        "tree": content,
    }
