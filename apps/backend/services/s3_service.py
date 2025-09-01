try:
    import boto3
    from botocore.exceptions import ClientError
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False
    ClientError = Exception
from typing import Optional, Dict, Any
import uuid
import logging
from datetime import datetime, timedelta

from core.config import settings

logger = logging.getLogger(__name__)

class S3Service:
    """Service for handling S3 file operations"""
    
    def __init__(self):
        self.bucket_name = settings.AWS_S3_BUCKET or "hospup-files"
        self.s3_client = None
        self._init_s3_client()
    
    def _init_s3_client(self):
        """Initialize S3 client only when needed"""
        if not BOTO3_AVAILABLE:
            logger.info("ℹ️ boto3 not available - S3 service disabled")
            return
            
        # Only try to initialize if credentials exist and not empty strings
        if (settings.AWS_ACCESS_KEY_ID and 
            settings.AWS_SECRET_ACCESS_KEY and
            settings.AWS_ACCESS_KEY_ID.strip() != "" and 
            settings.AWS_SECRET_ACCESS_KEY.strip() != ""):
            try:
                self.s3_client = boto3.client(
                    's3',
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=settings.AWS_REGION
                )
                logger.info("✅ S3 client initialized successfully")
            except Exception as e:
                logger.warning(f"⚠️ Failed to initialize S3 client: {e}")
                self.s3_client = None
        else:
            logger.info("ℹ️ S3 credentials not configured - using fallback mode")
    
    @property
    def is_available(self) -> bool:
        """Check if S3 client is available and ready"""
        return self.s3_client is not None
    
    def generate_presigned_upload_url(
        self, 
        file_name: str, 
        content_type: str,
        property_id: str,
        expires_in: int = 3600  # 1 hour
    ) -> Dict[str, Any]:
        """Generate a presigned URL for uploading files to S3"""
        
        if not self.is_available:
            raise Exception("S3 service unavailable - AWS credentials not configured")
        
        # Generate unique file key
        file_extension = file_name.split('.')[-1] if '.' in file_name else ''
        unique_filename = f"{uuid.uuid4()}.{file_extension}" if file_extension else str(uuid.uuid4())
        
        # Create S3 key with property organization
        s3_key = f"properties/{property_id}/videos/{unique_filename}"
        
        try:
            presigned_data = self.s3_client.generate_presigned_post(
                Bucket=self.bucket_name,
                Key=s3_key,
                Fields={
                    'Content-Type': content_type,
                    'Cache-Control': 'max-age=31536000',  # 1 year
                },
                Conditions=[
                    {'Content-Type': content_type},
                    {'Cache-Control': 'max-age=31536000'},
                    ['content-length-range', 1, 100 * 1024 * 1024],  # 1 byte to 100MB
                ],
                ExpiresIn=expires_in
            )
            
            # Fix the upload URL to include the region for eu-west-1
            upload_url = presigned_data['url']
            if settings.AWS_REGION == 'eu-west-1' and '.s3.amazonaws.com' in upload_url:
                upload_url = upload_url.replace('.s3.amazonaws.com', '.s3.eu-west-1.amazonaws.com')
            
            return {
                'upload_url': upload_url,
                'fields': presigned_data['fields'],
                's3_key': s3_key,
                'file_url': f"https://{self.bucket_name}.s3.{settings.AWS_REGION}.amazonaws.com/{s3_key}",
                'expires_in': expires_in
            }
            
        except ClientError as e:
            logger.error(f"Error generating presigned URL: {e}")
            raise Exception("Failed to generate upload URL")
    
    def generate_presigned_download_url(
        self, 
        s3_key: str, 
        expires_in: int = 3600
    ) -> str:
        """Generate a presigned URL for downloading files from S3"""
        
        if not self.is_available:
            raise Exception("S3 service unavailable - AWS credentials not configured")
        
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': s3_key},
                ExpiresIn=expires_in
            )
            return url
            
        except ClientError as e:
            logger.error(f"Error generating presigned download URL: {e}")
            raise Exception("Failed to generate download URL")
    
    def delete_file(self, s3_key: str) -> bool:
        """Delete a file from S3"""
        
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=s3_key)
            logger.info(f"Deleted file: {s3_key}")
            return True
            
        except ClientError as e:
            logger.error(f"Error deleting file {s3_key}: {e}")
            return False
    
    def copy_file(self, source_key: str, destination_key: str) -> bool:
        """Copy a file within S3"""
        
        try:
            copy_source = {'Bucket': self.bucket_name, 'Key': source_key}
            self.s3_client.copy_object(
                CopySource=copy_source,
                Bucket=self.bucket_name,
                Key=destination_key
            )
            logger.info(f"Copied file from {source_key} to {destination_key}")
            return True
            
        except ClientError as e:
            logger.error(f"Error copying file: {e}")
            return False
    
    def get_file_metadata(self, s3_key: str) -> Optional[Dict[str, Any]]:
        """Get metadata for a file in S3"""
        
        try:
            response = self.s3_client.head_object(Bucket=self.bucket_name, Key=s3_key)
            return {
                'size': response['ContentLength'],
                'last_modified': response['LastModified'],
                'content_type': response.get('ContentType'),
                'etag': response['ETag'].strip('"'),
                'metadata': response.get('Metadata', {})
            }
            
        except ClientError as e:
            logger.error(f"Error getting file metadata for {s3_key}: {e}")
            return None
    
    def list_files(self, prefix: str) -> list:
        """List files with a given prefix"""
        
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=prefix
            )
            
            files = []
            for obj in response.get('Contents', []):
                files.append({
                    'key': obj['Key'],
                    'size': obj['Size'],
                    'last_modified': obj['LastModified'],
                    'etag': obj['ETag'].strip('"')
                })
            
            return files
            
        except ClientError as e:
            logger.error(f"Error listing files with prefix {prefix}: {e}")
            return []
    
    def upload_file_direct(self, file_obj, s3_key: str, content_type: str = None, public_read: bool = True) -> Dict[str, Any]:
        """Upload a file directly to S3"""
        
        if not self.is_available:
            return {
                'success': False,
                'error': 'S3 service unavailable - AWS credentials not configured'
            }
        
        try:
            extra_args = {}
            if content_type:
                extra_args['ContentType'] = content_type
            
            # Note: ACL removed because bucket does not allow ACLs
            # File will be accessible via presigned URLs
            
            # Upload the file
            self.s3_client.upload_fileobj(
                file_obj, 
                self.bucket_name, 
                s3_key,
                ExtraArgs=extra_args
            )
            
            # Generate presigned download URL (since direct public URLs are not available due to ACL restrictions)
            file_url = self.generate_presigned_download_url(s3_key, expires_in=3600 * 24 * 7)  # 7 days
            
            logger.info(f"Successfully uploaded file to S3: {s3_key}")
            return {
                'success': True,
                'url': file_url,
                's3_key': s3_key
            }
            
        except ClientError as e:
            logger.error(f"Error uploading file to S3: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def make_file_public(self, s3_key: str) -> bool:
        """Make an existing S3 file publicly readable (deprecated - ACLs not supported)"""
        
        # ACLs not supported by bucket, files are accessed via presigned URLs
        logger.info(f"Skipping make_file_public for {s3_key} - ACLs not supported")
        return True

# Create a singleton instance
s3_service = S3Service()