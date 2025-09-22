// Structured logging service for production-ready monitoring
// Provides JSON logging with different levels and context information

export interface LogContext {
  userId?: number;
  username?: string;
  action?: string;
  resource?: string;
  resourceId?: string | number;
  ip?: string;
  userAgent?: string;
  sessionId?: string;
  duration?: number;
  error?: Error | string;
  metadata?: Record<string, any>;
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface StructuredLog {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  environment: string;
  service: string;
}

export class Logger {
  private serviceName: string;
  private environment: string;

  constructor(serviceName = 'georeferencing-api') {
    this.serviceName = serviceName;
    this.environment = process.env.NODE_ENV || 'development';
  }

  private formatLog(level: LogLevel, message: string, context: LogContext = {}): StructuredLog {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...context,
        // Add stack trace for errors
        ...(context.error && context.error instanceof Error ? {
          error: {
            name: context.error.name,
            message: context.error.message,
            stack: context.error.stack,
          }
        } : context.error ? { error: context.error } : {}),
      },
      environment: this.environment,
      service: this.serviceName,
    };
  }

  private output(log: StructuredLog) {
    const logString = JSON.stringify(log);
    
    // In production, you might want to send logs to external service
    // For now, output to console with proper formatting
    if (this.environment === 'production') {
      console.log(logString);
    } else {
      // Pretty print for development
      const color = this.getColorForLevel(log.level);
      console.log(`${color}[${log.level.toUpperCase()}]${this.resetColor()} ${log.message}`);
      if (Object.keys(log.context).length > 0) {
        console.log('  Context:', JSON.stringify(log.context, null, 2));
      }
    }
  }

  private getColorForLevel(level: LogLevel): string {
    const colors = {
      [LogLevel.DEBUG]: '\x1b[37m', // White
      [LogLevel.INFO]: '\x1b[36m',  // Cyan
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
    };
    return colors[level] || '';
  }

  private resetColor(): string {
    return '\x1b[0m';
  }

  // Public logging methods
  debug(message: string, context?: LogContext) {
    this.output(this.formatLog(LogLevel.DEBUG, message, context));
  }

  info(message: string, context?: LogContext) {
    this.output(this.formatLog(LogLevel.INFO, message, context));
  }

  warn(message: string, context?: LogContext) {
    this.output(this.formatLog(LogLevel.WARN, message, context));
  }

  error(message: string, context?: LogContext) {
    this.output(this.formatLog(LogLevel.ERROR, message, context));
  }

  // Specialized logging methods for common use cases
  auth(message: string, context: LogContext) {
    this.info(`[AUTH] ${message}`, { ...context, action: 'authentication' });
  }

  api(message: string, context: LogContext) {
    this.info(`[API] ${message}`, { ...context, action: 'api_request' });
  }

  audit(message: string, context: LogContext) {
    this.info(`[AUDIT] ${message}`, { ...context, action: 'audit' });
  }

  security(message: string, context: LogContext) {
    this.warn(`[SECURITY] ${message}`, { ...context, action: 'security_event' });
  }

  performance(message: string, context: LogContext) {
    this.info(`[PERFORMANCE] ${message}`, { ...context, action: 'performance' });
  }
}

// Global logger instance
export const logger = new Logger();

// Helper function to extract context from Express request
// NOTE: SessionID is intentionally excluded for security (session hijacking prevention)
export function extractRequestContext(req: any): LogContext {
  return {
    userId: req.user?.id,
    username: req.user?.username,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('User-Agent'),
    // sessionId: EXCLUDED for security - prevents session hijacking if logs are compromised
  };
}

// Helper function to measure operation duration
export function createDurationTracker() {
  const start = Date.now();
  return () => Date.now() - start;
}