FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies (for psycopg2, weasyprint, etc.)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    netcat-traditional \
    gcc \
    curl \
    libffi-dev \
    shared-mime-info \
    libcairo2 \
    libgdk-pixbuf-2.0-0 \
    libharfbuzz0b \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libpangoft2-1.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies (WeasyPrint must be installed before the smoke test below)
COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Fail image build if WeasyPrint cannot load native libs (needs apt packages + pip install above)
RUN python -c "from weasyprint import HTML; HTML(string='<p>ok</p>').write_pdf()"

# Copy application code
COPY . /app/

RUN chmod +x /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]
