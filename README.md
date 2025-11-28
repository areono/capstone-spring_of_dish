# team-03
# 🥗 Spring of Dish (자취생을 위한 AI 레시피 추천 서비스)

> **OpenAI API를 활용하여 자취생들이 가진 냉장고 속 재료로 만들 수 있는 요리를 추천해주는 서비스입니다.**

## 📅 프로젝트 기간
- 2025.03 ~ 2025.06 (캡스톤 디자인)

## 🛠 Tech Stack (기술 스택)
**Backend**
- **Language:** Python 3.12
- **Framework:** FastAPI
- **ORM:** SQLAlchemy
- **Auth:** Kakao OAuth2, JWT

**Database**
- MariaDB

**Infra & DevOps**
- **Container:** Docker, Docker Compose
- **Web Server:** Nginx
- **CI/CD & SCM:** GitLab

**External API**
- OpenAI API (레시피 생성)

## 👨‍💻 My Role (담당 역할)
* **Backend Lead:** * FastAPI 기반 고성능 비동기 API 서버 구축 및 설계
    * SQLAlchemy ORM을 활용한 DB 스키마 설계 및 쿼리 최적화
    * Kakao OAuth2 및 JWT 기반 인증 시스템 구현
* **Infrastructure:** * Dockerfile 및 Docker Compose 작성 (Nginx, App, DB 연동)
    * 배포 환경 구성 및 환경 변수(.env) 보안 관리
* **Collaboration:** * 프론트엔드 연동 이슈 적극 지원 (이미지 경로 문제 등 트러블 슈팅 주도)
    * API 명세 관리 및 GitLab을 통한 형상 관리
      
## 💡 Key Features (핵심 기능)
1. **OAuth2 & JWT 인증 시스템**
    - Kakao 소셜 로그인을 통해 진입 장벽을 낮추고, JWT 토큰 기반으로 세션을 안전하게 관리합니다.
2. **AI 기반 레시피 추천**
    - 사용자가 냉장고 속 재료를 입력하면 OpenAI API가 최적의 레시피를 분석하여 제안합니다.
3. **재료 및 이미지 관리**
    - 재료별 아이콘을 `Image` 테이블로 중앙 관리하며, 데이터 무결성을 보장합니다.
4. **Dev/Prod 환경 분리**
    - Docker Compose를 활용하여 개발(Development)과 배포(Production) 환경을 명확히 분리하고 일관성을 유지합니다.

## 🚀 Architecture & Deployment
* **Docker Compose**를 사용하여 FastAPI(Backend), Nginx(Reverse Proxy), MariaDB를 컨테이너화하여 관리합니다.
* **Nginx**를 통해 정적 파일을 서빙하고 리버스 프록시 역할을 수행합니다.
* (가능하다면 여기에 아키텍처 다이어그램 이미지를 넣으면 좋습니다)

## 🔧 Trouble Shooting (문제 해결 경험)
### 재료 이미지 로딩 누락 및 N+1 쿼리 문제 해결
* **Issue:** 프론트엔드 재료 페이지에서 이미지 URL이 반환되지 않아 엑박(이미지 로딩 실패)이 뜨는 현상 발생.
* **Analyze:** * 프론트엔드와 백엔드 코드를 교차 분석한 결과, 백엔드 API의 `Ingredient` 모델 조회 시 연관된 `Image` 테이블 정보가 즉시 로딩되지 않는 문제를 확인.
    * ORM 사용 시 흔히 발생하는 **N+1 쿼리 문제**와 관계 설정 미흡이 원인임을 파악.
* **Solution:** * SQLAlchemy의 **`joinedload`** 옵션을 적용하여 `Ingredient` 조회 시 `Image` 관계 데이터를 Eager Loading(즉시 로딩)하도록 쿼리 최적화.
    * `to_dict()` 메서드 직렬화 로직을 수정하여 이미지 경로가 올바르게 포함되도록 개선.
* **Result:** 이미지 로딩 오류를 100% 해결하고, 데이터베이스 쿼리 효율성을 높임.

