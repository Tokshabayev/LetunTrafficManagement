CREATE TABLE drones (
    id SERIAL PRIMARY KEY,
    model VARCHAR(255) NOT NULL,
    weight_limit VARCHAR(255) NOT NULL,
    battery VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL,
    is_flying BOOLEAN NOT NULL
);

CREATE TABLE flights (
    id SERIAL PRIMARY KEY,
    drone_id INT NOT NULL,
    user_id INT NOT NULL,
    status VARCHAR(255) NOT NULL,
    points VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_drone FOREIGN KEY (drone_id) REFERENCES drones(id),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE telemetry (
    id SERIAL PRIMARY KEY,
    flight_id INT NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    altitude FLOAT NOT NULL,
    speed FLOAT NOT NULL,
    timestamp FLOAT NOT NULL,
    CONSTRAINT fk_flight FOREIGN KEY (flight_id) REFERENCES flights(id)
);