FROM python:3.13-slim

# 2. 작업 디렉토리 설정
WORKDIR /app

# 3. 필요 파일 복사
COPY ./requirements.txt /app/requirements.txt
COPY .env /app.env
# 4. 필요한 패키지 설치
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# 5. 앱 소스 복사
COPY . /app

# 6. Uvicorn으로 FastAPI 서버 실행
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
