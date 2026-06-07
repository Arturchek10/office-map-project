
CREATE TABLE furniture (
    id           BIGSERIAL PRIMARY KEY,
    name         VARCHAR(255)   NOT NULL,
    image        VARCHAR(1024)  NOT NULL,
    angle        INTEGER        NOT NULL DEFAULT 0,
    position_x   DOUBLE PRECISION NULL,
    position_y   DOUBLE PRECISION NULL,
    size_factor  SMALLINT       NOT NULL DEFAULT 1,
    floor_id     BIGINT         NULL,

    CONSTRAINT fk_furniture_floor
        FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE SET NULL,

    CONSTRAINT chk_furniture_angle
        CHECK (angle >= 0 AND angle <= 359),

    CONSTRAINT chk_furniture_size_factor
        CHECK (size_factor > 0)
);
