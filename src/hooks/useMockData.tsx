import { useState, useEffect } from 'react';

// Types para o sistema
export interface UBS {
  id: string;
  nome: string;
  endereco: string;
  cep: string;
  telefone: string;
  latitude: number;
  longitude: number;
  tipo: 'UBS' | 'Hospital' | 'Clínica';
  especialidades: string[];
  horarioFuncionamento: string;
  status: 'ativo' | 'inativo';
}

export interface ONG {
  id: string;
  nome: string;
  endereco: string;
  cep: string;
  telefone: string;
  latitude: number;
  longitude: number;
  tipo: 'ONG' | 'Filantrópica' | 'Assistência Social';
  servicos: string[];
  responsavel: string;
  status: 'ativo' | 'inativo';
}

export interface Paciente {
  id: string;
  nome: string;
  cns: string;
  endereco: string;
  cep: string;
  telefone: string;
  latitude: number;
  longitude: number;
  idade: number;
  genero: 'M' | 'F' | 'Outro';
  necessidades: string[];
  ubsVinculada?: string;
  distanciaUBS?: number;
}

export interface Estatisticas {
  totalUBS: number;
  totalONGs: number;
  totalPacientes: number;
  pacientesVinculados: number;
  coberturaPorRegiao: Record<string, number>;
  distanciaMedia: number;
}

// Mock data
const mockUBS: UBS[] = [
  {
    id: '1',
    nome: 'UBS Samambaia Sul',
    endereco: 'QS 101, Conjunto A, Lote 1, Samambaia',
    cep: '72302-101',
    telefone: '(61) 3901-2345',
    latitude: -15.8781,
    longitude: -48.0958,
    tipo: 'UBS',
    especialidades: ['Clínica Geral', 'Pediatria', 'Ginecologia'],
    horarioFuncionamento: '07:00 - 17:00',
    status: 'ativo'
  },
  {
    id: '2',
    nome: 'UBS Recanto das Emas',
    endereco: 'Quadra 101, Conjunto A, Recanto das Emas',
    cep: '72610-101',
    telefone: '(61) 3901-3456',
    latitude: -15.9045,
    longitude: -48.0632,
    tipo: 'UBS',
    especialidades: ['Clínica Geral', 'Odontologia', 'Saúde Mental'],
    horarioFuncionamento: '07:00 - 17:00',
    status: 'ativo'
  },
  {
    id: '3',
    nome: 'Hospital Regional de Águas Claras',
    endereco: 'Rua 10, Lote 1, Águas Claras',
    cep: '71916-000',
    telefone: '(61) 3901-4567',
    latitude: -15.8347,
    longitude: -48.0227,
    tipo: 'Hospital',
    especialidades: ['Emergência', 'UTI', 'Cirurgia', 'Cardiologia'],
    horarioFuncionamento: '24 horas',
    status: 'ativo'
  },
  {
    id: '4',
    nome: 'UBS 12 Samambaia',
    endereco: '22, QR 210 Conj. 20 - Samambaia Norte, Brasília - DF',
    cep: '72320-210',
    telefone: '(61) 3901-5678',
    latitude: -15.8658,
    longitude: -48.1102,
    tipo: 'UBS',
    especialidades: ['Clínica Geral', 'Enfermagem', 'Vacinação', 'Saúde da Família'],
    horarioFuncionamento: '07:00 - 17:00',
    status: 'ativo'
  }
];

const mockONGs: ONG[] = [
  {
    id: '1',
    nome: 'Instituto Solidário Samambaia',
    endereco: 'QS 102, Conjunto B, Lote 5, Samambaia',
    cep: '72302-102',
    telefone: '(61) 9876-1234',
    latitude: -15.8785,
    longitude: -48.0962,
    tipo: 'Assistência Social',
    servicos: ['Distribuição de Alimentos', 'Acompanhamento Psicológico', 'Cursos Profissionalizantes'],
    responsavel: 'Maria Silva Santos',
    status: 'ativo'
  },
  {
    id: '2',
    nome: 'Casa de Apoio Recanto',
    endereco: 'Quadra 102, Conjunto C, Recanto das Emas',
    cep: '72610-102',
    telefone: '(61) 9876-2345',
    latitude: -15.9048,
    longitude: -48.0635,
    tipo: 'ONG',
    servicos: ['Abrigo Temporário', 'Assistência Jurídica', 'Reintegração Social'],
    responsavel: 'João Carlos Oliveira',
    status: 'ativo'
  }
];

const mockPacientes: Paciente[] = [
  {
    id: '1',
    nome: 'Ana Paula Costa',
    cns: '123456789012345',
    endereco: 'QS 103, Conjunto A, Casa 12, Samambaia',
    cep: '72302-103',
    telefone: '(61) 9999-1111',
    latitude: -15.8790,
    longitude: -48.0965,
    idade: 34,
    genero: 'F',
    necessidades: ['Pré-natal', 'Acompanhamento Nutricional'],
    ubsVinculada: '1',
    distanciaUBS: 1.2
  },
  {
    id: '2',
    nome: 'Carlos Eduardo Silva',
    cns: '987654321098765',
    endereco: 'Quadra 103, Casa 25, Recanto das Emas',
    cep: '72610-103',
    telefone: '(61) 9999-2222',
    latitude: -15.9050,
    longitude: -48.0638,
    idade: 67,
    genero: 'M',
    necessidades: ['Hipertensão', 'Diabetes', 'Cardiologia'],
    ubsVinculada: '2',
    distanciaUBS: 0.8
  },
  {
    id: '3',
    nome: 'Isabella Santos',
    cns: '456789123456789',
    endereco: 'Rua 12, Casa 45, Águas Claras',
    cep: '71916-012',
    telefone: '(61) 9999-3333',
    latitude: -15.8350,
    longitude: -48.0230,
    idade: 28,
    genero: 'F',
    necessidades: ['Check-up Geral', 'Ginecologia'],
    ubsVinculada: '3',
    distanciaUBS: 0.5
  }
];

// Hook principal para centralizaar todos os mocks
export const useMockData = () => {
  const [ubsList, setUbsList] = useState<UBS[]>(mockUBS);
  const [ongsList, setOngsList] = useState<ONG[]>(mockONGs);
  const [pacientesList, setPacientesList] = useState<Paciente[]>(mockPacientes);
  const [loading, setLoading] = useState(false);

  // Simula carregamento de dados
  const fetchData = async () => {
    setLoading(true);
    // Simula delay de API
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Métodos CRUD para UBS
  const addUBS = (ubs: Omit<UBS, 'id'>) => {
    const newUBS = { ...ubs, id: Date.now().toString() };
    setUbsList(prev => [...prev, newUBS]);
    return newUBS;
  };

  const updateUBS = (id: string, updates: Partial<UBS>) => {
    setUbsList(prev => prev.map(ubs => ubs.id === id ? { ...ubs, ...updates } : ubs));
  };

  const deleteUBS = (id: string) => {
    setUbsList(prev => prev.filter(ubs => ubs.id !== id));
  };

  // Métodos CRUD para ONGs
  const addONG = (ong: Omit<ONG, 'id'>) => {
    const newONG = { ...ong, id: Date.now().toString() };
    setOngsList(prev => [...prev, newONG]);
    return newONG;
  };

  const updateONG = (id: string, updates: Partial<ONG>) => {
    setOngsList(prev => prev.map(ong => ong.id === id ? { ...ong, ...updates } : ong));
  };

  const deleteONG = (id: string) => {
    setOngsList(prev => prev.filter(ong => ong.id !== id));
  };

  // Métodos CRUD para Pacientes
  const addPaciente = (paciente: Omit<Paciente, 'id'>) => {
    const newPaciente = { ...paciente, id: Date.now().toString() };
    setPacientesList(prev => [...prev, newPaciente]);
    return newPaciente;
  };

  const updatePaciente = (id: string, updates: Partial<Paciente>) => {
    setPacientesList(prev => prev.map(paciente => paciente.id === id ? { ...paciente, ...updates } : paciente));
  };

  const deletePaciente = (id: string) => {
    setPacientesList(prev => prev.filter(paciente => paciente.id !== id));
  };

  // Busca por CEP/Endereço
  const searchByCEP = async (cep: string) => {
    setLoading(true);
    // Simula busca via CEP
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const allLocations = [
      ...ubsList.map(ubs => ({ ...ubs, type: 'UBS' as const })),
      ...ongsList.map(ong => ({ ...ong, type: 'ONG' as const })),
      ...pacientesList.map(paciente => ({ ...paciente, type: 'Paciente' as const }))
    ];
    
    const results = allLocations.filter(location => 
      location.cep.includes(cep.replace(/\D/g, ''))
    );
    
    setLoading(false);
    return results;
  };

  // Pareamento automático
  const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const encontrarUBSMaisProxima = (paciente: Paciente): UBS | null => {
    if (ubsList.length === 0) return null;
    
    let ubsMaisProxima = ubsList[0];
    let menorDistancia = calcularDistancia(
      paciente.latitude, paciente.longitude,
      ubsMaisProxima.latitude, ubsMaisProxima.longitude
    );

    ubsList.forEach(ubs => {
      const distancia = calcularDistancia(
        paciente.latitude, paciente.longitude,
        ubs.latitude, ubs.longitude
      );
      if (distancia < menorDistancia) {
        menorDistancia = distancia;
        ubsMaisProxima = ubs;
      }
    });

    return ubsMaisProxima;
  };

  // Estatísticas
  const getEstatisticas = (): Estatisticas => {
    const pacientesVinculados = pacientesList.filter(p => p.ubsVinculada).length;
    const distanciaMedia = pacientesList.reduce((acc, p) => acc + (p.distanciaUBS || 0), 0) / pacientesList.length;
    
    return {
      totalUBS: ubsList.length,
      totalONGs: ongsList.length,
      totalPacientes: pacientesList.length,
      pacientesVinculados,
      coberturaPorRegiao: {
        'Samambaia': pacientesList.filter(p => p.endereco.includes('Samambaia')).length,
        'Recanto das Emas': pacientesList.filter(p => p.endereco.includes('Recanto')).length,
        'Águas Claras': pacientesList.filter(p => p.endereco.includes('Águas Claras')).length,
      },
      distanciaMedia: isNaN(distanciaMedia) ? 0 : distanciaMedia
    };
  };

  return {
    // Data
    ubsList,
    ongsList,
    pacientesList,
    loading,
    
    // CRUD UBS
    addUBS,
    updateUBS,
    deleteUBS,
    
    // CRUD ONGs
    addONG,
    updateONG,
    deleteONG,
    
    // CRUD Pacientes
    addPaciente,
    updatePaciente,
    deletePaciente,
    
    // Utilities
    searchByCEP,
    encontrarUBSMaisProxima,
    calcularDistancia,
    getEstatisticas,
    
    // Actions
    fetchData
  };
};