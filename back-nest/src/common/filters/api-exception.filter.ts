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
  error?: string;
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
      if (Array.isArray(typed.message)) {
        return {
          message: 'Validation failed',
          subErrors:
            typed.subErrors ??
            typed.message.map((message) => ({
              object: 'Request',
              message,
            })),
        };
      }

      const multipartError = this.normalizeMultipartError(typed.message);
      if (multipartError) {
        return multipartError;
      }

      return {
        message: typed.message ?? typed.error ?? this.defaultMessage(status),
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

  private normalizeMultipartError(
    message?: string,
  ): { message: string; subErrors: unknown[] } | null {
    if (!message?.startsWith('Unexpected field')) {
      return null;
    }

    const [, field] = message.match(/Unexpected field\s*-\s*(.+)$/) ?? [];
    return {
      message: field
        ? `Unexpected multipart field "${field}"`
        : 'Unexpected multipart field',
      subErrors: [
        {
          object: 'MultipartForm',
          field: field ?? null,
          message: 'Only documented multipart fields are allowed',
        },
      ],
    };
  }
}
