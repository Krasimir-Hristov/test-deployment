"""
Модул за проксиране на новини от NewsAPI към фронтенд приложение.
"""

import io
import os
import httpx
import uvicorn
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

# Зареждане на .env файла
load_dotenv()

app = FastAPI(title="News Proxy API")

# Конфигуриране на CORS за връзка с Фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В реална среда тук сложи URL-а на Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

NEWS_API_KEY = os.getenv("NEWS_API_KEY")
NEWS_API_URL = "https://newsapi.org/v2"


@app.get("/")
def read_root():
    """
    Проверка на състоянието на API сървъра.
    """
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
            raise HTTPException(
                status_code=e.response.status_code, detail=error_detail
            ) from e


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
            "pageSize": 10,
        }
        try:
            response = await client.get(f"{NEWS_API_URL}/everything", params=params)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            error_detail = e.response.json().get("message", "Error from News API")
            raise HTTPException(
                status_code=e.response.status_code, detail=error_detail
            ) from e


@app.get("/news/sources")
async def get_sources(category: str = "technology", language: str = "en"):
    """
    Връща списък с наличните новинарски източници по категория и език.
    """
    if not NEWS_API_KEY:
        raise HTTPException(status_code=500, detail="NEWS_API_KEY is not set")

    async with httpx.AsyncClient() as client:
        params = {
            "apiKey": NEWS_API_KEY,
            "category": category,
            "language": language,
        }
        try:
            response = await client.get(
                f"{NEWS_API_URL}/top-headlines/sources", params=params
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            error_detail = e.response.json().get("message", "Error from News API")
            raise HTTPException(
                status_code=e.response.status_code, detail=error_detail
            ) from e


@app.get("/news/pdf")
async def generate_news_pdf(category: str = "technology"):
    """
    Генерира PDF файл с последните новини от избраната категория.
    Изисква библиотеката ReportLab (пакетирана в Docker).
    """
    if not NEWS_API_KEY:
        raise HTTPException(status_code=500, detail="NEWS_API_KEY is not set")

    async with httpx.AsyncClient() as client:
        params = {"apiKey": NEWS_API_KEY, "category": category, "pageSize": 10}
        try:
            response = await client.get(f"{NEWS_API_URL}/top-headlines", params=params)
            response.raise_for_status()
            news_data = response.json()
            articles = news_data.get("articles", [])
        except Exception as e:
            raise HTTPException(
                status_code=502, detail=f"Failed to fetch news for PDF: {str(e)}"
            ) from e

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    title_style = styles["Title"]
    story.append(Paragraph(f"News Digest: {category.capitalize()}", title_style))
    story.append(Spacer(1, 12))

    body_style = styles["Normal"]
    heading_style = styles["Heading2"]

    for i, art in enumerate(articles, 1):
        story.append(Paragraph(f"{i}. {art['title'] or 'No Title'}", heading_style))
        story.append(Paragraph(f"Source: {art['source']['name']}", body_style))
        story.append(Spacer(1, 6))
        story.append(
            Paragraph(art["description"] or "No description available.", body_style)
        )
        story.append(Spacer(1, 12))
        story.append(Paragraph("-" * 80, body_style))
        story.append(Spacer(1, 12))

    doc.build(story)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=news_{category}.pdf"},
    )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
