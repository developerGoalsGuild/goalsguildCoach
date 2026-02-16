// Jest setup file
global.console = {
  ...console,
  // Suppress console.log during tests unless DEBUG=true
  log: jest.fn(),
  debug: process.env.DEBUG === 'true' ? console.debug : jest.fn(),
  info: jest.fn(),
  warn: console.warn,
  error: console.error,
};

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-key';
process.env.OPENAI_API_KEY = 'test-openai-key';

// Mock Next.js
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  useParams: () => ({}),
  useSearchParams: () => ({}),
}));
