from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
from events import eventsrouter
from databasetools import initdb
from login import loginrouter

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:3000", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(eventsrouter)
app.include_router(loginrouter)

if __name__ == "__main__":
    initdb()
    uvicorn.run(app, host="0.0.0.0", port=3001)
