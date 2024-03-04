CREATE DATABASE finance;

-- Table to store user information
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL, -- Use a secure hash and salt for password storage
    email VARCHAR(100) UNIQUE NOT NULL,
    isHead BOOLEAN NOT NULL
);

-- Table to store family members
CREATE TABLE family_members (
    member_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    relationship VARCHAR(50) NOT NULL,
    member_name VARCHAR(100) NOT NULL
);

-- Table to store budgets
CREATE TABLE budgets (
    budget_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    budget_name VARCHAR(100) NOT NULL,
    budget_amount VARCHAR(100) NOT NULL,
    budget_remaining VARCHAR(100) NOT NULL,
    amount_salt VARCHAR(100) NOT NULL,
    amount_iv VARCHAR(100) NOT NULL,
    remaining_salt VARCHAR(100) NOT NULL,
    remaining_iv VARCHAR(100) NOT NULL
);

-- Table to store expenses
CREATE TABLE expenses (
    expense_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    budget_id INT REFERENCES budgets(budget_id),
    expense_name VARCHAR(100) NOT NULL,
    expense_amount VARCHAR(100) NOT NULL,
    expense_salt VARCHAR(100) NOT NULL,
    expense_iv VARCHAR(100) NOT NULL
);
