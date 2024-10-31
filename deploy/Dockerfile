# Start with a Python base image
FROM python:3.13-slim

# Install necessary packages including webhook
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Download and install webhook
RUN curl -L https://github.com/adnanh/webhook/releases/download/2.8.2/webhook-linux-amd64.tar.gz | \
    tar xz && mv webhook-linux-amd64/webhook /usr/local/bin/webhook && rm -rf webhook-linux-amd64

# Install Docker SDK for Python
RUN pip install docker

# Set up working directory
WORKDIR /app

# Copy the Python script and hooks file to the container
COPY deploy.py /app
COPY hooks.json /app

# Expose the port webhook will run on
EXPOSE 9000

# Run webhook with the configuration
CMD ["webhook", "-hooks", "/app/hooks.json", "-verbose"]
