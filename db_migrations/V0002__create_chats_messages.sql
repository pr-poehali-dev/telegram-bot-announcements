CREATE TABLE IF NOT EXISTS chats (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER REFERENCES listings(id),
    buyer_name VARCHAR(255) NOT NULL DEFAULT 'Вы',
    seller_name VARCHAR(255) NOT NULL DEFAULT 'Продавец',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(listing_id, buyer_name)
);

CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES chats(id),
    sender VARCHAR(20) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);