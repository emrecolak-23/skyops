import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';
import { SeedService } from './seed.service';

async function run(): Promise<void> {
  const app = await NestFactory.createApplicationContext(SeedModule);
  try {
    await app.get(SeedService).run();
  } finally {
    await app.close();
  }
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
