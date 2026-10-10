CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    email         TEXT UNIQUE NOT NULL,
    password      TEXT NOT NULL,
    created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE videos (
    id            SERIAL PRIMARY KEY,
    title         TEXT NOT NULL,
    object_key    TEXT NOT NULL UNIQUE,
    status        TEXT DEFAULT 'pending',
    revisit       BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMP DEFAULT NOW()
);

INSERT INTO videos (title, object_key) VALUES
    ('Introduction to Low Level Design', 'videos/lecture1.mp4'),
    ('Software Design Principles', 'videos/lecture2.mp4'),
    ('Single Responsibility Principle(SRP)', 'videos/lecture3.mp4'),
    ('Open Closed Principle(OCP)', 'videos/lecture4.mp4'),
    ('Liskov Substitution Principle(LSP)', 'videos/lecture5.mp4'),
    ('Interface Segregation Principle(ISP)', 'videos/lecture6.mp4'),
    ('Dependency Inversion Principle(DIP)', 'videos/lecture7.mp4');

SELECT * FROM videos;
