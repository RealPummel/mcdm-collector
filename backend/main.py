from typing import Annotated
from fastapi import FastAPI, HTTPException, Depends, Query
from contextlib import asynccontextmanager
from sqlmodel import Session, select
from database import init_db, get_session
from models import Project


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

SessionDep = Annotated[Session, Depends(get_session)]

app = FastAPI(lifespan=lifespan)
    
@app.get("/")
def root():
    return {"Hello": "World"}

@app.post("/projects/")
def create_project(project: Project, session: SessionDep):
    session.add(project)
    session.commit()
    session.refresh(project)
    return project

@app.get("/projects/", response_model=list[Project])
def get_projects(
    session: SessionDep, 
    offset: int = 0, 
    limit: int = Query(default=100, le=100)
    ) -> list[Project]:
    
    projects = session.exec(select(Project).offset(offset).limit(limit)).all()
    return projects

@app.get("/projects/{project_id}")
def get_project(project_id: int, session: SessionDep) -> Project:

    pj = session.get(Project, project_id)
    
    if not pj:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return pj