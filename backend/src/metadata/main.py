from fastapi import APIRouter
from fastapi.responses import JSONResponse
from helpers import filter_metadata
from globals import Global
import pandas as pd

router = APIRouter()


@router.get("/{filename}")
def get_metadata(filename: str):
    """
    Get metadata for a move by its filename.
    """

    # get row where index is filename
    try:
        move:pd.Series =  Global.metadata.loc[filename]
        # to dict
        move = move.to_dict()
        move["filename"] = filename
                
    except KeyError:        
        return JSONResponse(
            status_code=404, content={"error": "Move not found."}
        )
    
    move = filter_metadata(move)
    
    return move