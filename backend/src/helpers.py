import re
import datetime
import uuid



def match_url(url:str, patterns: list[str]):
        for pat in patterns:
            if re.match(pat, url):
                return True
        return False
    
    
    
def get_datetime_string():
    return datetime.datetime.now().strftime("%y_%m_%d__%H_%M_%S")



def get_uuid():
    return str(uuid.uuid4())



def filter_metadata(move: dict):
    # convert every move key and value to string
    move = {str(k): str(v) if v != None else "" for k, v in move.items()}
    # remove keys that are not needed
    toremove= [
        "_id", 
        ]
    move = {k: v for k, v in move.items() if k not in toremove}   
    
    return move