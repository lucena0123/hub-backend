import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../services/auth-service';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Mock dependencies
const prismaMock = {
    user: {
        findUnique: vi.fn(),
        create: vi.fn(),
    },
} as unknown as PrismaClient;

describe('AuthService', () => {
    let authService: AuthService;

    beforeEach(() => {
        vi.clearAllMocks();
        authService = new AuthService(prismaMock);
    });

    describe('login', () => {
        it('should throw error if user not found', async () => {
            vi.spyOn(prismaMock.user, 'findUnique').mockResolvedValue(null);

            await expect(authService.login({ email: 'test@example.com', password: 'password' }))
                .rejects.toThrow('Invalid credentials');
        });

        it('should throw error if password invalid', async () => {
            vi.spyOn(prismaMock.user, 'findUnique').mockResolvedValue({
                id: '1',
                email: 'test@example.com',
                password: 'hashedpassword',
                name: 'Test',
                role: 'user',
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any);

            // Mock bcrypt
            vi.spyOn(bcrypt, 'compare').mockImplementation(async () => false);

            await expect(authService.login({ email: 'test@example.com', password: 'wrong' }))
                .rejects.toThrow('Invalid credentials');
        });

        it('should return user without password on success', async () => {
            const mockUser = {
                id: '1',
                email: 'test@example.com',
                passwordHash: 'hashedpassword',
                name: 'Test',
                role: 'viewer',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            vi.spyOn(prismaMock.user, 'findUnique').mockResolvedValue(mockUser as any);
            vi.spyOn(bcrypt, 'compare').mockImplementation(async () => true);

            const result = await authService.login({ email: 'test@example.com', password: 'password' });

            expect(result).toHaveProperty('id', '1');
            expect(result).not.toHaveProperty('password');
            expect((result as any).role).toBe('viewer');
        });
    });

    describe('register', () => {
        it('should throw if email exists', async () => {
            vi.spyOn(prismaMock.user, 'findUnique').mockResolvedValue({ id: '1' } as any);

            await expect(authService.register({
                email: 'test@example.com',
                password: 'password',
                name: 'Test',
            })).rejects.toThrow('Email already registered');
        });

        it('should create user', async () => {
            vi.spyOn(prismaMock.user, 'findUnique').mockResolvedValue(null);
            vi.spyOn(bcrypt, 'hash').mockImplementation(async () => 'hashed');

            const newUser = {
                id: '1',
                email: 'test@example.com',
                password: 'hashed',
                name: 'Test',
                role: 'viewer',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            vi.spyOn(prismaMock.user, 'create').mockResolvedValue(newUser as any);

            const result = await authService.register({
                email: 'test@example.com',
                password: 'password',
                name: 'Test',
            });

            expect(result).toEqual(expect.objectContaining({
                id: '1',
                email: 'test@example.com'
            }));
            expect(prismaMock.user.create).toHaveBeenCalled();
        });
    });
});
