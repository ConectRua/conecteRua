// Query client configuration for authentication and CRUD operations
// Based on blueprint:javascript_auth_all_persistance integration

import { QueryClient, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Get API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error: any) => {
        if (error?.status === 401) return false;
        return failureCount < 3;
      },
    },
  },
});

// Helper function to build full URL
const buildUrl = (path: string) => {
  // In development, use proxy (relative path)
  if (import.meta.env.DEV) {
    return path;
  }
  // In production, use full API URL
  return `${API_BASE_URL}${path}`;
};

// Default query function with auth handling
export const getQueryFn = (options?: { on401?: "returnNull" | "throw" }) => {
  return async ({ queryKey }: { queryKey: readonly unknown[] }) => {
    const url = buildUrl(queryKey[0] as string);

    const response = await fetch(url, {
      credentials: "include",
    });

    if (response.status === 401) {
      if (options?.on401 === "returnNull") {
        return null;
      }
      throw new Error("Não autenticado");
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  };
};

// API request function for mutations
export async function apiRequest(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  url: string,
  data?: unknown
) {
  const fullUrl = buildUrl(url);

  const config: RequestInit = {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(fullUrl, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Query Keys for consistent cache management
export const queryKeys = {
  ubs: {
    all: ['/api/ubs'] as const,
    lists: () => ['/api/ubs'] as const,
    list: (filters?: any) => ['/api/ubs', filters] as const,
    details: () => ['/api/ubs', 'detail'] as const,
    detail: (id: string | number) => [`/api/ubs/${id}`] as const,
  },
  ongs: {
    all: ['/api/ongs'] as const,
    lists: () => ['/api/ongs'] as const,
    list: (filters?: any) => ['/api/ongs', filters] as const,
    details: () => ['/api/ongs', 'detail'] as const,
    detail: (id: string | number) => [`/api/ongs/${id}`] as const,
  },
  pacientes: {
    all: ['/api/pacientes'] as const,
    lists: () => ['/api/pacientes'] as const,
    list: (filters?: any) => ['/api/pacientes', filters] as const,
    details: () => ['/api/pacientes', 'detail'] as const,
    detail: (id: string | number) => [`/api/pacientes/${id}`] as const,
  },
  equipamentos: {
    all: ['/api/equipamentos-sociais'] as const,
    lists: () => ['/api/equipamentos-sociais'] as const,
    list: (filters?: any) => ['/api/equipamentos-sociais', filters] as const,
    details: () => ['/api/equipamentos-sociais', 'detail'] as const,
    detail: (id: string | number) => [`/api/equipamentos-sociais/${id}`] as const,
  },
  stats: {
    all: ['/api/estatisticas'] as const,
    general: () => ['/api/estatisticas'] as const,
  },
  geocoding: {
    all: ['/api/geocoding'] as const,
    address: (address: string, cep: string) => [`/api/geocoding?endereco=${encodeURIComponent(address)}&cep=${cep}`] as const,
    nearby: (lat: number, lng: number, radius: number) => [`/api/nearby?lat=${lat}&lng=${lng}&radius=${radius}`] as const,
  },
  admin: {
    users: () => ['/api/admin/users'] as const,
  },
} as const;
