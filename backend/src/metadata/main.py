from fastapi import APIRouter
from fastapi.responses import JSONResponse
from helpers import filter_metadata
from globals import Global
import pandas as pd

router = APIRouter()


@router.get("/{move_org_name}")
def get_metadata(move_org_name: str):
    """
    Get metadata for a move by its original name.
    """
    
    # get row where index is move_org_name
    try:
        move:pd.Series =  Global.metadata.loc[move_org_name]
        # to dict
        move = move.to_dict()
        move["move_org_name"] = move_org_name
                
    except KeyError:        
        return JSONResponse(
            status_code=404, content={"error": "Move not found."}
        )
    
    move = filter_metadata(move)
    
    return move