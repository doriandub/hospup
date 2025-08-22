from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
import uuid
from datetime import datetime

from core.database import get_db
from core.auth import get_current_user
from models.user import User
from models.property import Property

router = APIRouter()

class PropertyCreate(BaseModel):
    name: str
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    property_type: Optional[str] = None
    description: Optional[str] = None
    website_url: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    instagram_handle: Optional[str] = None
    language: str = "fr"

class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    property_type: Optional[str] = None
    description: Optional[str] = None
    website_url: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    instagram_handle: Optional[str] = None
    language: Optional[str] = None

class PropertyResponse(BaseModel):
    id: str
    name: str
    user_id: str
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    property_type: Optional[str] = None
    description: Optional[str] = None
    website_url: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    instagram_handle: Optional[str] = None
    language: Optional[str] = None
    is_active: Optional[bool] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

@router.get("/", response_model=List[PropertyResponse])
async def get_properties(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all properties for current user"""
    properties = db.query(Property).filter(Property.user_id == current_user.id).all()
    return [PropertyResponse.from_orm(prop) for prop in properties]

@router.post("/", response_model=PropertyResponse)
async def create_property(
    property_data: PropertyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new property"""
    
    # Create property
    db_property = Property(
        id=str(uuid.uuid4()),
        name=property_data.name,
        address=property_data.address,
        city=property_data.city,
        country=property_data.country,
        property_type=property_data.property_type,
        description=property_data.description,
        website_url=property_data.website_url,
        phone=property_data.phone,
        email=property_data.email,
        instagram_handle=property_data.instagram_handle,
        language=property_data.language,
        user_id=current_user.id
    )
    
    db.add(db_property)
    db.commit()
    db.refresh(db_property)
    
    return PropertyResponse.from_orm(db_property)

@router.get("/{property_id}", response_model=PropertyResponse)
async def get_property(
    property_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific property"""
    property = db.query(Property).filter(
        Property.id == property_id,
        Property.user_id == current_user.id
    ).first()
    
    if not property:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    return PropertyResponse.from_orm(property)

@router.put("/{property_id}", response_model=PropertyResponse)
async def update_property(
    property_id: str,
    property_data: PropertyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a property"""
    property = db.query(Property).filter(
        Property.id == property_id,
        Property.user_id == current_user.id
    ).first()
    
    if not property:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    # Update fields
    update_data = property_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(property, field, value)
    
    db.commit()
    db.refresh(property)
    
    return PropertyResponse.from_orm(property)

@router.delete("/{property_id}")
async def delete_property(
    property_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a property"""
    property = db.query(Property).filter(
        Property.id == property_id,
        Property.user_id == current_user.id
    ).first()
    
    if not property:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    db.delete(property)
    db.commit()
    
    return {"message": "Property deleted successfully"}

