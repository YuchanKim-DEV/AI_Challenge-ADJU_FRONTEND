-- ADJU DB 스키마 (adjudb)
-- PostgreSQL 16 + pgvector (port 15432)
-- 임베딩: BGE-M3 (dense 1024 / sparse 250002)

-- =========================================================
-- 1) RDB: users
-- =========================================================
CREATE TABLE users (
    id              BIGSERIAL       PRIMARY KEY,                    -- 자동증가 PK
    name            VARCHAR(100)    NOT NULL,                       -- 이름
    birth_date      DATE            NOT NULL,                       -- 생년월일
    phone           CHAR(11)        NOT NULL UNIQUE,                -- 연락처 (11자리 숫자)
    email           VARCHAR(255),                                   -- 이메일
    monthly_income  NUMERIC(15, 2),                                 -- 월 소득
    annual_income   NUMERIC(15, 2),                                 -- 연 소득
    other_income    NUMERIC(15, 2),                                 -- 기타 소득
    create_time     TIMESTAMPTZ     NOT NULL DEFAULT now(),         -- 생성 시각
    update_time     TIMESTAMPTZ     NOT NULL DEFAULT now(),         -- 수정 시각

    CONSTRAINT chk_phone_format CHECK (phone ~ '^[0-9]{11}$')       -- 숫자 11자리만 허용
);

-- update_time 자동 갱신 함수 및 트리거
CREATE OR REPLACE FUNCTION set_update_time()
RETURNS TRIGGER AS $$
BEGIN
    NEW.update_time = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_update_time
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_update_time();

-- =========================================================
-- 2) Vector DB: file_embeddings
-- =========================================================
-- 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- 설치된 버전 확인 (0.7.0 이상이면 sparsevec 사용 가능)
SELECT extversion FROM pg_extension WHERE extname = 'vector';

CREATE TABLE file_embeddings (
    id                  BIGSERIAL       PRIMARY KEY,
    user_id             BIGINT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    file_id             UUID            NOT NULL DEFAULT gen_random_uuid(),
    file_name           VARCHAR(500)    NOT NULL,
    file_type           VARCHAR(50),
    page_no             INTEGER,
    chunk_no            INTEGER         DEFAULT 0,

    content             TEXT            NOT NULL,

    dense_embedding     VECTOR(1024)      NOT NULL,          -- BGE-M3 dense
    sparse_embedding    SPARSEVEC(250002) NOT NULL,          -- BGE-M3 sparse (lexical weight)

    metadata            JSONB           DEFAULT '{}'::jsonb,

    create_time         TIMESTAMPTZ     NOT NULL DEFAULT now(),
    update_time         TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_file_embeddings_update_time
BEFORE UPDATE ON file_embeddings
FOR EACH ROW
EXECUTE FUNCTION set_update_time();

-- 일반 조회 인덱스
CREATE INDEX idx_file_embeddings_user_id ON file_embeddings (user_id);
CREATE INDEX idx_file_embeddings_file_id ON file_embeddings (file_id);
CREATE INDEX idx_file_embeddings_metadata ON file_embeddings USING GIN (metadata);

-- Dense 벡터 검색 인덱스 (HNSW, cosine)
CREATE INDEX idx_file_embeddings_dense
ON file_embeddings USING hnsw (dense_embedding vector_cosine_ops);

-- Sparse 벡터 검색 인덱스 (HNSW, inner product)
CREATE INDEX idx_file_embeddings_sparse
ON file_embeddings USING hnsw (sparse_embedding sparsevec_ip_ops);
