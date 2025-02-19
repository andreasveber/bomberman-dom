CREATE TABLE IF NOT EXISTS Messages (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    fromuser INTEGER NOT NULL,         -- Sender
    toUser INTEGER NOT NULL,           -- Recipient
    time_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fromuser) REFERENCES users(ID) ON DELETE CASCADE,
    FOREIGN KEY (toUser) REFERENCES users(ID) ON DELETE CASCADE
);