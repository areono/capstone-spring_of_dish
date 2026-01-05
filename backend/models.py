import datetime

from sqlalchemy import Column, Integer, ForeignKey, func, VARCHAR, DateTime, BigInteger, JSON, UniqueConstraint, String, Boolean
from sqlalchemy.orm import relationship

from database import Base

class User(Base):
    __tablename__ = "users"

    kakao_id = Column(BigInteger, primary_key=True, index=True)
    nickname = Column(VARCHAR(255))
    profile_image = Column(VARCHAR(255))
    created_at = Column(DateTime, default=datetime.datetime.now)

    # fcm_token = Column(VARCHAR(255), nullable=True)
    push_subscription = Column(VARCHAR(2000), nullable=True)

    ingredients = relationship("Ingredient", back_populates="user")
    stars = relationship("Star", back_populates="user")
    recipes = relationship("Recipe", back_populates="user")
    notifications = relationship("Notification", back_populates="user")

class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(VARCHAR(255), nullable=False)
    subtitle = Column(VARCHAR(255))
    youtube_link = Column(VARCHAR(255), nullable=False)
    steps = Column(JSON, nullable=False)  # 요리 단계
    ingredients = Column(JSON, nullable=False)  # 재료 목록
    seasonings = Column(JSON, nullable=False)  # 양념 목록
    created_at = Column(DateTime(timezone=True), default=func.now())
    kakao_id = Column(BigInteger, ForeignKey("users.kakao_id"), nullable=True)

    stars = relationship("Star", back_populates="recipe")
    user = relationship("User", back_populates="recipes")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "subtitle": self.subtitle,
            "youtube_link": self.youtube_link,
            "steps": self.steps,
            "ingredients": self.ingredients,
            "seasonings": self.seasonings,
            "created_at": self.created_at
        }


class Star(Base):
    __tablename__ = "stars"

    id = Column(Integer, primary_key=True, index=True)
    kakao_id = Column(BigInteger, ForeignKey("users.kakao_id"), nullable=False)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    recipe = relationship("Recipe", back_populates="stars")
    user = relationship("User", back_populates="stars")

    __table_args__ = (
        UniqueConstraint('recipe_id', 'kakao_id', name='uix_recipe_user'),
    )


class Image(Base):
    __tablename__ = "images"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(VARCHAR(255), nullable=False, unique=True)
    image_url = Column(VARCHAR(255), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "image_url": self.image_url
        }


class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(VARCHAR(255), index=True)
    category = Column(VARCHAR(50))  # 카테고리 (예: "채소", "육류", "조미료")
    added_date = Column(DateTime, default=datetime.datetime.now)
    limit_date = Column(DateTime, nullable=False)
    #is_frozen = Column(Boolean, default=False)
    kakao_id = Column(BigInteger, ForeignKey("users.kakao_id"))
    image_name = Column(VARCHAR(255), ForeignKey("images.name"), nullable=True)

    user = relationship("User", back_populates="ingredients")
    image = relationship("Image", foreign_keys=[image_name], primaryjoin="Ingredient.image_name == Image.name")

    @property
    def is_expired(self):
        return datetime.datetime.now() > self.limit_date

    @property
    def days_until_expiry(self):
        return (self.limit_date - datetime.datetime.now()).days

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "added_date": self.added_date.isoformat(),
            "limit_date": self.limit_date.isoformat(),
            "is_frozen": self.is_frozen,
            "is_expired": self.is_expired,
            "days_until_expiry": self.days_until_expiry,
            "image_url": self.image.image_url if self.image else None
        }

    @classmethod
    def create(cls, db, name, category, added_date, kakao_id, image_name=None, is_frozen=False):
        ingredient = cls(
            name=name,
            category=category,
            added_date=added_date,
            limit_date=added_date + datetime.timedelta(days=15),
            kakao_id=kakao_id,
            image_name=image_name,
            is_frozen=is_frozen
        )
        db.add(ingredient)
        db.commit()
        db.refresh(ingredient)
        return ingredient


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    kakao_id = Column(BigInteger, ForeignKey("users.kakao_id"), nullable=False)
    title = Column(VARCHAR(255), nullable=False)
    body = Column(VARCHAR(1000), nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.now)

    user = relationship("User", back_populates="notifications")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "body": self.body,
            "isRead": self.is_read,
            "createdAt": self.created_at.isoformat()
        }
        