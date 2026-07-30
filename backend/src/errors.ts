export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = "APPLICATION_ERROR",
    public fields?: Record<string, string>
  ) {
    super(message);
  }
}

export function isPostgresUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}
