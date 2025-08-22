import time
from typing import Union
import redis.asyncio as redis

class RateLimiter:
    """Redis-based rate limiter using sliding window"""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
    
    async def is_allowed(
        self, 
        key: str, 
        max_requests: int, 
        window_seconds: int
    ) -> bool:
        """
        Check if request is allowed under rate limit
        Uses sliding window log algorithm
        """
        now = time.time()
        window_start = now - window_seconds
        
        # Remove expired entries
        await self.redis.zremrangebyscore(key, 0, window_start)
        
        # Count current requests in window
        current_requests = await self.redis.zcard(key)
        
        if current_requests >= max_requests:
            return False
        
        # Add current request
        await self.redis.zadd(key, {str(now): now})
        
        # Set expiration for the key
        await self.redis.expire(key, window_seconds + 1)
        
        return True
    
    async def get_remaining_requests(
        self, 
        key: str, 
        max_requests: int, 
        window_seconds: int
    ) -> int:
        """Get remaining requests in current window"""
        now = time.time()
        window_start = now - window_seconds
        
        # Remove expired entries
        await self.redis.zremrangebyscore(key, 0, window_start)
        
        # Count current requests
        current_requests = await self.redis.zcard(key)
        
        return max(0, max_requests - current_requests)
    
    async def reset_limit(self, key: str) -> None:
        """Reset rate limit for a key"""
        await self.redis.delete(key)