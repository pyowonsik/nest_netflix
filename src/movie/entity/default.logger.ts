import { ConsoleLogger, Injectable } from '@nestjs/common';
import { Console } from 'console';

@Injectable()
export class DefaultLogger extends ConsoleLogger {
  warn(message: unknown, ...rest: unknown[]): void {
    console.log('---- WARN ----');
    super.warn(message, ...rest);

    console.log('---- LOG ----');
    super.log(message, ...rest);
  }
}
