# app/main.py
from fastapi import FastAPI
from app.routes import analysis

app = FastAPI(title="AthleteRise Backend")

# include routers
app.include_router(analysis.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to AthleteRise API"}
