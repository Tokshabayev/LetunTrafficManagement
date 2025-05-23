CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    code VARCHAR(64) UNIQUE NOT NULL,
    password_required BOOLEAN NOT NULL
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(64),
    email VARCHAR(64),
    password_hash VARCHAR(64),
    phone_number VARCHAR(16) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    role_id INT NOT NULL,
    is_active BOOLEAN NOT NULL,
    CONSTRAINT fk_role FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE logins (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    access_token_hash VARCHAR(64) UNIQUE NOT NULL,
    refresh_token_hash VARCHAR(64) UNIQUE NOT NULL,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE otp_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(64) NOT NULL,
    last_send_try_at TIMESTAMP WITH TIME ZONE NOT NULL,
    phone_number VARCHAR(64) NOT NULL UNIQUE,
    email VARCHAR(64),
    send_otp_tries_counted INT NOT NULL,
    login_otp_tries_counted INT NOT NULL,
    password_login_token_hash VARCHAR(64),
    password_verify_tries_counted INT NOT NULL,
    is_processed BOOLEAN NOT NULL
);

CREATE TABLE invites (
    id SERIAL PRIMARY KEY,
    email VARCHAR(64) NOT NULL UNIQUE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    role_id INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expiration_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN NOT NULL,
    otp_code_id INT,
    CONSTRAINT fk_role FOREIGN KEY (role_id) REFERENCES roles(id),
    CONSTRAINT fk_otp_code FOREIGN KEY (otp_code_id) REFERENCES otp_codes(id)
);

