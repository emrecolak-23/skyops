import axios from "axios";

export class ApiError extends Error {
  constructor(
    public status: number | undefined,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api",
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ?? error.message ?? "Request failed";
    return Promise.reject(new ApiError(status, message));
  },
);

export const api = {
  get: <T>(path: string) => apiClient.get<T>(path).then((r) => r.data),
  post: <T>(path: string, body: unknown) =>
    apiClient.post<T>(path, body).then((r) => r.data),
  patch: <T>(path: string, body?: unknown) =>
    apiClient.patch<T>(path, body).then((r) => r.data),
  delete: <T>(path: string) => apiClient.delete<T>(path).then((r) => r.data),
};
