CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    elo INT DEFAULT 1200,
    matches_played INT DEFAULT 0,
    wins INT DEFAULT 0,
    losses INT DEFAULT 0,
    avatar VARCHAR(255) DEFAULT 'avatar1.png',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS match_history (
    id SERIAL PRIMARY KEY,
    winner_id INT REFERENCES users(id) ON DELETE CASCADE,
    loser_id INT REFERENCES users(id) ON DELETE CASCADE,
    player1_id INT REFERENCES users(id) ON DELETE SET NULL,
    player2_id INT REFERENCES users(id) ON DELETE SET NULL,
    winner_elo_change INT NOT NULL DEFAULT 0,
    loser_elo_change INT NOT NULL DEFAULT 0,
    is_draw BOOLEAN DEFAULT FALSE,
    moves TEXT,
    mode VARCHAR(20) DEFAULT 'online',
    ended_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Migration/Update commands for existing databases
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(255) DEFAULT 'avatar1.png';

ALTER TABLE match_history ALTER COLUMN winner_id DROP NOT NULL;
ALTER TABLE match_history ALTER COLUMN loser_id DROP NOT NULL;
ALTER TABLE match_history ADD COLUMN IF NOT EXISTS player1_id INT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE match_history ADD COLUMN IF NOT EXISTS player2_id INT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE match_history ADD COLUMN IF NOT EXISTS is_draw BOOLEAN DEFAULT FALSE;
ALTER TABLE match_history ADD COLUMN IF NOT EXISTS moves TEXT;
