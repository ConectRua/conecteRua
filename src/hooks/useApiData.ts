// Real API hooks to replace useMockData
// Phase 5: Frontend → Backend Integration

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, queryKeys, getQueryFn } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Import types from shared schema
import type { 
  UBS, 
  InsertUBS, 
  ONG, 
  InsertONG, 
  Paciente, 
  InsertPaciente, 
  EquipamentoSocial, 
  InsertEquipamentoSocial 
} from '../../shared/schema';

export interface Estatisticas {
  totalUBS: number;
  totalONGs: number;
  totalPacientes: number;
  totalEquipamentosSociais: number;
  pacientesVinculados: number;
  coberturaPorRegiao: Record<string, number>;
  distanciaMedia: number;
}

// ============ UBS HOOKS ============

export const useUBSList = () => {
  return useQuery({
    queryKey: queryKeys.ubs.lists(),
    queryFn: getQueryFn(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUBS = (id: number) => {
  return useQuery({
    queryKey: queryKeys.ubs.detail(id),
    queryFn: getQueryFn(),
    enabled: !!id,
  });
};

export const useCreateUBS = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (ubs: InsertUBS) => {
      return apiRequest('POST', '/api/ubs', ubs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ubs.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
      toast({
        title: "Sucesso",
        description: "UBS criada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar UBS",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateUBS = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<UBS> & { id: number }) => {
      return apiRequest('PUT', `/api/ubs/${id}`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ubs.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.ubs.detail(variables.id) });
      toast({
        title: "Sucesso",
        description: "UBS atualizada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar UBS",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteUBS = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/ubs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ubs.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
      toast({
        title: "Sucesso",
        description: "UBS removida com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover UBS",
        variant: "destructive",
      });
    },
  });
};

// ============ ONGs HOOKS ============

export const useONGsList = () => {
  return useQuery({
    queryKey: queryKeys.ongs.lists(),
    queryFn: getQueryFn(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useONG = (id: number) => {
  return useQuery({
    queryKey: queryKeys.ongs.detail(id),
    queryFn: getQueryFn(),
    enabled: !!id,
  });
};

export const useCreateONG = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (ong: InsertONG) => {
      return apiRequest('POST', '/api/ongs', ong);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ongs.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
      toast({
        title: "Sucesso",
        description: "ONG criada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar ONG",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateONG = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ONG> & { id: number }) => {
      return apiRequest('PUT', `/api/ongs/${id}`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ongs.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.ongs.detail(variables.id) });
      toast({
        title: "Sucesso",
        description: "ONG atualizada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar ONG",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteONG = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/ongs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ongs.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
      toast({
        title: "Sucesso",
        description: "ONG removida com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover ONG",
        variant: "destructive",
      });
    },
  });
};

// ============ PACIENTES HOOKS ============

export const usePacientesList = () => {
  return useQuery({
    queryKey: queryKeys.pacientes.lists(),
    queryFn: getQueryFn(),
    staleTime: 5 * 60 * 1000,
  });
};

export const usePaciente = (id: number) => {
  return useQuery({
    queryKey: queryKeys.pacientes.detail(id),
    queryFn: getQueryFn(),
    enabled: !!id,
  });
};

export const useCreatePaciente = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (paciente: InsertPaciente) => {
      return apiRequest('POST', '/api/pacientes', paciente);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pacientes.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
      toast({
        title: "Sucesso",
        description: "Paciente cadastrado com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao cadastrar paciente",
        variant: "destructive",
      });
    },
  });
};

export const useUpdatePaciente = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Paciente> & { id: number }) => {
      return apiRequest('PUT', `/api/pacientes/${id}`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pacientes.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.pacientes.detail(variables.id) });
      toast({
        title: "Sucesso",
        description: "Paciente atualizado com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar paciente",
        variant: "destructive",
      });
    },
  });
};

export const useDeletePaciente = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/pacientes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pacientes.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
      toast({
        title: "Sucesso",
        description: "Paciente removido com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover paciente",
        variant: "destructive",
      });
    },
  });
};

// ============ EQUIPAMENTOS SOCIAIS HOOKS ============

export const useEquipamentosSociais = () => {
  return useQuery({
    queryKey: queryKeys.equipamentos.lists(),
    queryFn: getQueryFn(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useEquipamentoSocial = (id: number) => {
  return useQuery({
    queryKey: queryKeys.equipamentos.detail(id),
    queryFn: getQueryFn(),
    enabled: !!id,
  });
};

export const useCreateEquipamentoSocial = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (equipamento: InsertEquipamentoSocial) => {
      return apiRequest('POST', '/api/equipamentos-sociais', equipamento);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equipamentos.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
      toast({
        title: "Sucesso",
        description: "Equipamento social cadastrado com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao cadastrar equipamento social",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateEquipamentoSocial = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<EquipamentoSocial> & { id: number }) => {
      return apiRequest('PUT', `/api/equipamentos-sociais/${id}`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equipamentos.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.equipamentos.detail(variables.id) });
      toast({
        title: "Sucesso",
        description: "Equipamento social atualizado com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar equipamento social",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteEquipamentoSocial = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/equipamentos-sociais/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equipamentos.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
      toast({
        title: "Sucesso",
        description: "Equipamento social removido com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover equipamento social",
        variant: "destructive",
      });
    },
  });
};

// ============ STATISTICS HOOKS ============

export const useEstatisticas = () => {
  return useQuery({
    queryKey: queryKeys.stats.general(),
    queryFn: getQueryFn(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// ============ GEOCODING HOOKS ============

export const useGeocode = (endereco: string, cep: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.geocoding.address(endereco, cep),
    queryFn: getQueryFn(),
    enabled: enabled && !!endereco && !!cep,
    staleTime: 10 * 60 * 1000, // 10 minutes - geocoding results don't change often
  });
};

export const useNearbyServices = (lat: number, lng: number, radius = 5) => {
  return useQuery({
    queryKey: queryKeys.geocoding.nearby(lat, lng, radius),
    queryFn: getQueryFn(),
    enabled: !!lat && !!lng,
    staleTime: 5 * 60 * 1000,
  });
};

// ============ FILE UPLOAD HOOKS ============

export const useUploadPlanilha = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ file, tipo }: { file: File; tipo: 'ubs' | 'ongs' | 'pacientes' | 'equipamentos' | 'auto' }) => {
      const formData = new FormData();
      formData.append('arquivo', file);
      formData.append('tipo', tipo);

      const response = await fetch('/api/upload/planilha', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate all relevant caches
      queryClient.invalidateQueries({ queryKey: queryKeys.ubs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.ongs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.pacientes.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.equipamentos.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
      
      toast({
        title: "Sucesso",
        description: `Planilha processada! ${data.registros_importados}/${data.registros_processados} registros importados com sucesso.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao processar planilha",
        variant: "destructive",
      });
    },
  });
};

// ============ RECLASSIFICATION HOOKS ============

export const useReclassificar = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, tipoOrigem, tipoDestino }: { 
      id: number; 
      tipoOrigem: 'ubs' | 'ongs' | 'equipamentos'; 
      tipoDestino: 'ubs' | 'ongs' | 'equipamentos' 
    }) => {
      return apiRequest('POST', '/api/reclassificar', { id, tipoOrigem, tipoDestino });
    },
    onSuccess: (data) => {
      // Invalidate all relevant caches
      queryClient.invalidateQueries({ queryKey: queryKeys.ubs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.ongs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.equipamentos.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
      
      toast({
        title: "Sucesso",
        description: data.mensagem,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao reclassificar registro",
        variant: "destructive",
      });
    },
  });
};

// ============ COMPOSITE HOOK FOR BACKWARD COMPATIBILITY ============

export const useApiData = () => {
  const ubsQuery = useUBSList();
  const ongsQuery = useONGsList();
  const pacientesQuery = usePacientesList();
  const equipamentosQuery = useEquipamentosSociais();
  const statsQuery = useEstatisticas();

  const isLoading = ubsQuery.isLoading || ongsQuery.isLoading || pacientesQuery.isLoading || equipamentosQuery.isLoading;
  const isError = ubsQuery.isError || ongsQuery.isError || pacientesQuery.isError || equipamentosQuery.isError;

  // Mutations
  const createUBS = useCreateUBS();
  const updateUBS = useUpdateUBS();
  const deleteUBS = useDeleteUBS();
  const createONG = useCreateONG();
  const updateONG = useUpdateONG();
  const deleteONG = useDeleteONG();
  const createPaciente = useCreatePaciente();
  const updatePaciente = useUpdatePaciente();
  const deletePaciente = useDeletePaciente();
  const createEquipamentoSocial = useCreateEquipamentoSocial();
  const updateEquipamentoSocial = useUpdateEquipamentoSocial();
  const deleteEquipamentoSocial = useDeleteEquipamentoSocial();

  return {
    // Data
    ubsList: ubsQuery.data || [],
    ongsList: ongsQuery.data || [],
    pacientesList: pacientesQuery.data || [],
    equipamentosSociais: equipamentosQuery.data || [],
    
    // Stats
    getEstatisticas: () => statsQuery.data || {
      totalUBS: 0,
      totalONGs: 0,
      totalPacientes: 0,
      totalEquipamentosSociais: 0,
      pacientesVinculados: 0,
      coberturaPorRegiao: {},
      distanciaMedia: 0,
    },

    // State
    loading: isLoading,
    error: isError,

    // CRUD operations
    addUBS: (ubs: InsertUBS) => createUBS.mutate(ubs),
    updateUBS: (id: number, updates: Partial<UBS>) => updateUBS.mutate({ id, ...updates }),
    deleteUBS: (id: number) => deleteUBS.mutate(id),
    
    addONG: (ong: InsertONG) => createONG.mutate(ong),
    updateONG: (id: number, updates: Partial<ONG>) => updateONG.mutate({ id, ...updates }),
    deleteONG: (id: number) => deleteONG.mutate(id),
    
    addPaciente: (paciente: InsertPaciente) => createPaciente.mutate(paciente),
    updatePaciente: (id: number, updates: Partial<Paciente>) => updatePaciente.mutate({ id, ...updates }),
    deletePaciente: (id: number) => deletePaciente.mutate(id),
    
    addEquipamentoSocial: (equipamento: InsertEquipamentoSocial) => createEquipamentoSocial.mutate(equipamento),
    updateEquipamentoSocial: (id: number, updates: Partial<EquipamentoSocial>) => updateEquipamentoSocial.mutate({ id, ...updates }),
    deleteEquipamentoSocial: (id: number) => deleteEquipamentoSocial.mutate(id),

    // Position update for map editing (backward compatibility)
    updatePosition: (id: string, type: 'ubs' | 'ong' | 'paciente' | 'equipamento', lat: number, lng: number) => {
      const numId = parseInt(id);
      const updates = { latitude: lat, longitude: lng };
      
      switch (type) {
        case 'ubs':
          updateUBS.mutate({ id: numId, ...updates });
          break;
        case 'ong':
          updateONG.mutate({ id: numId, ...updates });
          break;
        case 'paciente':
          updatePaciente.mutate({ id: numId, ...updates });
          break;
        case 'equipamento':
          updateEquipamentoSocial.mutate({ id: numId, ...updates });
          break;
      }
    },

    // Mutation states
    isCreating: createUBS.isPending || createONG.isPending || createPaciente.isPending,
    isUpdating: updateUBS.isPending || updateONG.isPending || updatePaciente.isPending,
    isDeleting: deleteUBS.isPending || deleteONG.isPending || deletePaciente.isPending,
  };
};