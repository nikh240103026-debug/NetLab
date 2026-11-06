import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import type { StoredUser } from './types';

export class DuplicateEmailError extends Error {
  constructor() {
    super('Email already registered');
    this.name = 'DuplicateEmailError';
  }
}

export interface UserStore {
  findByEmail(email: string): Promise<StoredUser | null>;
  findById(id: string): Promise<StoredUser | null>;
  createUser(input: { name: string; email: string; passwordHash: string }): Promise<StoredUser>;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function writeAll(users: StoredUser[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const temp = `${USERS_FILE}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(temp, JSON.stringify(users, null, 2), 'utf8');
  await fs.rename(temp, USERS_FILE);
}

async function readAll(): Promise<StoredUser[]> {
  try {
    const raw = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(raw) as StoredUser[];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      await writeAll([]);
      return [];
    }
    throw err;
  }
}

let lock: Promise<unknown> = Promise.resolve();

function withLock<T>(job: () => Promise<T>): Promise<T> {
  const run = lock.then(job, job);
  lock = run.catch(() => undefined);
  return run;
}

const jsonUserStore: UserStore = {
  async findByEmail(email) {
    const target = normalizeEmail(email);
    const users = await readAll();
    return users.find((u) => u.email === target) ?? null;
  },
  async findById(id) {
    const users = await readAll();
    return users.find((u) => u.id === id) ?? null;
  },
  createUser({ name, email, passwordHash }) {
    return withLock(async () => {
      const target = normalizeEmail(email);
      const users = await readAll();
      if (users.some((u) => u.email === target)) throw new DuplicateEmailError();
      const user: StoredUser = {
        id: randomUUID(),
        name: name.trim(),
        email: target,
        passwordHash,
        createdAt: new Date().toISOString(),
      };
      await writeAll([...users, user]);
      return user;
    });
  },
};

export const userStore: UserStore = jsonUserStore;
