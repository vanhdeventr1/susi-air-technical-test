import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const responseBody: Record<string, unknown> | undefined =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? (exceptionResponse as Record<string, unknown>)
        : undefined;
    const responseMessage =
      responseBody?.message ??
      (typeof exceptionResponse === 'string' ? exceptionResponse : undefined);
    const message =
      typeof responseMessage === 'string' ||
      (Array.isArray(responseMessage) &&
        responseMessage.every(
          (entry: unknown): entry is string => typeof entry === 'string',
        ))
        ? responseMessage
        : exception instanceof Error
          ? exception.message
          : 'Internal server error';

    response.status(statusCode).json({
      statusCode,
      error:
        typeof responseBody?.error === 'string'
          ? responseBody.error
          : exception instanceof HttpException
            ? exception.name
            : HttpStatus[HttpStatus.INTERNAL_SERVER_ERROR],
      message,
      path: request.url,
    });
  }
}
