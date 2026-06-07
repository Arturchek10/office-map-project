ALTER TABLE furniture
    RENAME COLUMN image TO photo_key;

ALTER TABLE floors
    RENAME COLUMN plan_image_url TO photo_key;
