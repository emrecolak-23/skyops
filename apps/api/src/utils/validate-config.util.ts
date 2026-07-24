import { plainToInstance, ClassConstructor } from 'class-transformer';
import { validateSync, ValidationError } from 'class-validator';

export function validateConfig<T extends object>(
  config: Record<string, unknown>,
  cls: ClassConstructor<T>,
): T {
  const validated = plainToInstance(cls, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(formatErrors(errors));
  }

  return validated;
}

function formatErrors(errors: ValidationError[]): string {
  return errors
    .map(
      (e) => `${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`,
    )
    .join('\n');
}
