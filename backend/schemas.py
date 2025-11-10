from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

class BaseSchema(BaseModel):
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class MessageResponse(BaseSchema):
    message: str


class ErrorResponse(BaseSchema):
    detail: str


class UserResponse(BaseSchema):
    kakao_id: int
    nickname: str
    profile_image: str
    created_at: datetime


class ImageResponse(BaseSchema):
    id: int
    name: str
    image_url: str


class IngredientCreate(BaseSchema):
    name: str
    category: str
    added_date: datetime


class IngredientUpdate(BaseSchema):
    name: Optional[str] = None
    category: Optional[str] = None
    added_date: Optional[datetime] = None
    limit_date: Optional[datetime] = None
    image_name: Optional[str] = None
    is_frozen: Optional[bool] = None


class IngredientResponse(BaseSchema):
    id: int
    name: str
    category: str
    added_date: datetime
    limit_date: datetime
    is_frozen: Optional[bool] = False
    is_expired: bool
    days_until_expiry: int
    image_url: Optional[str] = None


class IngredientsResponse(BaseSchema):
    ingredients: List[IngredientResponse]


class RecipeBase(BaseSchema):
    title: str = Field(..., max_length=255)
    subtitle: Optional[str] = Field(None, max_length=255)
    youtube_link: str
    steps: List[str]  # 요리 단계
    ingredients: List[str]  # 재료 목록
    seasonings: List[str]  # 양념 목록
    kakao_id: int


class RecipeCreate(RecipeBase):
    pass


class RecipeResponse(RecipeBase):
    id: int
    created_at: datetime


class StarResponse(BaseSchema):
    recipe_id: int
    kakao_id: int
    created_at: datetime


class StarBase(BaseModel):
    kakao_id: int
    recipe_id: int


class StarCreate(StarBase):
    pass


class NotificationBase(BaseModel):
    title: str
    body: str


class NotificationCreate(NotificationBase):
    pass

class Notification(NotificationBase):
    id: int
    kakao_id: int
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
    