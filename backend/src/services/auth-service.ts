import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { LoginInput, RegisterInput } from '../validators/auth';

export class AuthService {
    constructor(private prisma: PrismaClient) { }

    async register(data: RegisterInput) {
        const existing = await this.prisma.user.findUnique({
            where: { email: data.email.toLowerCase() },
        });

        if (existing) {
            throw new Error('Email already registered');
        }

        const passwordHash = await bcrypt.hash(data.password, 10);

        const newUser = await this.prisma.user.create({
            data: {
                id: uuidv4(),
                name: data.name,
                email: data.email.toLowerCase(),
                passwordHash,
                role: 'viewer',
            },
        });

        const { passwordHash: _, ...userWithoutPassword } = newUser;
        return userWithoutPassword;
    }

    async login(data: LoginInput) {
        const user = await this.prisma.user.findUnique({
            where: { email: data.email.toLowerCase() },
        });

        if (!user) {
            throw new Error('Invalid credentials');
        }

        const validPassword = await bcrypt.compare(data.password, user.passwordHash);

        if (!validPassword) {
            throw new Error('Invalid credentials');
        }

        const { passwordHash: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async getUserById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            return null;
        }

        const { passwordHash: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async updateProfile(id: string, data: { name: string }) {
        const user = await this.prisma.user.update({
            where: { id },
            data: { name: data.name.trim() },
        });
        const { passwordHash: _, ...safe } = user;
        return safe;
    }

    async changePassword(id: string, oldPassword: string, newPassword: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new Error('User not found');

        const valid = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!valid) throw new Error('Invalid current password');

        const passwordHash = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({ where: { id }, data: { passwordHash } });
    }
}
