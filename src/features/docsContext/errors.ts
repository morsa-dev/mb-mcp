export class DocsContextConfigurationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "DocsContextConfigurationError";
  }
}

export const isDocsContextConfigurationError = (error: unknown): error is DocsContextConfigurationError =>
  error instanceof DocsContextConfigurationError;
