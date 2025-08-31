#!/usr/bin/env python3
"""
Render-compatible startup script for FastAPI application
"""
import os
import uvicorn
from main import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    
    # Configure uvicorn with Render-specific settings
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        access_log=True,
        proxy_headers=True,
        forwarded_allow_ips="*",
        server_header=False,
        date_header=False
    )