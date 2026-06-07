CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL
);

CREATE TABLE office (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    address VARCHAR(255) UNIQUE
);

CREATE TABLE floors (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    order_number INT NOT NULL,
    office_id BIGINT NOT NULL REFERENCES office(id) ON DELETE CASCADE
);

CREATE TABLE layers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    base BOOLEAN NOT NULL,
    floor_id BIGINT NOT NULL REFERENCES floors(id) ON DELETE CASCADE
);


CREATE TABLE description (
    id BIGSERIAL PRIMARY KEY
);


CREATE TABLE room_desc (
    id BIGINT PRIMARY KEY REFERENCES description(id) ON DELETE CASCADE,
    capacity INT
);


CREATE TABLE workspace_desc (
    id BIGINT PRIMARY KEY REFERENCES description(id) ON DELETE CASCADE,
    have_computer BOOLEAN
);


CREATE TABLE markers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    type VARCHAR(50),
    layer_id BIGINT REFERENCES layers(id) ON DELETE CASCADE,
    position_x DOUBLE PRECISION,
    position_y DOUBLE PRECISION,
    description_id BIGINT UNIQUE REFERENCES description(id) ON DELETE CASCADE
);
