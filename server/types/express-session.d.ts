import 'express-session';

declare module 'express-session' {
  interface SessionData {
    initialized?: boolean;
    userId?: string | null;
    user?: {
      id: string;
      username: string;
      role: string;
    };
  }
}
