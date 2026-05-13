# mcdma-collector

Tool to receive Inputs for Cost-Utility-Analysis of Groups

## Start Database

docker-compose up -d

## Start Backend

cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
fastapi dev main.py

## Stop Database

docker-compose down

## Dashboards

http://localhost:8080/login (Database)

http://localhost:8000/docs (Swagger UI)
