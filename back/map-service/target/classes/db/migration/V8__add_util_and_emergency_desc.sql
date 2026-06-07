CREATE TABLE emergency_desc (
                                id BIGINT PRIMARY KEY REFERENCES description(id) ON DELETE CASCADE
);

CREATE TABLE utility_desc (
                              id BIGINT PRIMARY KEY REFERENCES description(id) ON DELETE CASCADE
);