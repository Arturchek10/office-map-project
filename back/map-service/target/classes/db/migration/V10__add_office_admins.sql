CREATE TABLE IF NOT EXISTS office_admins (
    id         BIGSERIAL PRIMARY KEY,
    office_id  BIGINT      NOT NULL REFERENCES office(id) ON DELETE CASCADE,
    login      VARCHAR(255) NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT now(),
    UNIQUE (office_id, login)
);