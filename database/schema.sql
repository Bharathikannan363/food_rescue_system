
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(80) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(256) NOT NULL,
    role VARCHAR(20) NOT NULL,
    phone VARCHAR(20),
    is_approved BOOLEAN DEFAULT 0,
    approval_status VARCHAR(20) DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS donors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    organization_name VARCHAR(150),
    address VARCHAR(255),
    latitude FLOAT,
    longitude FLOAT,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ngos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    ngo_name VARCHAR(150) NOT NULL,
    registration_number VARCHAR(50) NOT NULL UNIQUE,
    address VARCHAR(255),
    latitude FLOAT,
    longitude FLOAT,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS volunteers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    vehicle_type VARCHAR(50),
    address VARCHAR(255),
    is_available BOOLEAN DEFAULT 1,
    latitude FLOAT,
    longitude FLOAT,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS donations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    donor_id INTEGER NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    food_type VARCHAR(50) NOT NULL,
    quantity VARCHAR(50) NOT NULL,
    image VARCHAR(255),
    pickup_address VARCHAR(255) NOT NULL,
    latitude FLOAT,
    longitude FLOAT,
    allowed_ngo_id INTEGER,
    status VARCHAR(30) DEFAULT 'APPROVED',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    cancelled_at DATETIME,
    FOREIGN KEY(donor_id) REFERENCES donors(id) ON DELETE CASCADE,
    FOREIGN KEY(allowed_ngo_id) REFERENCES ngos(id)
);

CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    donation_id INTEGER NOT NULL,
    ngo_id INTEGER NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING',
    quality_status VARCHAR(30) DEFAULT 'VERIFIED',
    quality_notes TEXT,
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    responded_at DATETIME,
    FOREIGN KEY(donation_id) REFERENCES donations(id) ON DELETE CASCADE,
    FOREIGN KEY(ngo_id) REFERENCES ngos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL,
    volunteer_id INTEGER NOT NULL,
    status VARCHAR(30) DEFAULT 'ASSIGNED',
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    accepted_at DATETIME,
    rejected_at DATETIME,
    FOREIGN KEY(request_id) REFERENCES requests(id) ON DELETE CASCADE,
    FOREIGN KEY(volunteer_id) REFERENCES volunteers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS deliveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER NOT NULL,
    pickup_time DATETIME,
    delivery_time DATETIME,
    pickup_latitude FLOAT,
    pickup_longitude FLOAT,
    delivery_latitude FLOAT,
    delivery_longitude FLOAT,
    proof_image VARCHAR(255),
    beneficiary_count INTEGER DEFAULT 0,
    beneficiary_notes TEXT,
    status VARCHAR(30) DEFAULT 'PICKED_UP',
    FOREIGN KEY(assignment_id) REFERENCES assignments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS volunteer_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    volunteer_id INTEGER NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(volunteer_id) REFERENCES volunteers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month VARCHAR(20) NOT NULL,
    year INTEGER NOT NULL,
    total_donations INTEGER DEFAULT 0,
    total_deliveries INTEGER DEFAULT 0,
    beneficiaries INTEGER DEFAULT 0,
    food_saved VARCHAR(50) DEFAULT '0 kg',
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id VARCHAR(100) NOT NULL UNIQUE,
    user_id INTEGER NOT NULL,
    amount FLOAT NOT NULL,
    purpose VARCHAR(150) DEFAULT 'Logistics Support Grant',
    status VARCHAR(30) DEFAULT 'SUCCESS',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    description TEXT NOT NULL,
    ip_address VARCHAR(45),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
);
