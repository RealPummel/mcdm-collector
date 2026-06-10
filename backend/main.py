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
    metrics: Optional[List[str]] = Query(None),
    criterion_id: Optional[List[str]] = Query(None),
    alternative_id: Optional[List[str]] = Query(None)
):
    supabase: Client = request.app.state.supabase
    
    dashboard = {}
    
    if not metrics or "weight" in metrics:
        dashboard.update({"weights": supabase.rpc("get_weight_values_by_project", {"p_id": project_id}).execute().data})
        
    if not metrics or "weight_avg" in metrics:
        if criterion_id:
            dashboard.update({"weight_avg": supabase.rpc("get_weight_avg_by_criterion", {"p_id": project_id, "c_id": criterion_id}).execute().data})
        else:
            dashboard.update({"weight_avg": supabase.rpc("get_weight_avg_by_project", {"p_id": project_id}).execute().data})
        
    if not metrics or "alternative_avg" in metrics:
        if alternative_id:
            dashboard.update({"alternative_score_avg": supabase.rpc("get_user_score_avg_by_alternative", {"p_id": project_id, "a_id": alternative_id}).execute().data})
        else:
            dashboard.update({"alternative_score_avg": supabase.rpc("get_user_score_avg_by_project", {"p_id": project_id}).execute().data})
        
    if not metrics or "user_score" in metrics:
        dashboard.update({"user_scores": supabase.rpc("get_user_rating_by_project", {"p_id": project_id}).execute().data})
        
    return dashboard