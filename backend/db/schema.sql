CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    name      TEXT NOT NULL,
    email         TEXT UNIQUE NOT NULL,
    password      TEXT NOT NULL,
    created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE videos (
    id            SERIAL PRIMARY KEY,
    course_id     INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    title         TEXT NOT NULL,
    object_key    TEXT NOT NULL UNIQUE,
    created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE courses (
    id           SERIAL PRIMARY KEY,
    title        TEXT NOT NULL,
    description  TEXT,
    price        INTEGER NOT NULL,       
    currency     TEXT NOT NULL DEFAULT 'INR',
    totalvideos  INTEGER NOT NULL DEFAULT 20,
    instructor   INTEGER NOT NULL DEFAULT 'Unknown',
    thumbnail    TEXT DEFAULT 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=800&auto=format&fit=crop',
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_video_progress (
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id   INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    revisit    BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, video_id)
);

CREATE TABLE payments (
    id                  SERIAL PRIMARY KEY,
    user_id             INTEGER NOT NULL REFERENCES users(id),
    course_id           INTEGER NOT NULL REFERENCES courses(id),
    gateway_order_id    TEXT UNIQUE NOT NULL,
    gateway_payment_id  TEXT UNIQUE,         
    amount              INTEGER NOT NULL,    
    currency            TEXT NOT NULL,
    status              TEXT NOT NULL DEFAULT 'created'
                        CHECK (status IN ('created', 'paid', 'failed')),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE enrollments (
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id   INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    payment_id  INTEGER REFERENCES payments(id),   
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, course_id)             
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
