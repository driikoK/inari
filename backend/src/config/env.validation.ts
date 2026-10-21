// class-transformer reads decorator metadata, so this module must not rely on Nest loading it
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  JWT_SECRET_KEY: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  MONGO_PORT?: number;

  @IsOptional()
  @IsString()
  MONGO_HOST?: string;

  @IsOptional()
  @IsString()
  MONGO_DATABASE?: string;

  @IsOptional()
  @IsString()
  MONGO_USERNAME?: string;

  @IsOptional()
  @IsString()
  MONGO_PASSWORD?: string;

  @IsOptional()
  @IsString()
  CORS?: string;
}

// Fails fast at startup instead of at the first request that needs a setting.
export function validate(config: Record<string, unknown>) {
  // `KEY=` in a .env file yields an empty string, which counts as "not set"
  const present = Object.fromEntries(
    Object.entries(config).filter(([, value]) => value !== ''),
  );
  const env = plainToInstance(EnvironmentVariables, present, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(env);

  if (errors.length > 0) {
    const problems = errors.flatMap((error) =>
      Object.values(error.constraints ?? {}),
    );
    throw new Error(
      `Invalid environment variables:\n${problems.map((problem) => `  - ${problem}`).join('\n')}`,
    );
  }

  return config;
}
