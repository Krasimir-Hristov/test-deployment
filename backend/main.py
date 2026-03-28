import os
import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Зареждане на .env файла
load_dotenv()

app = FastAPI(title="News Proxy API")

# Конфигуриране на CORS за връзка с Фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # В реална среда тук сложи URL-а на Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

NEWS_API_KEY = os.getenv("NEWS_API_KEY")
NEWS_API_URL = "https://newsapi.org/v2"

@app.get("/")
def read_root():
    return {"message": "Welcome to the News Proxy API!", "status": "online"}

@app.get("/news/latest")
async def get_latest_news(category: str = "technology", country: str = "us"):
    """
    Връща най-новите новини по категория.
    """
    if not NEWS_API_KEY:
        raise HTTPException(status_code=500, detail="NEWS_API_KEY is not set")
    
    async with httpx.AsyncClient() as client:
        params = {
            "apiKey": NEWS_API_KEY,
            "category": category,
            "country": country,
            "pageSize": 5,
        }
        try:
            response = await client.get(f"{NEWS_API_URL}/top-headlines", params=params)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            error_detail = e.response.json().get("message", "Error from News API")
            raise HTTPException(status_code=e.response.status_code, detail=error_detail)

@app.get("/news/search")
async def search_news(q: str = Query(..., min_length=1)):
    """
    Търсене на новини по ключова дума.
    """
    if not NEWS_API_KEY:
        raise HTTPException(status_code=500, detail="NEWS_API_KEY is not set")
    
    async with httpx.AsyncClient() as client:
        params = {
            "apiKey": NEWS_API_KEY,
            "q": q,
            "sortBy": "publishedAt",
            "pageSize": 10
        }
        try:
            response = await client.get(f"{NEWS_API_URL}/everything", params=params)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            error_detail = e.response.json().get("message", "Error from News API")
            raise HTTPException(status_code=e.response.status_code, detail=error_detail)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
