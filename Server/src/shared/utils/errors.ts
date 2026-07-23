export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class ReadOnlyError extends AppError {
  errorCode = 'SHOP_READ_ONLY';
  constructor(message: string = 'Your subscription has expired. This shop is currently in Read-Only Mode. Renew your subscription to continue.') {
    super(message, 403);
  }
}

export class NotImplementedError extends Error {
  constructor(message: string = "Method not implemented") {
    super(message);
    this.name = "NotImplementedError";
  }
}

