// The root .env is shared with Express and may set NODE_ENV=development.
// Set it before Vite loads the environment so production builds stay optimized.
process.env.NODE_ENV = 'production';
const { build } = await import('vite');
await build();
