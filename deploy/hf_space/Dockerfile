FROM python:3.12-slim

# Install system dependencies for OpenCV and image processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Hugging Face Spaces requires a non-root user with UID 1000
RUN useradd -m -u 1000 user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PORT=7860 \
    DEMO_MODE=true \
    FRONTEND_ORIGIN=*

WORKDIR $HOME/app

# Copy dependencies and install
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy application source
COPY --chown=user . .

# Ensure storage directories exist and are owned by user 1000
RUN mkdir -p uploads && chown -R user:user $HOME/app

USER user

EXPOSE 7860

CMD ["gunicorn", "--bind", "0.0.0.0:7860", "--workers", "2", "--timeout", "120", "run:app"]
