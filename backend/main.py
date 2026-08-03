from fastapi import FastAPI, Request, Query, HTTPException, status
from typing import Optional, List
from pydantic import BaseModel, EmailStr
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from backend.logic import calculate_weighted_sum, calculate_score_range
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    SUPABASE_URL: str = os.getenv("SUPABASE_URL")
    # MUST use SUPABASE_SERVICE_ROLE_KEY for auth admin actions like invite
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY")
    supabase_client: Client = create_client(supabase_url=SUPABASE_URL, supabase_key=SUPABASE_KEY)
    app.state.supabase = supabase_client
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", 
                  "https://improved-rotary-phone-4jrv6x64prpvcqrqg-5173.app.github.dev"
                  ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/projects/{project_id}/alternatives")
async def get_alternatives(project_id: int, request: Request):
    supabase: Client = request.app.state.supabase
    data = supabase.table("alternatives").select("id, name").eq("project_id", project_id).execute().data
    return {str(row["id"]): row["name"] for row in data}

@app.get("/projects/{project_id}/criteria")
async def get_criteria(project_id: int, request: Request):
    supabase: Client = request.app.state.supabase
    data = supabase.table("criteria").select("id, label").eq("project_id", project_id).execute().data
    return {str(row["id"]): row["label"] for row in data}

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
    data = supabase.rpc("get_dm_inputs", {"p_id": project_id}).execute().data or {}

    for input in data.items():
        dm_id = input[0]
        dm_data = input[1]
        weights = {int(k): v for k, v in (dm_data["weights"] or {}).items()}
        ratings = dm_data["ratings"] or []
        weighted_sums.update({dm_id: calculate_weighted_sum(weights, ratings)})
    
    return {"weighted_sums": weighted_sums}

@app.get("/projects/{project_id}/score_range")
async def get_score_range(project_id: int, request: Request):
    supabase: Client = request.app.state.supabase
    
    data = supabase.rpc("get_min_and_max_inputs_by_project", {"p_id": project_id}).execute().data or {}

    weights = data.get("weights") or {}
    ratings = data.get("ratings") or {}
    
    return calculate_score_range(
        weights={int(crit_id): value for crit_id, value in weights.items()},
        ratings=ratings
    )
    
class InviteRequest(BaseModel):
    email: EmailStr
    redirect_to: str = "http://localhost:5173"

@app.post("/api/invite-user")
async def invite_user(payload: InviteRequest, request: Request):
    supabase: Client = request.app.state.supabase
    try:
        response = supabase.auth.admin.invite_user_by_email(
            payload.email,
            options={"redirect_to": payload.redirect_to}
        )
        return {"status": "success", "data": response}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
