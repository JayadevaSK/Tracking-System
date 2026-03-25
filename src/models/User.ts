import bcrypt from 'bcrypt';
import { db } from '../utils/db';

/**
 * User role enumeration
 * Requirements: 10.3
 */
export enum UserRole {
  EMPLOYEE = 'employee',
  MANAGER = 'manager'
}

/**
 * User interface representing a system user
 * Requirements: 10.2, 10.3
 */
export interface User {
  id: string;
  username: string;
  passwordHash: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  managerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input data for creating a new user
 */
export interface CreateUserInput {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  managerId?: string;
}

/**
 * Input data for updating a user
 */
export interface UpdateUserInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  managerId?: string;
}

/**
 * Number of salt rounds for bcrypt password hashing
 */
const SALT_ROUNDS = 10;

/**
 * Hash a plain text password using bcrypt
 * Requirements: 10.2
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hashed password
 * Requirements: 10.2
 */
export async function comparePassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

/**
 * Create a new user with hashed password
 * Requirements: 10.2, 10.3
 */
export async function create(input: CreateUserInput): Promise<User> {
  const passwordHash = await hashPassword(input.password);

  const query = `
    INSERT INTO users (
      username,
      password_hash,
      email,
      first_name,
      last_name,
      role,
      manager_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING
      id,
      username,
      password_hash as "passwordHash",
      email,
      first_name as "firstName",
      last_name as "lastName",
      role,
      manager_id as "managerId",
      created_at as "createdAt",
      updated_at as "updatedAt"
  `;

  const values = [
    input.username,
    passwordHash,
    input.email,
    input.firstName,
    input.lastName,
    input.role,
    input.managerId || null,
  ];

  const result = await db.query<User>(query, values);
  return result.rows[0];
}

/**
 * Find a user by username
 * Requirements: 10.2
 */
export async function findByUsername(username: string): Promise<User | null> {
  const query = `
    SELECT
      id,
      username,
      password_hash as "passwordHash",
      email,
      first_name as "firstName",
      last_name as "lastName",
      role,
      manager_id as "managerId",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM users
    WHERE username = $1
  `;

  const result = await db.query<User>(query, [username]);
  return result.rows[0] || null;
}

/**
 * Find a user by ID
 * Requirements: 10.3
 */
export async function findById(id: string): Promise<User | null> {
  const query = `
    SELECT
      id,
      username,
      password_hash as "passwordHash",
      email,
      first_name as "firstName",
      last_name as "lastName",
      role,
      manager_id as "managerId",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM users
    WHERE id = $1
  `;

  const result = await db.query<User>(query, [id]);
  return result.rows[0] || null;
}

/**
 * Update a user's information
 * Requirements: 10.3
 */
export async function updateUser(
  id: string,
  updates: UpdateUserInput
): Promise<User | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (updates.email !== undefined) {
    fields.push(`email = $${paramCount++}`);
    values.push(updates.email);
  }

  if (updates.firstName !== undefined) {
    fields.push(`first_name = $${paramCount++}`);
    values.push(updates.firstName);
  }

  if (updates.lastName !== undefined) {
    fields.push(`last_name = $${paramCount++}`);
    values.push(updates.lastName);
  }

  if (updates.role !== undefined) {
    fields.push(`role = $${paramCount++}`);
    values.push(updates.role);
  }

  if (updates.managerId !== undefined) {
    fields.push(`manager_id = $${paramCount++}`);
    values.push(updates.managerId);
  }

  if (fields.length === 0) {
    // No updates provided, return current user
    return findById(id);
  }

  // Add updated_at timestamp
  fields.push(`updated_at = CURRENT_TIMESTAMP`);

  // Add user ID as the last parameter
  values.push(id);

  const query = `
    UPDATE users
    SET ${fields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING
      id,
      username,
      password_hash as "passwordHash",
      email,
      first_name as "firstName",
      last_name as "lastName",
      role,
      manager_id as "managerId",
      created_at as "createdAt",
      updated_at as "updatedAt"
  `;

  const result = await db.query<User>(query, values);
  return result.rows[0] || null;
}
