import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

type ErrorBody = {
  status?: number;
  message?: string | string[];
  subErrors?: unknown[];
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const body =
      exception instanceof HttpException ? exception.getResponse() : undefined;

    const errorBody = this.normalizeBody(body, exception, status);

    response.status(status).json({
      status,
      message: errorBody.message,
      timestamp: new Date().toISOString(),
      path: request.url,
      subErrors: errorBody.subErrors,
    });
  }

  private normalizeBody(
    body: string | object | undefined,
    exception: unknown,
    status: number,
  ): { message: string; subErrors: unknown[] } {
    if (typeof body === 'string') {
      return { message: body, subErrors: [] };
    }

    if (body && typeof body === 'object') {
      const typed = body as ErrorBody;
      const message = Array.isArray(typed.message)
        ? 'Validation failed'
        : typed.message;

      return {
        message: message ?? this.defaultMessage(status),
        subErrors: typed.subErrors ?? [],
      };
    }

    if (exception instanceof Error && status !== HttpStatus.INTERNAL_SERVER_ERROR) {
      return { message: exception.message, subErrors: [] };
    }

    return { message: this.defaultMessage(status), subErrors: [] };
  }

  private defaultMessage(status: number) {
    return status === HttpStatus.INTERNAL_SERVER_ERROR
      ? 'Internal Server Error'
      : 'Request failed';
  }
}
