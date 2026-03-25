import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'employee_work_tracker',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function seed() {
  const client = await pool.connect();
  try {
    const passwordHash = await bcrypt.hash('password123', 10);

    // Create manager
    const managerResult = await client.query(`
      INSERT INTO users (id, username, email, first_name, last_name, password_hash, role)
      VALUES (gen_random_uuid(), 'manager1', 'manager@example.com', 'John', 'Manager', $1, 'manager')
      ON CONFLICT (username) DO UPDATE SET password_hash = $1
      RETURNING id
    `, [passwordHash]);

    const managerId = managerResult.rows[0].id;

    // Create employee linked to manager
    await client.query(`
      INSERT INTO users (id, username, email, first_name, last_name, password_hash, role, manager_id)
      VALUES (gen_random_uuid(), 'employee1', 'employee@example.com', 'Jane', 'Employee', $1, 'employee', $2)
      ON CONFLICT (username) DO UPDATE SET password_hash = $1, manager_id = $2
    `, [passwordHash, managerId]);

    console.log('✅ Users created successfully!');
    console.log('');
    console.log('  Manager  → username: manager1  | password: password123');
    console.log('  Employee → username: employee1 | password: password123');
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message || err);
  console.error('Full error:', err);
  process.exit(1);
});
