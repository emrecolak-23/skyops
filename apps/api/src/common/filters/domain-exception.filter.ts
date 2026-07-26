import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainError, DomainErrorKind } from 'src/common/errors/domain-error';

const KIND_TO_STATUS: Record<DomainErrorKind, number> = {
  [DomainErrorKind.NotFound]: HttpStatus.NOT_FOUND,
  [DomainErrorKind.Conflict]: HttpStatus.CONFLICT,
  [DomainErrorKind.Validation]: HttpStatus.BAD_REQUEST,
};

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message } = this.resolve(exception);

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception);
    }

    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private resolve(exception: unknown): { status: HttpStatus; message: string } {
    if (exception instanceof DomainError) {
      return {
        status: KIND_TO_STATUS[exception.kind],
        message: exception.message,
      };
    }

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      const message =
        typeof res === 'string'
          ? res
          : ((res as { message?: string | string[] }).message ??
            exception.message);
      return {
        status: exception.getStatus(),
        message: Array.isArray(message) ? message.join(', ') : message,
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }
}
