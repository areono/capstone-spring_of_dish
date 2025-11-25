# team-03
# 🥗 Spring of Dish (자취생을 위한 AI 레시피 추천 서비스)

> **OpenAI API를 활용하여 자취생들이 가진 냉장고 속 재료로 만들 수 있는 요리를 추천해주는 서비스입니다.**

## 📅 프로젝트 기간
- 202X.XX ~ 202X.XX (캡스톤 디자인)

## 🛠 Tech Stack (기술 스택)
**Backend**
- Python 3.x
- FastAPI
- WebSocket (실시간 통신)

**Infra & DevOps**
- Docker (Dev/Prod 환경 분리)
- GitLab (형상 관리)

**External API**
- OpenAI API (레시피 생성)
- Kakao OAuth2 (소셜 로그인)

## 💡 Key Features (핵심 기능)
1. **소셜 로그인:** Kakao OAuth2를 이용한 간편 로그인 구현
2. **재료 기반 레시피 추천:** 사용자가 보유한 재료를 입력하면 OpenAI가 최적의 레시피 제안
3. **실시간 데이터 처리:** WebSocket을 활용하여 끊김 없는 데이터 전송 및 이미지 로딩 처리

## 🚀 Architecture & Deployment
* 개발 서버와 배포 서버를 **Docker**로 컨테이너화하여 환경 일치성을 보장하고 배포 효율을 높였습니다.
* (가능하다면 여기에 아키텍처 다이어그램 이미지를 넣으면 좋습니다)

## 🔧 Trouble Shooting (문제 해결 경험)
### WebSocket 통신을 통한 이미지 로딩 지연 해결
* **Issue:** 재료 페이지에서 레시피 이미지를 불러오는 과정에서 로딩이 되지 않거나 지연되는 현상 발생. 백엔드 API 응답에는 문제가 없었음.
* **Analyze:** 프론트엔드 코드와 네트워크 패킷을 분석한 결과, HTTP 요청 방식보다 실시간 양방향 통신이 필요한 구간임을 확인하고 WebSocket 연결 상태 점검.
* **Solution:** 프론트엔드 팀원과 협업하여 WebSocket 이벤트 처리 로직을 수정하고, 비동기 처리를 통해 이미지 데이터 전송 흐름을 개선.
* **Result:** 이미지 로딩 오류를 100% 해결하고 안정적인 서비스 흐름 확보.

## 👨‍💻 My Role (담당 역할)
* **Backend Lead:** FastAPI 기반 서버 구축 및 API 설계
* **Infrastructure:** Dockerfile 작성 및 배포 환경 구성
* **Collaboration:** 프론트엔드 연동 이슈 지원 및 트러블 슈팅 주도
