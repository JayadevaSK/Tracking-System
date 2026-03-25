import {
  UserRole,
  CreateUserInput,
  UpdateUserInput,
  create,
  findByUsername,
  findById,
  updateUser,
  hashPassword,
  comparePassword,
} from './User';

// Mock the db module so tests don't need a real database
jest.mock('../utils/db', () => ({
  db: {
    initialize: jest.fn(),
    query: jest.fn(),
    close: jest.fn(),
  },
}));

import { db } from '../utils/db';
const mockDb = db as jest.Mocked<typeof db>;

const mockUser = {
  id: 'uuid-1234',
  username: 'test_employee1',
  passwordHash: '$2b$10$hashedpassword',
  email: 'test1@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: UserRole.EMPLOYEE,
  managerId: undefined,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Password Hashing', () => {
  it('should hash a password', async () => {
    const password = 'testPassword123';
    const hash = await hashPassword(password);
    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(0);
  });

  it('should compare password correctly', async () => {
    const password = 'testPassword123';
    const hash = await hashPassword(password);
    expect(await comparePassword(password, hash)).toBe(true);
    expect(await comparePassword('wrongPassword', hash)).toBe(false);
  });
});

describe('create', () => {
  it('should create a new user with hashed password', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 } as any);

    const input: CreateUserInput = {
      username: 'test_employee1',
      password: 'password123',
      email: 'test1@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.EMPLOYEE,
    };

    const user = await create(input);

    expect(user).toBeDefined();
    expect(user.username).toBe(input.username);
    expect(user.email).toBe(input.email);
    expect(user.role).toBe(UserRole.EMPLOYEE);
    expect(mockDb.query).toHaveBeenCalledTimes(1);
  });

  it('should create a user with a manager', async () => {
    const managerUser = { ...mockUser, id: 'manager-uuid', role: UserRole.MANAGER };
    const employeeUser = { ...mockUser, managerId: 'manager-uuid' };
    mockDb.query
      .mockResolvedValueOnce({ rows: [managerUser], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [employeeUser], rowCount: 1 } as any);

    const manager = await create({ username: 'mgr', password: 'p', email: 'm@e.com', firstName: 'M', lastName: 'G', role: UserRole.MANAGER });
    const employee = await create({ username: 'emp', password: 'p', email: 'e@e.com', firstName: 'E', lastName: 'M', role: UserRole.EMPLOYEE, managerId: manager.id });

    expect(employee.managerId).toBe('manager-uuid');
  });
});

describe('findByUsername', () => {
  it('should find a user by username', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 } as any);
    const found = await findByUsername('test_employee1');
    expect(found).toBeDefined();
    expect(found?.username).toBe('test_employee1');
  });

  it('should return null for non-existent username', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    const found = await findByUsername('nonexistent_user');
    expect(found).toBeNull();
  });
});

describe('findById', () => {
  it('should find a user by ID', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 } as any);
    const found = await findById('uuid-1234');
    expect(found).toBeDefined();
    expect(found?.id).toBe('uuid-1234');
  });

  it('should return null for non-existent ID', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    const found = await findById('00000000-0000-0000-0000-000000000000');
    expect(found).toBeNull();
  });
});

describe('updateUser', () => {
  it('should update user email', async () => {
    const updated = { ...mockUser, email: 'newemail@example.com' };
    mockDb.query.mockResolvedValueOnce({ rows: [updated], rowCount: 1 } as any);

    const updates: UpdateUserInput = { email: 'newemail@example.com' };
    const result = await updateUser('uuid-1234', updates);

    expect(result?.email).toBe('newemail@example.com');
  });

  it('should update multiple fields', async () => {
    const updated = { ...mockUser, firstName: 'Emily', lastName: 'Davidson', role: UserRole.MANAGER };
    mockDb.query.mockResolvedValueOnce({ rows: [updated], rowCount: 1 } as any);

    const updates: UpdateUserInput = { firstName: 'Emily', lastName: 'Davidson', role: UserRole.MANAGER };
    const result = await updateUser('uuid-1234', updates);

    expect(result?.firstName).toBe('Emily');
    expect(result?.role).toBe(UserRole.MANAGER);
  });

  it('should return null for non-existent user', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    const result = await updateUser('00000000-0000-0000-0000-000000000000', { email: 'x@x.com' });
    expect(result).toBeNull();
  });

  it('should return current user when no updates provided', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 } as any);
    const result = await updateUser('uuid-1234', {});
    expect(result).toBeDefined();
    expect(result?.id).toBe('uuid-1234');
  });
});
