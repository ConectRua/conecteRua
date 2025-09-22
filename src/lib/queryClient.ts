// Query client configuration for authentication and CRUD operations
// Based on blueprint:javascript_auth_all_persistance integration

import { QueryClient, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

// Default query function with auth handling
export const getQueryFn = (options?: { on401?: "returnNull" | "throw" }) => {
  return async ({ queryKey }: { queryKey: readonly unknown[] }) => {
    const url = queryKey[0] as string;
    
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

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Query Keys for consistent cache management
export const queryKeys = {
  ubs: {
    all: ['ubs'] as const,
    lists: () => [queryKeys.ubs.all, 'list'] as const,
    list: (filters?: any) => [queryKeys.ubs.all, 'list', filters] as const,
    details: () => [queryKeys.ubs.all, 'detail'] as const,
    detail: (id: string | number) => [queryKeys.ubs.all, 'detail', id] as const,
  },
  ongs: {
    all: ['ongs'] as const,
    lists: () => [queryKeys.ongs.all, 'list'] as const,
    list: (filters?: any) => [queryKeys.ongs.all, 'list', filters] as const,
    details: () => [queryKeys.ongs.all, 'detail'] as const,
    detail: (id: string | number) => [queryKeys.ongs.all, 'detail', id] as const,
  },
  pacientes: {
    all: ['pacientes'] as const,
    lists: () => [queryKeys.pacientes.all, 'list'] as const,
    list: (filters?: any) => [queryKeys.pacientes.all, 'list', filters] as const,
    details: () => [queryKeys.pacientes.all, 'detail'] as const,
    detail: (id: string | number) => [queryKeys.pacientes.all, 'detail', id] as const,
  },
  equipamentos: {
    all: ['equipamentos'] as const,
    lists: () => [queryKeys.equipamentos.all, 'list'] as const,
    list: (filters?: any) => [queryKeys.equipamentos.all, 'list', filters] as const,
    details: () => [queryKeys.equipamentos.all, 'detail'] as const,
    detail: (id: string | number) => [queryKeys.equipamentos.all, 'detail', id] as const,
  },
  stats: {
    all: ['stats'] as const,
    general: () => [queryKeys.stats.all, 'general'] as const,
  },
  geocoding: {
    all: ['geocoding'] as const,
    address: (address: string, cep: string) => [queryKeys.geocoding.all, 'address', address, cep] as const,
    nearby: (lat: number, lng: number, radius: number) => [queryKeys.geocoding.all, 'nearby', lat, lng, radius] as const,
  },
} as const;