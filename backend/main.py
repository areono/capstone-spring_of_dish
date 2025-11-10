import datetime
import functools
import json
import os
from typing import List, Any
import logging
import httpx
import asyncio

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from openai import OpenAI
from openai.types.chat import (
    ChatCompletionSystemMessageParam,
    ChatCompletionUserMessageParam,
    ChatCompletionMessageParam,
)
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload
from starlette import status
from starlette.responses import RedirectResponse, JSONResponse
from pydantic import BaseModel

from database import engine, get_db
from models import Base as SQLBase, Recipe, Ingredient, User, Star, Image, Notification as NotificationModel
from schemas import (
    MessageResponse,
    UserResponse,
    IngredientsResponse,
    RecipeResponse,
    IngredientResponse,
    IngredientCreate,
    IngredientUpdate,
    StarResponse,
    Notification as NotificationSchema,
    NotificationCreate,
)


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SQLBase.metadata.create_all(bind=engine)

load_dotenv()
app = FastAPI(title="spring API", root_path="/api")


# 정적 파일 경로 등록
app.mount("/static/icon", StaticFiles(directory="api/static/icon"), name="icon")

# __________________________________________________________
# 이미지 초기화
HAN_TO_ENG_ICON_MAP = {
    "계란": "egg.svg",
    "메추리알": "egg.svg",
    "감자": "potato.svg",
    "고구마": "sweet_potato.svg",
    "누룽지": "rice_bowl.svg",
    "밀가루": "flour.svg",
    "빵가루": "flour.svg",
    "쌀": "rice_bowl.svg",
    "옥수수콘": "corn.svg",
    "오트밀": "oats.svg",
    "찹쌀가루": "flour.svg",
    "감": "persimmon.svg",
    "건포도": "raisin.svg",
    "귤": "tengerine.svg",
    "딸기": "strawberry.svg",
    "라임": "lime.svg",
    "레몬": "lemon.svg",
    "망고": "mango.svg",
    "멜론": "melon.svg",
    "바나나": "banana.svg",
    "배": "pear.svg",
    "복숭아": "peach.svg",
    "블루베리": "blueberry.svg",
    "사과": "apple.svg",
    "수박": "watermelon.svg",
    "아보카도": "avocado.svg",
    "오렌지": "tangerine.svg",
    "자두": "plum.svg",
    "자몽": "grapefruit.svg",
    "체리": "cherry.svg",
    "키위": "kiwi.svg",
    "파인애플": "pineapple.svg",
    "포도": "grape.svg",
    "가지": "eggplant.svg",
    "고추": "chili.svg",
    "깻잎": "leaf.svg",
    "당근": "carrot.svg",
    "대파": "green_onion.svg",
    "마늘": "garlic.svg",
    "무": "radish.svg",
    "열무": "radish.svg",
    "바질": "basil.svg",
    "배추": "cabbage.svg",
    "브로콜리": "broccoli.svg",
    "비트": "beet.svg",
    "시금치": "spinach.svg",
    "아스파라거스": "asparagus.svg",
    "상추": "leaf.svg",
    "샐러리": "green_onion.svg",
    "애호박": "zucchini.svg",
    "양배추": "cabbage.svg",
    "양송이버섯": "mushroom.svg",
    "팽이버섯": "mushroom.svg",
    "표고버섯": "mushroom.svg",
    "양파": "onion.svg",
    "오이": "cucumber.svg",
    "콩나물": "bean_sprout.svg",
    "토마토": "tomato.svg",
    "파프리카": "bell_pepper.svg",
    "호박": "pumpkin.svg",
    "가래떡": "rice_cake.svg",
    "떡국떡": "rice_cake.svg",
    "바게트": "baguette.svg",
    "베이글": "bagel.svg",
    "식빵": "bread.svg",
    "당면": "noodle.svg",
    "라면": "ramen.svg",
    "소면": "noodle.svg",
    "수제비": "udon.svg",
    "우동": "udon.svg",
    "중화면": "udon.svg",
    "칼국수": "udon.svg",
    "파스타": "pasta.svg",
    "버터": "butter.svg",
    "생크림": "whipping_cream.svg",
    "요거트": "yogurt.svg",
    "우유": "milk.svg",
    "치즈": "cheese.svg",
    "닭고기": "chicken.svg",
    "돼지고기": "pig.svg",
    "소고기": "cow.svg",
    "양고기": "lamb.svg",
    "오리고기": "lamb.svg",
    "검은콩": "black_bean.svg",
    "땅콩": "nut_mix.svg",
    "병아리": "pea.svg",
    "아몬드": "nut_mix.svg",
    "완두": "pea.svg",
    "팥": "red_bean.svg",
    "피스타치오": "nut_mix.svg",
    "호두": "nut_mix.svg",
    "낙지젓": "octopus.svg",
    "명란젓": "roe_box.svg",
    "새우젓": "shrimp.svg",
    "오징어젓": "squid.svg",
    "간장": "sauce_bottle.svg",
    "굴소스": "sauce_bottle.svg",
    "고추장": "gochujang.svg",
    "고춧가루": "gochujang.svg",
    "깨": "seasoning_pack.svg",
    "꿀": "honey.svg",
    "까나리액젓": "sauce_bottle.svg",
    "초고추장": "gochujang.svg",
    "데리야끼": "black_source.svg",
    "돈까스 소스": "black_source.svg",
    "된장": "sauce_bowl.svg",
    "다진마늘": "dazin_garlic.svg",
    "드레싱": "seasoning_pack.svg",
    "머스타드": "yellow_bottle.svg",
    "마요네즈": "yellow_bottle.svg",
    "미원": "seasoning_pack.svg",
    "물엿": "seasoning_pack.svg",
    "맛술": "seasoning_pack.svg",
    "멸치액젓": "seasoning_pack.svg",
    "쇠고기다시다": "powder_can.svg",
    "쌈장": "sauce_bowl.svg",
    "식초": "seasoning_pack.svg",
    "소금": "salt.svg",
    "굵은소금": "salt.svg",
    "가는소금": "salt.svg",
    "올리브유": "olive_oil.svg",
    "알룰로스": "seasoning_pack.svg",
    "올리고당": "seasoning_pack.svg",
    "쯔유": "sauce_bottle.svg",
    "청국장": "sauce_bowl.svg",
    "춘장": "sauce_bowl.svg",
    "칠리소스": "hot_sauce.svg",
    "참치액젓": "seasoning_pack.svg",
    "참기름": "seasoning_pack.svg",
    "카레가루": "powder_can.svg",
    "케찹": "ketchup.svg",
    "토마토페이스트": "tomato_paste.svg",
    "파슬리": "seasoning_pack.svg",
    "파마산": "seasoning_pack.svg",
    "후추": "salt.svg",
    "핫소스": "hot_sauce.svg",
    "훠궈소스": "hot_sauce.svg",
    "갈치": "fish.svg",
    "고등어": "fish.svg",
    "꽁치": "fish.svg",
    "건새우": "shrimp.svg",
    "게맛살": "crab.svg",
    "굴": "clam.svg",
    "골뱅이": "shell.svg",
    "꽃게": "crab.svg",
    "꼬막": "scallop.svg",
    "낙지": "octopus.svg",
    "동태": "fish.svg",
    "대합": "scallop.svg",
    "다시마": "seaweed.svg",
    "도다리": "fish.svg",
    "명태": "fish.svg",
    "멸치": "fish.svg",
    "미역": "seaweed.svg",
    "문어": "octopus.svg",
    "바지락": "scallop.svg",
    "새우": "shrimp.svg",
    "소라": "shell.svg",
    "아귀": "fish.svg",
    "연어": "fish.svg",
    "오징어": "squid.svg",
    "조기": "fish.svg",
    "전어": "fish.svg",
    "조개": "scallop.svg",
    "쭈꾸미": "octopus.svg",
    "전복": "scallop.svg",
    "홍합": "mussel.svg",
    "김치": "kimchi.svg",
    "두부": "tofu.svg",
    "베이컨": "bacon.svg",
    "소세지": "bacon.svg",
    "어묵": "fishcake.svg",
    "유부": "fishcake.svg",
    "진미채": "seasoning_wheel.svg",
    "참치캔": "tuna_can.svg",
    "스팸": "tuna_can.svg",
    "감자튀김": "fries.svg",
    "냉동만두": "dumpling.svg",
    "냉동치킨너겟": "chicken_bucket.svg",
    "돈까스": "cutlet.svg",
    "해물믹스": "seafood_mix.svg",
}


def init_images(db: Session):
    """이미지 정보를 초기화합니다."""
    images = [
        {"name": han, "image_url": f"/static/icon/{eng}"}
        for han, eng in HAN_TO_ENG_ICON_MAP.items()
    ]

    for img_data in images:
        existing_image = db.query(Image).filter(Image.name == img_data["name"]).first()
        if not existing_image:
            image = Image(**img_data)
            db.add(image)

    db.commit()


def update_ingredient_images(db: Session):
    """기존 재료의 이미지 정보를 업데이트합니다."""
    ingredients = db.query(Ingredient).all()
    for ingredient in ingredients:
        if not ingredient.image_name:
            image = db.query(Image).filter(Image.name == ingredient.name).first()
            if image:
                ingredient.image_name = image.name
                db.add(ingredient)

    db.commit()


# 앱 시작 시 이미지 초기화
@app.on_event("startup")
async def startup_event():
    """서버 시작 시 실행되는 이벤트"""
    db = next(get_db())
    try:
        init_images(db)
        update_ingredient_images(db)
        
        # 주기적으로 유통기한 체크하는 태스크 시작
        asyncio.create_task(periodic_expiry_check())
    finally:
        db.close()

async def periodic_expiry_check():
    """주기적으로 유통기한을 체크하는 태스크"""
    while True:
        try:
            db = next(get_db())
            await check_expiring_ingredients(db)
        except Exception as e:
            logger.error(f"유통기한 체크 중 오류 발생: {str(e)}")
        finally:
            db.close()
        
        # 6시간마다 체크
        await asyncio.sleep(6 * 60 * 60)


# __________________________________________________________

# cors 설정

security = HTTPBearer()

origins = ["https://areono.store", "http://frontend:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

KAKAO_CLIENT_ID = os.getenv("KAKAO_CLIENT_ID")
KAKAO_CLIENT_SECRET = os.getenv("KAKAO_CLIENT_SECRET")
KAKAO_REDIRECT_URI = os.getenv("KAKAO_REDIRECT_URI")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
kauth_host = "https://kauth.kakao.com"
kapi_host = "https://kapi.kakao.com"
openai_host = "https://api.openai.com/v1"
message_template = '{"object_type":"text","text":"Hello, world!","link":{"web_url":"https://developers.kakao.com","mobile_web_url":"https://developers.kakao.com"}}'
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")


def create_jwt_token(data: dict, expires_delta: datetime.timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.datetime.now() + (
        expires_delta or datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_error_response(
    detail: str, status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
) -> HTTPException:
    """일관된 에러 응답을 생성합니다."""
    return HTTPException(status_code=status_code, detail=detail)


def create_json_response(content: dict, status_code: int = 200) -> JSONResponse:
    """JSON 응답을 생성합니다."""
    return JSONResponse(content=content, status_code=status_code)


def delete_jwt_cookie(response: JSONResponse) -> JSONResponse:
    """JWT 쿠키를 삭제합니다."""
    response.delete_cookie(key="jwt_token", httponly=True, secure=True, samesite="lax")
    return response


def handle_db_operation(operation: str) -> Any:
    """데이터베이스 작업을 위한 데코레이터 함수"""

    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except HTTPException:
                raise
            except IntegrityError:
                raise create_error_response(
                    f"{operation} 중 중복된 데이터가 발견되었습니다",
                    status.HTTP_400_BAD_REQUEST,
                )
            except Exception as e:
                raise create_error_response(
                    f"{operation} 중 오류가 발생했습니다: {str(e)}"
                )

        return wrapper

    return decorator


async def get_jwt_token(request: Request) -> str:
    """JWT 토큰을 요청 헤더에서 추출합니다."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return auth_header.split(" ")[1]


async def validate_jwt_token(jwt_token: str) -> dict:
    """JWT 토큰을 검증하고 payload를 반환합니다."""
    try:
        payload = jwt.decode(jwt_token, SECRET_KEY, algorithms=[ALGORITHM])
        kakao_access_token = payload.get("kakao_access_token")
        if not kakao_access_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    request: Request, db: Session = Depends(get_db)  # ↓ HTTPBearer 대신 Request 사용
) -> UserResponse:
    token = request.cookies.get("token")  # 쿠키에서 꺼내기
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        kakao_id = int(payload["sub"].strip("'"))
        user = db.query(User).filter(User.kakao_id == kakao_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return UserResponse(
            kakao_id=user.kakao_id,
            nickname=user.nickname,
            profile_image=user.profile_image,
            created_at=user.created_at,
        )
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def call_kakao_api(
    endpoint: str, method: str = "POST", data: dict = None
) -> dict:
    """카카오 API를 호출합니다."""
    try:
        async with httpx.AsyncClient() as ac:
            response = await ac.request(
                method=method,
                url=f"{kapi_host}{endpoint}",
                headers={"Authorization": f"Bearer {data.get('kakao_access_token')}"},
                data=data,
            )
            response.raise_for_status()
            return response.json()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Kakao API 호출 중 오류가 발생했습니다: {str(e)}",
        )


# @app.get("/", response_class=RedirectResponse)
# async def root():
#     """루트 경로 접속 시 카카오 로그인 페이지로 리다이렉트"""
#     return RedirectResponse(url="/authorize")


@app.get("/authorize", response_class=RedirectResponse)
async def authorize(request: Request) -> RedirectResponse:
    """카카오 로그인 페이지로 리다이렉트"""
    scope = request.query_params.get("scope")
    scope_param = f"&scope={scope}" if scope else ""

    state = request.query_params.get("state")
    state_param = f"&state={state}" if state else ""

    redirect_url = (
        f"{kauth_host}/oauth/authorize"
        f"?response_type=code"
        f"&client_id={KAKAO_CLIENT_ID}"
        f"&redirect_uri={KAKAO_REDIRECT_URI}"
        f"{scope_param}"
        f"{state_param}"
    )
    return RedirectResponse(redirect_url)


@app.get("/redirect")
@handle_db_operation("로그인")
async def redirect(request: Request, db: Session = Depends(get_db)) -> JSONResponse:
    """카카오 로그인 콜백 처리"""
    code = request.query_params.get("code")
    if not code:
        logger.error("No code provided in the request")
        return JSONResponse({"error": "No code provided"}, status_code=400)

    state = request.query_params.get("state") or "/"

    token_url = kauth_host + "/oauth/token"
    data = {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        "grant_type": "authorization_code",
        "client_id": KAKAO_CLIENT_ID,
        "redirect_uri": KAKAO_REDIRECT_URI,
        "client_secret": KAKAO_CLIENT_SECRET,
        "code": code,
    }

    async with httpx.AsyncClient() as ac:
        token_resp = await ac.post(token_url, data=data)
        token_json = token_resp.json()
        access_token = token_json.get("access_token")

        if not access_token:
            logger.error(f"Failed to get access token: {token_json}")
            return JSONResponse(
                {"error": "Failed to get access token", "detail": token_json},
                status_code=400,
            )

        headers = {"Authorization": f"Bearer {access_token}"}
        profile_resp = await ac.get(f"{kapi_host}/v2/user/me", headers=headers)
        if profile_resp.status_code != 200:
            logger.error(
                f"Failed to get user profile: {profile_resp.status_code} {profile_resp.text}"
            )
            return JSONResponse(
                {"error": "Failed to get user profile"}, status_code=400
            )

        profile_data = profile_resp.json()
        kakao_id = profile_data["id"]
        nickname = profile_data.get("properties", {}).get("nickname", "")
        profile_image = profile_data.get("properties", {}).get("profile_image", "")

        # 사용자 정보 저장 또는 업데이트
        user = db.query(User).filter(User.kakao_id == kakao_id).first()
        if user:
            # 기존 사용자의 경우 닉네임과 프로필 이미지만 업데이트
            user.nickname = nickname
            user.profile_image = profile_image
        else:
            # 새로운 사용자의 경우 created_at 포함하여 생성
            user = User(
                kakao_id=kakao_id,
                nickname=nickname,
                profile_image=profile_image,
                created_at=datetime.datetime.now(),
            )
            db.add(user)
            logger.info(f"New user added: {user}")
        db.commit()

        # response = RedirectResponse(url=state)

        jwt_token = create_jwt_token(
            {
                "sub": repr(kakao_id),
                "kakao_access_token": access_token,
                "nickname": nickname,
                "profile_image": profile_image,
            }
        )
        logger.info(f"JWT token created: {jwt_token}")

        # return JSONResponse({"token": jwt_token}, status_code=200)
        # 쿠키저장에 jwt json

        response = RedirectResponse(url="https://areono.store/home")
        response.set_cookie(
            key="token",
            value=jwt_token,
            httponly=True,
            secure=True,  # JavaScript에서 접근 못 함
            samesite="None",
            max_age=60 * 60 * 24 * 1,  # 7일
            path="/",
        )
        return response


@app.get("/profile", response_model=UserResponse)
async def profile(
    current_user: UserResponse = Depends(get_current_user),
) -> UserResponse:
    """사용자 프로필 정보를 조회합니다."""
    return current_user


# @app.post("/logout", response_model=MessageResponse)
# async def logout(request: Request):
#     jwt_token = await get_jwt_token(request)
#     payload = await validate_jwt_token(jwt_token)
#     data = {'kakao_access_token': payload.get('kakao_access_token')}

#     await call_kakao_api("/v1/user/logout", data=data)

#     response = create_json_response({"message": "Logged out successfully"})
#     return delete_jwt_cookie(response)


# @app.post("/unlink", response_model=MessageResponse)
# async def unlink(request: Request, db: Session = Depends(get_db)):
#     jwt_token = await get_jwt_token(request)
#     payload = await validate_jwt_token(jwt_token)
#     data = {'kakao_access_token': payload.get('kakao_access_token')}

#     await call_kakao_api("/v1/user/unlink", data=data)

#     # 사용자 데이터 삭제
#     user = db.query(User).filter(User.kakao_id == int(payload["sub"].strip("'"))).first()
#     if user:
#         db.delete(user)
#         db.commit()

#     response = create_json_response({"message": "Account unlinked successfully"})
#     return delete_jwt_cookie(response)


@app.get("/user-ingredients", response_model=IngredientsResponse)
@handle_db_operation("재료 조회")
async def get_user_ingredients(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> IngredientsResponse:
    """사용자의 재료 목록을 조회합니다."""
    ingredients = (
        db.query(Ingredient)
        .options(joinedload(Ingredient.image))
        .filter(
            Ingredient.kakao_id == current_user.kakao_id,
            Ingredient.added_date <= datetime.datetime.now(),
            Ingredient.limit_date >= datetime.datetime.now(),
        )
        .all()
    )

    return IngredientsResponse(
        ingredients=[ingredient.to_dict() for ingredient in ingredients]
    )


@app.post("/ingredients", response_model=IngredientResponse)
@handle_db_operation("재료 추가")
async def add_ingredient(
    ingredient: IngredientCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> IngredientResponse:
    """새로운 재료를 추가합니다."""
    try:
        # 재료 이름으로 이미지 찾기
        image = db.query(Image).filter(Image.name == ingredient.name).first()

        image_name = HAN_TO_ENG_ICON_MAP.get(ingredient.name)
        image_url = f"/static/icon/{image_name}" if image_name else None

        new_ingredient = Ingredient.create(
            db=db,
            name=ingredient.name,
            category=ingredient.category,
            added_date=ingredient.added_date,
            kakao_id=current_user.kakao_id,
            image_name=image.name if image else None,
        )
        db.commit()
        db.refresh(new_ingredient)

        return IngredientResponse(
            id=int(getattr(new_ingredient, "id")),
            name=str(getattr(new_ingredient, "name")),
            category=str(getattr(new_ingredient, "category")),
            added_date=getattr(new_ingredient, "added_date"),
            limit_date=getattr(new_ingredient, "limit_date"),
            is_expired=bool(getattr(new_ingredient, "is_expired")),
            days_until_expiry=int(getattr(new_ingredient, "days_until_expiry")),
            image_url=image_url,
        )
    except Exception as e:
        db.rollback()
        raise create_error_response(
            f"재료 추가 중 오류가 발생했습니다: {str(e)}",
            status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@app.put("/ingredients/{ingredient_id}", response_model=IngredientResponse)
@handle_db_operation("재료 수정")
async def update_ingredient(
    ingredient_id: int,
    ingredient: IngredientUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> IngredientResponse:
    """재료 정보를 수정합니다."""
    try:
        db_ingredient = (
            db.query(Ingredient)
            .filter(
                Ingredient.id == ingredient_id,
                Ingredient.kakao_id == current_user.kakao_id,
            )
            .first()
        )

        if not db_ingredient:
            raise HTTPException(status_code=404, detail="재료를 찾을 수 없습니다.")

        if ingredient.name is not None:
            db_ingredient.name = ingredient.name
        if ingredient.category is not None:
            db_ingredient.category = ingredient.category
        if ingredient.added_date is not None:
            db_ingredient.added_date = ingredient.added_date
        if ingredient.limit_date is not None:
            db_ingredient.limit_date = ingredient.limit_date
        # 이미지 이름이 제공된 경우 해당 이미지가 존재하는지 확인
        if ingredient.image_name is not None:
            image = db.query(Image).filter(Image.name == ingredient.image_name).first()
            if not image:
                raise create_error_response(
                    f"이미지 '{ingredient.image_name}'을 찾을 수 없습니다",
                    status.HTTP_400_BAD_REQUEST,
                )
            db_ingredient.image_name = ingredient.image_name
        if ingredient.is_frozen is not None:
            db_ingredient.is_frozen = ingredient.is_frozen

        db.commit()
        db.refresh(db_ingredient)

        return IngredientResponse(
            id=db_ingredient.id,
            name=db_ingredient.name,
            category=db_ingredient.category,
            added_date=db_ingredient.added_date,
            limit_date=db_ingredient.limit_date,
            is_frozen=db_ingredient.is_frozen,
            is_expired=db_ingredient.is_expired,
            days_until_expiry=db_ingredient.days_until_expiry,
            image_url=db_ingredient.image.image_url if db_ingredient.image else None,
        )
    except Exception as e:
        db.rollback()
        logger.error(f"재료 수정 실패: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"재료 수정 중 오류가 발생했습니다: {str(e)}"
        )


@app.delete("/ingredients/{ingredient_id}", response_model=MessageResponse)
@handle_db_operation("재료 삭제")
async def delete_ingredient(
    ingredient_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MessageResponse:
    """재료를 삭제합니다."""
    db_ingredient = (
        db.query(Ingredient)
        .filter(
            Ingredient.id == ingredient_id, Ingredient.kakao_id == current_user.kakao_id
        )
        .first()
    )

    if not db_ingredient:
        raise create_error_response(
            "재료를 찾을 수 없습니다", status.HTTP_404_NOT_FOUND
        )

    db.delete(db_ingredient)
    db.commit()

    return MessageResponse(message="재료가 삭제되었습니다")


@app.get("/recipes", response_model=List[RecipeResponse])
@handle_db_operation("레시피 조회")
async def get_recipes(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[RecipeResponse]:
    """사용자가 좋아요를 누른 레시피 목록을 조회합니다."""
    recipes = (
        db.query(Recipe).join(Star).filter(Star.kakao_id == current_user.kakao_id).all()
    )

    recipe_list = [
        RecipeResponse(
            id=int(getattr(recipe, "id")),
            title=str(getattr(recipe, "title")),
            subtitle=str(getattr(recipe, "subtitle")),
            youtube_link=str(getattr(recipe, "youtube_link")),
            steps=getattr(recipe, "steps"),
            ingredients=getattr(recipe, "ingredients"),
            seasonings=getattr(recipe, "seasonings"),
            created_at=getattr(recipe, "created_at"),
            kakao_id=current_user.kakao_id,
        )
        for recipe in recipes
    ]
    return recipe_list


@app.get("/recipes/{recipe_id}", response_model=RecipeResponse)
@handle_db_operation("레시피 조회")
async def get_recipe_detail(
    recipe_id: int, db: Session = Depends(get_db)
) -> RecipeResponse:
    """특정 레시피의 상세 정보를 조회합니다."""
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise create_error_response(
            "레시피를 찾을 수 없습니다", status.HTTP_404_NOT_FOUND
        )

    return RecipeResponse(
        id=int(getattr(recipe, "id")),
        title=str(getattr(recipe, "title")),
        subtitle=str(getattr(recipe, "subtitle")),
        youtube_link=str(getattr(recipe, "youtube_link")),
        steps=getattr(recipe, "steps"),
        ingredients=getattr(recipe, "ingredients"),
        seasonings=getattr(recipe, "seasonings"),
        created_at=getattr(recipe, "created_at"),
    )


@app.post("/recipes/{recipe_id}/star", response_model=StarResponse)
@handle_db_operation("좋아요 처리")
async def toggle_star(
    recipe_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StarResponse:
    """레시피에 좋아요를 토글합니다."""
    try:
        # 레시피가 존재하는지 확인
        recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
        if not recipe:
            raise create_error_response(
                "레시피를 찾을 수 없습니다", status.HTTP_404_NOT_FOUND
            )

        # 이미 좋아요를 눌렀는지 확인
        existing_star = (
            db.query(Star)
            .filter(Star.recipe_id == recipe.id, Star.kakao_id == current_user.kakao_id)
            .first()
        )

        if existing_star:
            # 좋아요 취소
            star_data = StarResponse(
                recipe_id=int(getattr(existing_star, "recipe_id")),
                kakao_id=int(getattr(existing_star, "kakao_id")),
                created_at=getattr(existing_star, "created_at"),
            )
            db.delete(existing_star)
            db.commit()
            return star_data
        else:
            # 좋아요 추가
            new_star = Star(
                recipe_id=int(getattr(recipe, "id")),
                kakao_id=current_user.kakao_id,
                created_at=datetime.datetime.now(),
            )
            db.add(new_star)
            try:
                db.commit()
                db.refresh(new_star)
                return StarResponse(
                    recipe_id=int(getattr(new_star, "recipe_id")),
                    kakao_id=int(getattr(new_star, "kakao_id")),
                    created_at=getattr(new_star, "created_at"),
                )
            except IntegrityError:
                db.rollback()
                raise create_error_response(
                    "이미 좋아요를 누른 레시피입니다", status.HTTP_400_BAD_REQUEST
                )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise create_error_response(
            f"좋아요 처리 중 오류가 발생했습니다: {str(e)}",
            status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


async def search_youtube_video(query: str) -> List[dict]:
    """YouTube API를 사용하여 요리 영상을 비동기로 검색합니다."""
    try:
        if not YOUTUBE_API_KEY:
            raise ValueError("YouTube API 키가 설정되지 않았습니다.")

        url = "https://www.googleapis.com/youtube/v3/search"
        params = {
            "part": "snippet",
            "q": query,
            "type": "video",
            "videoCategoryId": "26",  # Food & Drink category
            "maxResults": 5,  # 바로 5개만 가져오기
            "key": YOUTUBE_API_KEY,
            "relevanceLanguage": "ko",  # 한국어 결과 우선
            "regionCode": "KR",  # 한국 지역 결과 우선
            "order": "relevance",  # 관련성 순으로 정렬
        }

        async with httpx.AsyncClient() as ac:
            response = await ac.get(url, params=params)
            response.raise_for_status()

            try:
                data = response.json()
            except json.JSONDecodeError as e:
                raise ValueError(f"YouTube API 응답을 파싱할 수 없습니다: {str(e)}")

            if "error" in data:
                error_message = data["error"].get("message", "Unknown error")
                raise ValueError(f"YouTube API 오류: {error_message}")

            if "items" not in data or not data["items"]:
                return []

            results = []
            for item in data["items"]:
                try:
                    if not isinstance(item, dict):
                        continue

                    video_id = item.get("id", {}).get("videoId")
                    snippet = item.get("snippet", {})
                    thumbnails = snippet.get("thumbnails", {})
                    high_thumbnail = thumbnails.get("high", {})

                    if not all([video_id, snippet, high_thumbnail]):
                        continue

                    video_data = {
                        "video_id": video_id,
                        "title": snippet.get("title", ""),
                        "thumbnail": high_thumbnail.get("url", ""),
                        "url": f"https://www.youtube.com/watch?v={video_id}",
                    }

                    # 필수 필드가 모두 있는지 확인
                    if all(video_data.values()):
                        results.append(video_data)
                except Exception as e:
                    continue

            return results

    except Exception as e:
        raise ValueError(f"YouTube 검색 중 오류 발생: {str(e)}")


async def get_video_metadata(video_url: str) -> dict:
    """YouTube API를 사용하여 비디오의 메타데이터를 가져옵니다."""
    try:
        if not YOUTUBE_API_KEY:
            raise ValueError("YouTube API 키가 설정되지 않았습니다.")

        # URL에서 video_id 추출
        if "youtube.com/watch?v=" in video_url:
            video_id = video_url.split("watch?v=")[-1].split("&")[0]
        elif "youtube.com/shorts/" in video_url:
            video_id = video_url.split("shorts/")[-1].split("?")[0]
        else:
            raise ValueError(f"지원하지 않는 YouTube URL 형식입니다: {video_url}")

        url = "https://www.googleapis.com/youtube/v3/videos"
        params = {"part": "snippet", "id": video_id, "key": YOUTUBE_API_KEY}

        async with httpx.AsyncClient() as ac:
            response = await ac.get(url, params=params)
            response.raise_for_status()

            try:
                data = response.json()
            except json.JSONDecodeError as e:
                raise ValueError(f"YouTube API 응답을 파싱할 수 없습니다: {str(e)}")

            if "error" in data:
                error_message = data["error"].get("message", "Unknown error")
                raise ValueError(f"YouTube API 오류: {error_message}")

            if "items" not in data or not data["items"]:
                raise ValueError(f"비디오를 찾을 수 없습니다. (ID: {video_id})")

            item = data["items"][0].get("snippet", {})
            if not item:
                raise ValueError("비디오 정보가 올바르지 않습니다.")

            metadata = {
                "title": item.get("title", ""),
                "description": item.get("description", ""),
                "tags": item.get("tags", []),
                "url": video_url,
            }

            # 필수 필드 검증
            if not metadata["title"]:
                raise ValueError("비디오 제목을 찾을 수 없습니다.")

            return metadata

    except Exception as e:
        raise ValueError(f"비디오 메타데이터 가져오기 실패: {str(e)}")


async def generate_recipe_with_gpt(video_url: str) -> dict:
    """GPT API를 사용하여 YouTube 영상의 레시피를 분석하고 생성합니다."""
    try:
        # 비디오 메타데이터 가져오기
        metadata = await get_video_metadata(video_url)
        if not metadata:
            raise ValueError("비디오 정보를 가져올 수 없습니다.")

        prompt = f"""다음 YouTube 영상의 정보를 바탕으로 요리 레시피를 생성해주세요.

영상 제목: {metadata['title']}
영상 설명: {metadata['description']}
영상 태그: {', '.join(metadata['tags']) if metadata['tags'] else '없음'}

아래 JSON 형식으로 정확히 응답해주세요. 다른 설명이나 텍스트는 포함하지 마세요:
{{
    "recipe": {{
        "title": "한국어 요리 제목 (2-50자)",
        "subtitle": "한국어로 된 간단한 설명 (10-100자)",
        "steps": [
            "한국어로 된 1단계 설명 (20자 이상)",
            "한국어로 된 2단계 설명 (20자 이상)",
            "한국어로 된 3단계 설명 (20자 이상)"
        ],
        "ingredients": [
            "한국어로 된 재료 1",
            "한국어로 된 재료 2",
            "한국어로 된 재료 3"
        ],
        "seasonings": [
            "한국어로 된 양념 1",
            "한국어로 된 양념 2",
            "한국어로 된 양념 3"
        ],
        "youtube_url": "{video_url}"
    }}
}}"""

        system_message: ChatCompletionSystemMessageParam = {
            "role": "system",
            "content": """당신은 한국 요리 전문가입니다.
주어진 YouTube 영상의 정보를 바탕으로 상세한 요리 레시피를 생성해주세요.
모든 설명은 반드시 한국어로 작성해주세요.
레시피는 실용적이고 따라하기 쉬워야 합니다.
영상의 제목, 설명, 태그를 바탕으로 재료와 양념을 정확히 파악하고 설명해주세요.
반드시 요청된 JSON 형식을 정확히 지켜주세요.
다른 설명이나 텍스트는 포함하지 마세요.""",
        }
        user_message: ChatCompletionUserMessageParam = {
            "role": "user",
            "content": prompt,
        }
        messages: List[ChatCompletionMessageParam] = [system_message, user_message]

        response = client.chat.completions.create(
            model="gpt-4.1",
            messages=messages,
            temperature=0.3,
            max_tokens=2000,
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content.strip()

        try:
            recipe_data = json.loads(content)
            if not isinstance(recipe_data, dict) or "recipe" not in recipe_data:
                raise ValueError("Invalid recipe data format: missing 'recipe' key")

            recipe = recipe_data["recipe"]
            required_fields = [
                "title",
                "subtitle",
                "steps",
                "ingredients",
                "seasonings",
                "youtube_url",
            ]
            missing_fields = [field for field in required_fields if field not in recipe]
            if missing_fields:
                raise ValueError(
                    f"Missing required fields in recipe: {', '.join(missing_fields)}"
                )

            # 한국어 검증 로직
            def contains_korean(text):
                return any(ord("가") <= ord(c) <= ord("힣") for c in text)

            if not contains_korean(recipe["title"]):
                raise ValueError("Recipe title must contain Korean characters")

            # 단계 설명 검증
            if len(recipe["steps"]) < 3:
                raise ValueError("Recipe must have at least 3 steps")

            for step in recipe["steps"]:
                if not contains_korean(step):
                    raise ValueError("Recipe steps must be in Korean")
                if len(step) < 20:
                    raise ValueError(
                        "Recipe step description must be at least 20 characters"
                    )

            return {"status": "success", "recipe": recipe}

        except json.JSONDecodeError as e:
            raise ValueError(f"GPT API 응답을 파싱할 수 없습니다: {str(e)}")
        except ValueError as e:
            raise ValueError(f"레시피 데이터 형식이 올바르지 않습니다: {str(e)}")

    except Exception as e:
        raise ValueError(f"레시피 생성 중 오류가 발생했습니다: {str(e)}")


class RecipeRequest(BaseModel):
    ingredients: List[str]


@app.post("/generate-recipe")
@handle_db_operation("레시피 생성")
async def generate_recipe(
    req: RecipeRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """선택된 재료(1~3개)로 유튜브 요리 영상을 추천합니다."""
    ingredient_names = req.ingredients
    if not (1 <= len(ingredient_names) <= 3):
        raise create_error_response(
            "재료는 1~3개만 선택 가능합니다.", status.HTTP_400_BAD_REQUEST
        )
    query = " ".join(ingredient_names) + " 요리"
    try:
        logger.info(f"YouTube 검색 시도: {query}")
        videos = await search_youtube_video(query)
    except Exception as e:
        logger.error(f"YouTube 검색 실패 - 쿼리: {query}, 오류: {str(e)}")
        videos = []
    # 중복 제거 및 최대 5개로 제한
    unique_videos = []
    seen_urls = set()
    for video in videos:
        if video["url"] not in seen_urls:
            seen_urls.add(video["url"])
            unique_videos.append(video)
        if len(unique_videos) >= 5:
            break
    if not unique_videos:
        logger.warning(
            f"적절한 요리 영상을 찾을 수 없음 - 사용자: {current_user.kakao_id}"
        )
        raise create_error_response(
            "적절한 요리 영상을 찾을 수 없습니다.", status.HTTP_404_NOT_FOUND
        )
    logger.info(
        f"레시피 생성 완료 - 사용자: {current_user.kakao_id}, 영상 수: {len(unique_videos)}"
    )
    return {
        "status": "success",
        "message": "YouTube 검색 결과",
        "videos": unique_videos,
    }


@app.post("/generate-recipe-details")
@handle_db_operation("레시피 상세 생성")
async def generate_recipe_details(
    video_url: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """선택된 YouTube 영상에 대한 레시피 상세 정보를 생성합니다."""
    try:
        # GPT로 레시피 상세 정보 생성
        result = await generate_recipe_with_gpt(video_url)

        if not result or "recipe" not in result:
            raise create_error_response(
                "레시피 상세 정보를 생성할 수 없습니다.",
                status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        recipe = result["recipe"]

        # 레시피 저장
        new_recipe = Recipe(
            title=recipe["title"],
            subtitle=recipe["subtitle"],
            youtube_link=recipe["youtube_url"],
            steps=recipe["steps"],
            ingredients=recipe["ingredients"],
            seasonings=recipe["seasonings"],
            created_at=datetime.datetime.now(),
            kakao_id=current_user.kakao_id,
        )
        db.add(new_recipe)
        db.commit()
        db.refresh(new_recipe)

        return {
            "status": "success",
            "message": "레시피 상세 정보가 생성되었습니다.",
            "recipe": {**recipe, "id": new_recipe.id, "is_starred": False},
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise create_error_response(
            f"레시피 상세 정보 생성 중 오류가 발생했습니다: {str(e)}",
            status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@app.get("/test/youtube")
async def test_youtube():
    """YouTube API 테스트"""
    try:
        # 단일 검색어로 테스트
        test_query = "감자 요리"

        try:
            videos = await search_youtube_video(test_query)
            if not videos:
                return JSONResponse(
                    {
                        "status": "error",
                        "message": "검색 결과가 없습니다.",
                        "query": test_query,
                    },
                    status_code=404,
                )

            return JSONResponse(
                {
                    "status": "success",
                    "message": "YouTube API 테스트 완료",
                    "query": test_query,
                    "video_count": len(videos),
                    "videos": [
                        {
                            "title": video["title"],
                            "url": video["url"],
                            "thumbnail": video["thumbnail"],
                        }
                        for video in videos
                    ],
                }
            )
        except Exception as e:
            return JSONResponse(
                {
                    "status": "error",
                    "message": f"YouTube 검색 실패: {str(e)}",
                    "query": test_query,
                },
                status_code=500,
            )

    except Exception as e:
        return JSONResponse(
            {"status": "error", "message": f"YouTube API 테스트 실패: {str(e)}"},
            status_code=500,
        )


@app.get("/test/gpt")
async def test_gpt():
    """GPT API 테스트"""
    try:
        # 테스트용 YouTube URL (실제 존재하는 요리 영상)
        test_video_url = (
            "https://www.youtube.com/watch?v=rDwyR7gkxvU"  # 감자조림 레시피 영상
        )

        # GPT로 레시피 생성
        result = await generate_recipe_with_gpt(test_video_url)

        if not result or "recipe" not in result:
            return JSONResponse(
                {
                    "status": "error",
                    "message": "GPT API 응답이 없습니다.",
                    "video_url": test_video_url,
                },
                status_code=500,
            )

        recipe = result["recipe"]

        # 결과 검증
        validation = {
            "title": {
                "value": recipe["title"],
                "has_korean": any(
                    ord("가") <= ord(c) <= ord("힣") for c in recipe["title"]
                ),
                "length": len(recipe["title"]),
            },
            "subtitle": {
                "value": recipe["subtitle"],
                "has_korean": any(
                    ord("가") <= ord(c) <= ord("힣") for c in recipe["subtitle"]
                ),
                "length": len(recipe["subtitle"]),
            },
            "steps": {
                "count": len(recipe["steps"]),
                "all_have_korean": all(
                    any(ord("가") <= ord(c) <= ord("힣") for c in step)
                    for step in recipe["steps"]
                ),
                "min_length": (
                    min(len(step) for step in recipe["steps"]) if recipe["steps"] else 0
                ),
            },
            "ingredients": {
                "count": len(recipe["ingredients"]),
                "all_have_korean": all(
                    any(ord("가") <= ord(c) <= ord("힣") for c in ing)
                    for ing in recipe["ingredients"]
                ),
            },
            "seasonings": {
                "count": len(recipe["seasonings"]),
                "all_have_korean": all(
                    any(ord("가") <= ord(c) <= ord("힣") for c in sea)
                    for sea in recipe["seasonings"]
                ),
            },
        }

        return JSONResponse(
            {
                "status": "success",
                "message": "GPT API 테스트 완료",
                "video_url": test_video_url,
                "recipe": recipe,
                "validation": validation,
            }
        )
    except Exception as e:
        return JSONResponse(
            {
                "status": "error",
                "message": f"GPT API 테스트 실패: {str(e)}",
                "video_url": test_video_url,
            },
            status_code=500,
        )


@app.get("/test/full-flow")
async def test_full_flow():
    """전체 레시피 생성 프로세스 테스트"""
    try:
        # 1. YouTube 검색 테스트
        test_query = "감자 요리"

        # YouTube 검색
        videos = await search_youtube_video(test_query)
        if not videos:
            return JSONResponse(
                {
                    "status": "error",
                    "message": "YouTube 검색 결과가 없습니다.",
                    "query": test_query,
                },
                status_code=404,
            )

        # 첫 번째 영상 선택
        selected_video = videos[0]

        # 2. 선택된 영상으로 GPT 테스트
        try:
            result = await generate_recipe_with_gpt(selected_video["url"])
            return JSONResponse(
                {
                    "status": "success",
                    "message": "전체 프로세스 테스트 완료",
                    "query": test_query,
                    "selected_video": {
                        "title": selected_video["title"],
                        "url": selected_video["url"],
                        "thumbnail": selected_video["thumbnail"],
                    },
                    "recipe": result["recipe"],
                }
            )
        except Exception as e:
            return JSONResponse(
                {
                    "status": "error",
                    "message": f"GPT 레시피 생성 실패: {str(e)}",
                    "query": test_query,
                    "selected_video": {
                        "title": selected_video["title"],
                        "url": selected_video["url"],
                        "thumbnail": selected_video["thumbnail"],
                    },
                },
                status_code=500,
            )

    except Exception as e:
        return JSONResponse(
            {
                "status": "error",
                "message": f"전체 프로세스 테스트 실패: {str(e)}",
                "query": test_query,
            },
            status_code=500,
        )


async def check_expiring_ingredients(db: Session):
    """유통기한이 3일 이하로 남은 재료를 확인하고 알림을 생성합니다."""
    now = datetime.datetime.now()
    three_days_later = now + datetime.timedelta(days=3)
    
    # 유통기한이 3일 이하로 남은 재료 조회
    expiring_ingredients = db.query(Ingredient).filter(
        Ingredient.limit_date <= three_days_later,
        Ingredient.limit_date > now
    ).all()
    
    notifications_created = []
    
    for ingredient in expiring_ingredients:
        # 이미 알림이 있는지 확인
        existing_notification = db.query(NotificationModel).filter(
            NotificationModel.kakao_id == ingredient.kakao_id,
            NotificationModel.title == "유통기한 임박 알림",
            NotificationModel.body.like(f"%{ingredient.name}%"),
            NotificationModel.created_at >= now - datetime.timedelta(days=1)
        ).first()
        
        if not existing_notification:
            days_left = (ingredient.limit_date - now).days
            notification = NotificationModel(
                kakao_id=ingredient.kakao_id,
                title="유통기한 임박 알림",
                body=f"{ingredient.name}의 유통기한이 {days_left}일 남았습니다.",
                is_read=False
            )
            db.add(notification)
            notifications_created.append(notification)
    
    if notifications_created:
        db.commit()
    
    return notifications_created

@app.get("/check-expiring-ingredients")
@handle_db_operation("유통기한 임박 재료 확인")
async def check_expiring_ingredients_endpoint(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """유통기한이 3일 이하로 남은 재료를 확인하고 알림을 생성합니다."""
    notifications = await check_expiring_ingredients(db)
    return create_json_response({
        "message": f"{len(notifications)}개의 알림이 생성되었습니다.",
        "notifications": [n.to_dict() for n in notifications]
    })


@app.get("/notifications")
@handle_db_operation("알림 조회")
async def get_notifications(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """사용자의 알림 목록을 조회합니다."""
    try:
        notifications = db.query(NotificationModel).filter(
            NotificationModel.kakao_id == current_user.kakao_id
        ).order_by(NotificationModel.created_at.desc()).all()
        
        return create_json_response({
            "notifications": [
                {
                    "id": n.id,
                    "title": n.title,
                    "body": n.body,
                    "isRead": n.is_read,
                    "createdAt": n.created_at.isoformat()
                }
                for n in notifications
            ]
        })
    except Exception as e:
        logger.error(f"알림 조회 중 오류 발생: {str(e)}")
        return create_error_response("알림 조회 중 오류가 발생했습니다.")


@app.put("/notifications/{notification_id}/read")
@handle_db_operation("알림 읽음 처리")
async def mark_notification_as_read(
    notification_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """알림을 읽음 처리합니다."""
    try:
        notification = db.query(NotificationModel).filter(
            NotificationModel.id == notification_id,
            NotificationModel.kakao_id == current_user.kakao_id
        ).first()
        
        if not notification:
            return create_error_response("알림을 찾을 수 없습니다.", status.HTTP_404_NOT_FOUND)
        
        notification.is_read = True
        db.commit()
        
        return create_json_response({
            "message": "알림이 읽음 처리되었습니다.",
            "notification": {
                "id": notification.id,
                "title": notification.title,
                "body": notification.body,
                "isRead": notification.is_read,
                "createdAt": notification.created_at.isoformat()
            }
        })
    except Exception as e:
        logger.error(f"알림 읽음 처리 중 오류 발생: {str(e)}")
        return create_error_response("알림 읽음 처리 중 오류가 발생했습니다.")

@app.delete("/notifications/{notification_id}")
@handle_db_operation("알림 삭제")
async def delete_notification(
    notification_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """알림을 삭제합니다."""
    try:
        notification = db.query(NotificationModel).filter(
            NotificationModel.id == notification_id,
            NotificationModel.kakao_id == current_user.kakao_id
        ).first()
        
        if not notification:
            return create_error_response("알림을 찾을 수 없습니다.", status.HTTP_404_NOT_FOUND)
        
        db.delete(notification)
        db.commit()
        
        return create_json_response({
            "message": "알림이 삭제되었습니다.",
            "id": notification_id
        })
    except Exception as e:
        logger.error(f"알림 삭제 중 오류 발생: {str(e)}")
        return create_error_response("알림 삭제 중 오류가 발생했습니다.")




