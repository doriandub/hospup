from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
import requests
import re
from urllib.parse import urlparse
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/thumbnail")
async def get_instagram_thumbnail(url: str = Query(..., description="Instagram post URL")):
    """
    Proxy endpoint to fetch Instagram thumbnails without CORS issues
    """
    try:
        # Extract post ID from URL
        post_id = extract_post_id(url)
        if not post_id:
            raise HTTPException(status_code=400, detail="Invalid Instagram URL")
        
        # Try different thumbnail URL patterns
        thumbnail_urls = [
            f"https://www.instagram.com/p/{post_id}/media/?size=m",
            f"https://instagram.com/p/{post_id}/media/?size=l", 
            f"https://www.instagram.com/p/{post_id}/media/",
        ]
        
        for thumbnail_url in thumbnail_urls:
            try:
                # Fetch thumbnail with proper headers
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                }
                
                response = requests.get(thumbnail_url, headers=headers, timeout=10)
                
                if response.status_code == 200 and 'image' in response.headers.get('content-type', ''):
                    # Return the image with proper headers
                    return Response(
                        content=response.content,
                        media_type=response.headers.get('content-type', 'image/jpeg'),
                        headers={
                            'Cache-Control': 'public, max-age=3600',  # Cache for 1 hour
                            'Access-Control-Allow-Origin': '*',
                        }
                    )
                    
            except Exception as e:
                logger.warning(f"Failed to fetch thumbnail from {thumbnail_url}: {e}")
                continue
        
        raise HTTPException(status_code=404, detail="Thumbnail not found")
        
    except Exception as e:
        logger.error(f"Error fetching Instagram thumbnail: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch thumbnail")

@router.get("/metadata")
async def get_instagram_metadata(url: str = Query(..., description="Instagram post URL")):
    """
    Get Instagram post metadata by scraping the page
    """
    try:
        post_id = extract_post_id(url)
        if not post_id:
            raise HTTPException(status_code=400, detail="Invalid Instagram URL")
        
        # Construct the Instagram URL
        instagram_url = f"https://www.instagram.com/p/{post_id}/"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        
        response = requests.get(instagram_url, headers=headers, timeout=15)
        
        if response.status_code != 200:
            raise HTTPException(status_code=404, detail="Instagram post not found")
        
        html_content = response.text
        
        # Extract metadata from HTML
        metadata = extract_metadata_from_html(html_content, post_id)
        
        return {
            "post_id": post_id,
            "url": instagram_url,
            **metadata
        }
        
    except Exception as e:
        logger.error(f"Error fetching Instagram metadata: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch metadata")

def extract_post_id(url: str) -> str:
    """Extract Instagram post ID from URL"""
    patterns = [
        r'instagram\.com/(?:p|reel)/([A-Za-z0-9_-]+)',
        r'instagr\.am/p/([A-Za-z0-9_-]+)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    return None

def extract_metadata_from_html(html: str, post_id: str) -> dict:
    """Extract metadata from Instagram HTML page"""
    metadata = {}
    
    try:
        # Extract JSON-LD data
        json_ld_pattern = r'<script type="application/ld\+json">(.*?)</script>'
        json_matches = re.findall(json_ld_pattern, html, re.DOTALL)
        
        # Extract Open Graph data
        og_patterns = {
            'title': r'<meta property="og:title" content="([^"]*)"',
            'description': r'<meta property="og:description" content="([^"]*)"',
            'image': r'<meta property="og:image" content="([^"]*)"',
            'video': r'<meta property="og:video" content="([^"]*)"',
            'type': r'<meta property="og:type" content="([^"]*)"',
        }
        
        for key, pattern in og_patterns.items():
            match = re.search(pattern, html, re.IGNORECASE)
            if match:
                metadata[f'og_{key}'] = match.group(1)
        
        # Extract thumbnail URL from various sources
        thumbnail_patterns = [
            r'"display_url":"([^"]*)"',
            r'"thumbnail_src":"([^"]*)"',
            r'<meta property="og:image" content="([^"]*)"',
        ]
        
        for pattern in thumbnail_patterns:
            match = re.search(pattern, html)
            if match:
                thumbnail_url = match.group(1).replace('\\/', '/')
                if 'scontent' in thumbnail_url or 'instagram' in thumbnail_url:
                    metadata['thumbnail_url'] = thumbnail_url
                    break
        
        # Try to extract from window._sharedData
        shared_data_pattern = r'window\._sharedData = ({.*?});'
        shared_match = re.search(shared_data_pattern, html)
        if shared_match:
            # This would require JSON parsing, but often contains the best metadata
            pass
        
    except Exception as e:
        logger.warning(f"Error extracting metadata: {e}")
    
    return metadata