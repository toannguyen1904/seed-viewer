import re
from globals import Global
import pandas as pd

CACHE = {}

def get_matching_moves(query:str) -> pd.DataFrame:
    "find all rows in the Global.metadata whose index or move_name match the query"

    if query in CACHE:
        return Global.metadata.loc[CACHE[query]]

    if query != "":
            idx_match = Global.metadata.index.str.contains(query, flags=re.IGNORECASE)
            if "move_name" in Global.metadata.columns:
                name_match = Global.metadata["move_name"].fillna("").str.contains(query, flags=re.IGNORECASE)
                matched = Global.metadata[idx_match | name_match]
            else:
                matched = Global.metadata[idx_match]
    else:
        matched = Global.metadata

    # Sort by take_date descending (most recent first), then by index
    if "take_date" in matched.columns:
        matched = matched.sort_values("take_date", ascending=False, kind="stable")

    mons = matched.index.tolist()
    CACHE[query] = mons

    return Global.metadata.loc[mons]

