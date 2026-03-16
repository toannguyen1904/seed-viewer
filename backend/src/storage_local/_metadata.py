from pathlib import Path
from fastapi import APIRouter
import os
from storage_local.__local_helpers import get_matching_moves
from fastapi.responses import JSONResponse
from helpers import filter_metadata
from globals import Global

router = APIRouter()



@router.get("/{move_org_name}")
def get_metadata(move_org_name: str):
    """
    Get metadata for a move by its original name.
    """
    
    # get row where index is move_org_name
    try:
        move =  Global.metadata.loc[move_org_name].to_dict()
    except KeyError:        
        return JSONResponse(
            status_code=404, content={"error": "Move not found."}
        )
    
    move = filter_metadata(move)
    
    return move



@router.get("/")
def get_moves(
    # dirpath: str,
    page: int = 1,
    perpage: int = 1000,
    query: str = "",
):
    
    moves = get_matching_moves(query)
    
    # if no bvh found
    if len(moves) == 0:
        return {"result": [], "total": 0}
    
    num = len(moves)
    
    # get range of dataframe
    # moves =  moves[(page-1)*perpage:page*perpage]
    moves = moves.iloc[(page-1)*perpage:page*perpage]
    
    # convert to dict with two keys, renamed and reordered
    df = moves.reset_index()[["move_name", "move_org_name"]]
    df = df.rename(columns={"move_name": "Move name", "move_org_name": "Filename"})
    moves = df.to_dict(orient="records")
    
        
    return {"result": moves, "total": num}
