import type {
  BootstrapData,
  RentalInput,
  ScooterInput,
  SessionUser
} from "./types";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields?: Record<string, string>
  ) {
    super(message);
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers
    }
  });

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string | { message?: string; fields?: Record<string, string> };
  };

  if (!response.ok) {
    const message =
      typeof payload.error === "string"
        ? payload.error
        : payload.error?.message ?? "Не удалось выполнить запрос";
    const fields =
      typeof payload.error === "object" ? payload.error.fields : undefined;
    throw new ApiError(message, response.status, fields);
  }

  return payload as T;
}

export const api = {
  getSession: () => request<{ user: SessionUser }>("/auth/me"),
  login: (email: string, password: string) =>
    request<{ user: SessionUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),
  logout: () => request<{ ok: true }>("/auth/logout", { method: "POST" }),
  bootstrap: () => request<BootstrapData>("/bootstrap"),
  createScooter: (input: ScooterInput) =>
    request("/scooters", { method: "POST", body: JSON.stringify(input) }),
  updateScooter: (id: string, input: ScooterInput) =>
    request(`/scooters/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input)
    }),
  deleteScooter: (id: string) =>
    request(`/scooters/${id}`, { method: "DELETE" }),
  createRental: (input: RentalInput) =>
    request("/rentals", { method: "POST", body: JSON.stringify(input) }),
  completeRental: (id: string) =>
    request(`/rentals/${id}/complete`, { method: "POST" })
};
