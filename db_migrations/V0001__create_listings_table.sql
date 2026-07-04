CREATE TABLE IF NOT EXISTS listings (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price INTEGER NOT NULL DEFAULT 0,
    category VARCHAR(100) NOT NULL DEFAULT 'Услуги',
    location VARCHAR(255),
    image_url TEXT,
    author_name VARCHAR(255) DEFAULT 'Аноним',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO listings (title, description, price, category, location, image_url, author_name) VALUES
('Велосипед шоссейный, отличное состояние', 'Лёгкая рама, новые покрышки, обслужен.', 18500, 'Транспорт', 'Москва, Хамовники', 'https://cdn.poehali.dev/projects/a4ca0aed-5427-488c-88f8-60e12a6d90ef/files/39a6cdfb-3244-448c-95b5-d54e43263631.jpg', 'Дмитрий Волков'),
('Уютная студия в аренду, всё включено', 'Тихий район, свежий ремонт, вся мебель.', 45000, 'Недвижимость', 'Санкт-Петербург', 'https://cdn.poehali.dev/projects/a4ca0aed-5427-488c-88f8-60e12a6d90ef/files/5bdc60f2-1931-4d00-b67a-a34827563390.jpg', 'Мария Кузнецова');