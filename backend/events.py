import jwt
import os
import logging
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import Union
from databasetools import add_event, get_events, delete_event, update_event

eventsrouter = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class Event(BaseModel):
    id: Union[int, None] = None
    eventName: str
    date: str
    time: str
    location: str
    organization: str
    notes: str
    approved: Union[bool, None] = None
    created_by: str

SECRET_KEY = os.getenv("SECRET_KEY")

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        logging.info(f"Token payload: {payload}")
        return payload
    except jwt.ExpiredSignatureError:
        logging.error("Token has expired")
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        logging.error("Invalid token")
        raise HTTPException(status_code=401, detail="Invalid token")

@eventsrouter.post("/events/")
def create_event(event: Event, token: str = Depends(oauth2_scheme)):
    if event.approved is None:
        event.approved = False
    payload = verify_token(token)
    username = payload.get("username")
    logging.info(f"Username from token: {username}")
    if username is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    try:
        add_event(event.eventName, event.date, event.time, event.location, event.organization, event.notes, event.approved, username)
        return {"message": "Event added successfully"}
    except Exception as e:
        logging.error(f"Error adding event: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@eventsrouter.get("/events/")
def read_events():
    print("Made it to read_events")
    try:
        events = get_events()
        return events
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@eventsrouter.delete("/events/{event_id}")
def remove_event(event_id: int):
    try:
        rowcount = delete_event(event_id)
        if rowcount == 0:
            raise HTTPException(status_code=404, detail="Event not found")
        return {"message": "Event deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@eventsrouter.post("/approve_event")
def modify_event(event: Event):
    # This function is used to approve or disapprove an event, by changing the approved field in the database
    try:
        rowcount = update_event(event.id, event.eventName, event.date, event.time, event.location, event.organization, event.notes, event.approved)
        if rowcount == 0:
            raise HTTPException(status_code=404, detail="Event not found")
        return {"message": "Event updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
