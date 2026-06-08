from fastapi import FastAPI, Request, Query
from typing import Optional, List
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from .logic import *
import json

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    SUPABASE_URL: str = os.getenv("SUPABASE_URL")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY")
    supabase_client: Client = create_client(supabase_url=SUPABASE_URL, supabase_key=SUPABASE_KEY)
    app.state.supabase = supabase_client
    yield

app = FastAPI(lifespan=lifespan)
    
@app.get("/projects/{project_id}/dashboard")
async def get_dm_dashboard(
    project_id: int,
    request: Request,
    metrics: Optional[List[str]] = Query(None)
):
    supabase: Client = request.app.state.supabase
    
    dashboard = {}
    
    if not metrics or "weight" in metrics:
        dashboard.update({"weights": supabase.rpc("get_weight_values_by_project", {"p_id": project_id}).execute().data})
    if not metrics or "user_score" in metrics:
        dashboard.update({"user_scores": supabase.rpc("get_user_rating_by_project", {"p_id": project_id}).execute().data})
    
    return dashboard