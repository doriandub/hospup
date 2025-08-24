import os
import uuid
import shutil
from pathlib import Path
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

class LocalStorageService:
    """Service for handling local file storage for development"""
    
    def __init__(self):
        self.base_path = Path("uploads")
        self.base_path.mkdir(exist_ok=True)
        self.base_url = "http://localhost:8000/static/uploads"
    
    def generate_presigned_upload_url(
        self, 
        file_name: str, 
        content_type: str,
        property_id: str,
        expires_in: int = 3600
    ) -> Dict[str, Any]:
        """Generate a mock presigned URL for local storage"""
        
        # Generate unique file key
        file_extension = file_name.split('.')[-1] if '.' in file_name else ''
        unique_filename = f"{uuid.uuid4()}.{file_extension}" if file_extension else str(uuid.uuid4())
        
        # Create local path
        property_dir = self.base_path / "properties" / property_id / "videos"
        property_dir.mkdir(parents=True, exist_ok=True)
        
        local_path = property_dir / unique_filename
        s3_key = f"properties/{property_id}/videos/{unique_filename}"
        
        return {
            'upload_url': f"http://localhost:8000/api/v1/upload/local",
            'fields': {
                'Content-Type': content_type,
                's3_key': s3_key,
                'local_path': str(local_path)
            },
            's3_key': s3_key,
            'file_url': f"{self.base_url}/{s3_key}",
            'expires_in': expires_in
        }
    
    def save_file(self, file_data: bytes, local_path: str) -> bool:
        """Save file to local storage"""
        try:
            Path(local_path).parent.mkdir(parents=True, exist_ok=True)
            with open(local_path, 'wb') as f:
                f.write(file_data)
            return True
        except Exception as e:
            logger.error(f"Error saving file {local_path}: {e}")
            return False
    
    def save_file_from_path(self, source_path: str, s3_key: str) -> str:
        """Copy a file from source path to local storage and return URL"""
        try:
            # Create destination path
            dest_path = self.base_path / s3_key
            dest_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Copy file
            shutil.copy2(source_path, dest_path)
            
            # Return URL
            url = f"{self.base_url}/{s3_key}"
            logger.info(f"Saved file from {source_path} to {dest_path}, accessible at {url}")
            return url
        except Exception as e:
            logger.error(f"Error saving file from {source_path} to {s3_key}: {e}")
            raise e
    
    def delete_file(self, s3_key: str) -> bool:
        """Delete a file from local storage"""
        try:
            local_path = self.base_path / s3_key
            if local_path.exists():
                local_path.unlink()
                logger.info(f"Deleted file: {s3_key}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error deleting file {s3_key}: {e}")
            return False
    
    def generate_presigned_download_url(self, s3_key: str, expires_in: int = 3600) -> str:
        """Generate download URL for local files"""
        return f"{self.base_url}/{s3_key}"

# Create instance
local_storage_service = LocalStorageService()