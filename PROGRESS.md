# asquad.ai — 개발 진행 현황

AI Agent Marketplace MVP. 에이전트 제공자(Provider)와 소비자(Consumer)를 연결하는 플랫폼.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 백엔드 | FastAPI, SQLAlchemy (async), Alembic, asyncpg |
| 프론트엔드 | Next.js 15 (App Router), TypeScript |
| 데이터베이스 | PostgreSQL (Supabase), pgvector |
| 백엔드 호스팅 | Railway |
| 프론트엔드 호스팅 | Vercel (예정) |
| 도메인 | asquad.ai (연결 예정) |

---

## 완료된 작업

### Sprint 1 — 코어 기능
- Provider/Consumer 인증 (JWT)
- Agent 등록 및 마켓플레이스 조회
- A2A 프로토콜 게이트웨이 (`/api/v1/agents/{id}/a2a`)
- Call events 기록 (metering)

### Sprint 2 — Rate Limiting
- `consumers` 테이블에 `rate_limit_rpm` 컬럼 추가 (Migration 002)
- Redis 없이 `call_events` 테이블로 슬라이딩 윈도우 구현 (60 RPM 기본값)
- 초과 시 HTTP 429 + `Retry-After: 60` 헤더 반환
- Consumer 대시보드에 Rate Limit 상태 카드 + 컬러 progress bar 추가

### Sprint 3 — 검색
- OpenAI embedding 대신 PostgreSQL 전문 검색 (`to_tsvector` / `plainto_tsquery`) 구현
- 짧은 쿼리 fallback: ILIKE
- TODO: OpenAI text-embedding-3-small으로 업그레이드 (API 키 확보 후)

### Sprint 4 — 실제 데이터 연결 & 시드
- Provider 대시보드: mock 데이터 → 실제 API 연결 (`/api/v1/providers/me`, `/api/v1/providers/my-agents`)
- Consumer 대시보드: mock 차트 → 실제 7일 데이터, Rate Limit 실시간 표시
- Agent 통계: 7일 차트, 최근 10건 호출 내역
- 데모 시드 데이터 10개 에이전트 (`backend/scripts/seed_agents.py`)

---

## 배포 현황

### 백엔드 (Railway) ✅ 완료
- **URL**: `https://asquad-production.up.railway.app`
- **서비스**: Railway (europe-west4)
- **DB**: Supabase PostgreSQL (Session Pooler, us-east-2)

#### Railway 환경변수
```
DATABASE_URL=postgresql+asyncpg://postgres.blasgwqnxigbsgmpzywg:[PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres?ssl=require
SECRET_KEY=asquad_jwt_secret_2026_xK9mP3qR
CORS_ORIGINS=["https://asquad.ai","https://www.asquad.ai"]
PYTHONUNBUFFERED=1
```

#### 배포 중 해결한 주요 이슈
| 에러 | 원인 | 해결 |
|------|------|------|
| `Network is unreachable` | Supabase 직접 연결은 IPv6 전용 | Session Pooler URL 사용 |
| `Tenant or user not found` | Pooler 지역이 `us-east-1` 아닌 `us-east-2` | Supabase Connect에서 정확한 URL 복사 |
| `$PORT is not a valid integer` | `startCommand`에서 쉘 변수 미확장 | `sh -c '...'`로 감싸기 |
| Healthcheck failure (silent) | `prepared_statement_cache_size` 잘못된 asyncpg 파라미터 | 제거하고 `statement_cache_size=0`만 유지 |

#### `backend/railway.toml`
```toml
[build]
builder = "dockerfile"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "sh -c 'alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT'"
healthcheckPath = "/health"
healthcheckTimeout = 120
restartPolicyType = "on_failure"
```

### 프론트엔드 (Vercel) ⏳ 예정
- Root Directory: `frontend`
- 환경변수: `NEXT_PUBLIC_API_URL=https://asquad-production.up.railway.app`

### 도메인 (asquad.ai) ⏳ 예정
- 프론트엔드: `asquad.ai` → Vercel
- 백엔드 API: `api.asquad.ai` → Railway Custom Domain

---

## 다음 작업

- [ ] 프론트엔드 Vercel 배포
- [ ] asquad.ai 도메인 연결
- [ ] 데모 에이전트 시드 실행 (`python scripts/seed_agents.py`)
- [ ] OpenAI embedding 업그레이드 (API 키 확보 후)
