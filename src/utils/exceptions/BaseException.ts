import { HttpException } from '@nestjs/common';

/**
 * To be used as base of custom exceptions
 */
export class BaseException extends HttpException {
  constructor(...args: ConstructorParameters<typeof HttpException>) {
    super(...args);
  }
}
