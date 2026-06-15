from fastapi import FastAPI, Request, Query
from typing import Optional, List
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from .logic import calculate_weighted_sum

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
async def get_project_dashboard(
    project_id: int,
    request: Request,
    metrics: Optional[List[str]] = Query(None)
):
    supabase: Client = request.app.state.supabase
    
    dashboard = {}
    
        
    return dashboard

@app.get("/projects/{project_id}/weights")
async def get_weights(project_id: int, request: Request):
    supabase: Client = request.app.state.supabase
    return supabase.rpc("get_weight_values_by_project", {"p_id": project_id}).execute().data

@app.get("/projects/{project_id}/weights/avg")
async def get_weights_avg(project_id: int, request: Request, criterion_id: Optional[List[int]] = Query(None)):
    supabase: Client = request.app.state.supabase
    if criterion_id:
        return {"weight_avg": supabase.rpc("get_weight_avg_by_criterion", {"p_id": project_id, "c_id": criterion_id}).execute().data}
    
    return {"weight_avg": supabase.rpc("get_weight_avg_by_project", {"p_id": project_id}).execute().data}
    
@app.get("/projects/{project_id}/alternatives/score/avg")
async def get_alternative_avg_score(project_id: int, request: Request, alternative_id: Optional[List[int]] = Query(None)):
    supabase: Client = request.app.state.supabase
    if alternative_id:
        return {"alternative_score_avg": supabase.rpc("get_user_score_avg_by_alternative", {"p_id": project_id, "a_id": alternative_id}).execute().data}
    
    return {"alternative_score_avg": supabase.rpc("get_user_score_avg_by_project", {"p_id": project_id}).execute().data}

@app.get("/projects/{project_id}")
async def get_user_scores(project_id: int, request: Request):
    supabase: Client = request.app.state.supabase
    return {"user_scores": supabase.rpc("get_user_rating_by_project", {"p_id": project_id}).execute().data}

@app.get("/projects/{project_id}/weighted_sum")
async def get_weighted_sum(project_id: int, request: Request):
    supabase: Client = request.app.state.supabase
    
    weighted_sums = {}
    data = supabase.rpc("get_dm_inputs", {"p_id": project_id}).execute().data
    
    for input in data.items():
        dm_id = input[0]
        dm_data = input[1]
        weights = {int(k): v for k, v in (dm_data["weights"] or {}).items()}
        ratings = dm_data["ratings"] or []
        weighted_sums.update({dm_id: calculate_weighted_sum(weights, ratings)})
    
    return weighted_sums