/**
 * Global Error Handling
 * Standardizes API error responses and simplifies controllers
 */

import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;

    constructor(message: string, statusCode = 500, code = 'INTERNAL_SERVER_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404, 'NOT_FOUND');
    }
}

export class ValidationError extends AppError {
    public readonly details?: any;

    constructor(message = 'Validation failed', details?: any) {
        super(message, 400, 'VALIDATION_ERROR');
        this.details = details;
    }
}

export class AuthError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401, 'UNAUTHORIZED');
    }
}

export const globalErrorHandler = (
    error: FastifyError | AppError | Error,
    request: FastifyRequest,
    reply: FastifyReply
) => {
    // Log error (avoid logging sensitive data in production)
    if (error instanceof AppError && error.statusCode < 500) {
        request.log.warn({ err: error }, 'Operational error');
    } else {
        request.log.error({ err: error }, 'System error');
    }

    // Handle specific error types

    // 1. Custom App Errors
    if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
            error: error.code,
            message: error.message,
            details: (error as ValidationError).details,
        });
    }

    // 2. Zod Validation Errors (if not caught by custom validators)
    if (error instanceof ZodError) {
        return reply.status(400).send({
            error: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.issues,
        });
    }

    // 3. Fastify Errors (e.g. 404 from router)
    if ((error as FastifyError).statusCode) {
        const statusCode = (error as FastifyError).statusCode || 500;
        return reply.status(statusCode).send({
            error: (error as FastifyError).code || 'FASTIFY_ERROR',
            message: error.message,
        });
    }

    // 4. Default Internal Server Error
    return reply.status(500).send({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Something went wrong',
    });
};
