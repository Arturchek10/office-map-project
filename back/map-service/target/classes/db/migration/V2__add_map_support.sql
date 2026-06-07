ALTER TABLE office
    ADD COLUMN city varchar(255),
    ADD COLUMN latitude double precision,
    ADD COLUMN longitude double precision,
    ADD COLUMN photo_url varchar(1024);