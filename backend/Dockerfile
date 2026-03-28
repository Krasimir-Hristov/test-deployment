# Използваме лек Python Image
FROM python:3.11-slim

# Инсталираме системни зависимости за ReportLab (библиотека за PDF)
# Това е една от причините да ползваме Docker - искаме да сме сигурни, че тези библиотеки ги има.
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Инсталираме uv за бързо управление на зависимостите
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Създаваме работна директория
WORKDIR /app

# Копираме конфигурационните файлове на проекта
COPY pyproject.toml uv.lock ./

# Инсталираме зависимостите без да създаваме нова виртуална среда в контейнера (ползваме системния Python)
RUN uv pip install --system -r pyproject.toml

# Копираме останалия код
COPY . .

# Експонираме порта
EXPOSE 8000

# Стартираме FastAPI
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
