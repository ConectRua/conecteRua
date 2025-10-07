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

export interface EquipamentoSocial {
  id: string;
  nome: string;
  tipo: string;
  endereco: string;
  bairro: string;
  telefone: string;
  horarioFuncionamento: string;
  latitude?: number;
  longitude?: number;
  fonte: string;
  dataColeta: string;
}

export interface Estatisticas {
  totalUBS: number;
  totalONGs: number;
  totalPacientes: number;
  totalEquipamentosSociais: number;
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
    nome: 'Hospital Regional de Águas Quentes',
    endereco: 'Rua 10, Lote 1, Águas Quentes',
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
    latitude: -15.865795758079274,
    longitude: -48.074650142328295,
    tipo: 'UBS',
    especialidades: ['Clínica Geral', 'Enfermagem', 'Vacinação', 'Saúde da Família'],
    horarioFuncionamento: '07:00 - 17:00',
    status: 'ativo'
  },
  {
    id: '5',
    nome: 'UBS 7 de Samambaia',
    endereco: 'Quadra 302, Conjunto 05, Lote 01 - Samambaia, Brasília - DF',
    cep: '72302-302',
    telefone: '(61) 3458-5424',
    latitude: -15.8716,
    longitude: -48.0836,
    tipo: 'UBS',
    especialidades: ['Clínica Geral', 'Pediatria', 'Enfermagem', 'Vacinação', 'Saúde da Família'],
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
    endereco: 'Rua 12, Casa 45, Águas Quentes',
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

// Dados dos Equipamentos Sociais do DF baseados no arquivo Excel
const mockEquipamentosSociais: EquipamentoSocial[] = [
  {
    id: 'eq1',
    nome: 'Associação Beneficente Coração de Cristo (CoCris)',
    tipo: 'Educação Infantil e Assistência Social',
    endereco: 'Avenida Recanto das Emas, Quadra 301, Lote 26, Brasília-DF',
    bairro: 'Recanto das Emas',
    telefone: '3575-4125 / 3575-4119',
    horarioFuncionamento: 'Não especificado',
    latitude: -15.9041,
    longitude: -48.0628,
    fonte: 'Busca Paralela - Instituição Filantrópica Recanto das Emas',
    dataColeta: '13/09/2025'
  },
  {
    id: 'eq2',
    nome: 'CAPS i Recanto das Emas',
    tipo: 'Centro de Atenção Psicossocial Infantil',
    endereco: 'Quadra 307, A/E 1 – Recanto das Emas/DF (dentro do Centro de Saúde 1)',
    bairro: 'Recanto das Emas',
    telefone: '2017-1145 (Ramais 6000, 6001 e 6002)',
    horarioFuncionamento: 'De 7h às 18h, de segunda a sexta-feira',
    latitude: -15.9048,
    longitude: -48.0635,
    fonte: 'Busca Paralela - Centro de Referência Recanto das Emas',
    dataColeta: '13/09/2025'
  },
  {
    id: 'eq3',
    nome: 'CRAS RECANTO DAS EMAS I',
    tipo: 'Centro de Referência de Assistência Social',
    endereco: 'Quadra 602 -Área Especial- Lote 01 – Recanto da Emas',
    bairro: 'Recanto das Emas',
    telefone: '3773-7429, 3773-7430, 3773-7431, 3773-7432',
    horarioFuncionamento: '8h às 17h',
    latitude: -15.9052,
    longitude: -48.0640,
    fonte: 'Busca Paralela - Centro Pop Recanto das Emas',
    dataColeta: '13/09/2025'
  },
  {
    id: 'eq4',
    nome: 'CRAS RECANTO DAS EMAS II',
    tipo: 'Centro de Referência de Assistência Social',
    endereco: 'Quadra 113 área especial 01 – Recanto das Emas',
    bairro: 'Recanto das Emas',
    telefone: '3773-7433, 3773-7295',
    horarioFuncionamento: '8h às 18h',
    latitude: -15.9055,
    longitude: -48.0642,
    fonte: 'Busca Paralela - Centro Pop Recanto das Emas',
    dataColeta: '13/09/2025'
  },
  {
    id: 'eq5',
    nome: 'UBS 02 RECANTO DAS EMAS',
    tipo: 'Centro de Saúde/Unidade Básica',
    endereco: 'QUADRA 102 AREA ESPECIAL 01, RECANTO DAS EMAS, BRASILIA - DF',
    bairro: 'Recanto das Emas',
    telefone: 'Não informado',
    horarioFuncionamento: 'Segunda-Sexta 07:00 - 22:00, Sábado 07:00 - 12:00',
    latitude: -15.9044,
    longitude: -48.0631,
    fonte: 'Busca Paralela - UBS Recanto das Emas',
    dataColeta: '13/09/2025'
  },
  {
    id: 'eq6',
    nome: 'UBS 4 do Recanto',
    tipo: 'Unidade Básica de Saúde',
    endereco: 'Q. 308 AE 2, Recanto das Emas, Distrito Federal',
    bairro: 'Recanto das Emas',
    telefone: '3449-6926',
    horarioFuncionamento: 'Segunda-Sexta 07:00 - 19:00',
    latitude: -15.9050,
    longitude: -48.0638,
    fonte: 'Busca Paralela - UBS Recanto das Emas',
    dataColeta: '13/09/2025'
  },
  {
    id: 'eq7',
    nome: 'UBS 7 Recanto das Emas',
    tipo: 'Unidade Básica de Saúde',
    endereco: 'DF-341, Recanto das Emas, Distrito Federal',
    bairro: 'Recanto das Emas',
    telefone: '3449-6937',
    horarioFuncionamento: 'Segunda-Sexta 07:00 - 18:00',
    latitude: -15.9046,
    longitude: -48.0633,
    fonte: 'Busca Paralela - UBS Recanto das Emas',
    dataColeta: '13/09/2025'
  },
  {
    id: 'eq8',
    nome: 'ASSOCIACAO DE ACAO SOCIAL DE SAMAMBAIA (ASSAMA)',
    tipo: 'Associação de Defesa de Direitos',
    endereco: 'QUADRA QR 402 CONJUNTO 01 CASA, SAMAMBAIA, Brasília - DF',
    bairro: 'Samambaia',
    telefone: '34581138',
    horarioFuncionamento: 'Não especificado',
    latitude: -15.8785,
    longitude: -48.0962,
    fonte: 'Busca Paralela - Ação Social Samambaia',
    dataColeta: '13/09/2025'
  },
  {
    id: 'eq9',
    nome: 'CAPS III',
    tipo: 'Centro de Atenção Psicossocial',
    endereco: 'Quadra 302 Conjunto 05 Lote 01 - Centro Urbano de Samambaia',
    bairro: 'Samambaia',
    telefone: '3357-0783',
    horarioFuncionamento: 'Não especificado',
    latitude: -15.8788,
    longitude: -48.0965,
    fonte: 'Busca Paralela - UBS Samambaia',
    dataColeta: '13/09/2025'
  },
  {
    id: 'eq10',
    nome: 'CRAS Samambaia Expansão',
    tipo: 'Centro de Referência de Assistência Social',
    endereco: 'QR 833, Conjunto 08, Lote 01/02 – Samambaia Expansão',
    bairro: 'Samambaia',
    telefone: '3773-7444, 3773-7445, 3773-7443, 3773-7446',
    horarioFuncionamento: '8h às 17h',
    latitude: -15.8790,
    longitude: -48.0968,
    fonte: 'SEDES-DF Oficial',
    dataColeta: '13/09/2025'
  },
  {
    id: 'eq11',
    nome: 'CRAS Samambaia Sul',
    tipo: 'Centro de Referência de Assistência Social',
    endereco: 'QN 317, Área Especial 02, Samambaia',
    bairro: 'Samambaia',
    telefone: '3773-7449, 3773-7450, 3773-7451, 3773-7452',
    horarioFuncionamento: '8h às 17h',
    latitude: -15.8792,
    longitude: -48.0970,
    fonte: 'SEDES-DF Oficial',
    dataColeta: '13/09/2025'
  },
  {
    id: 'eq12',
    nome: 'Hospital Regional de Samambaia - HRSam',
    tipo: 'Hospital Regional',
    endereco: 'QS 614 Conj. C Lote 01/02 Samambaia Norte - CEP 72322-583',
    bairro: 'Samambaia',
    telefone: '3458-9835',
    horarioFuncionamento: '24 horas',
    latitude: -15.8795,
    longitude: -48.0973,
    fonte: 'Busca Paralela - UBS Samambaia',
    dataColeta: '13/09/2025'
  },
  {
    id: 'eq13',
    nome: 'UBS 08 RECANTO DAS EMAS SAO FRANCISCO',
    tipo: 'Centro de Saúde/Unidade Básica',
    endereco: 'Df 280 Km 03 Qd 04 Setor Habitacional Agua Quente, S/N',
    bairro: 'SH Água Quente',
    telefone: '3359-6733',
    horarioFuncionamento: 'Segunda-Sexta 07:00 - 18:00',
    latitude: -15.8968,
    longitude: -48.0458,
    fonte: 'Busca Paralela - UBS SH Água Quente',
    dataColeta: '13/09/2025'
  },
  {
    id: 'eq14',
    nome: 'Conselho Tutelar de Água Quente',
    tipo: 'Conselho Tutelar (Assistência Social)',
    endereco: 'QUADRA 01, LOTE 05-RESIDENCIAL RÓCIO, DF-280, KM 2',
    bairro: 'SH Água Quente',
    telefone: '2244-1088, 98382-0142 (plantão)',
    horarioFuncionamento: 'Plantão 24h para emergências',
    latitude: -15.8970,
    longitude: -48.0460,
    fonte: 'Busca Paralela - Centro de Referência SH Água Quente',
    dataColeta: '13/09/2025'
  },
  {
    id: 'eq15',
    nome: 'Instituto Embalando Sonhos',
    tipo: 'Instituto Social, Cultural e Educativo',
    endereco: 'Samambaia - DF',
    bairro: 'Samambaia',
    telefone: '9.9198-0652',
    horarioFuncionamento: 'Não especificado',
    latitude: -15.8797,
    longitude: -48.0975,
    fonte: 'Busca Paralela - Ação Social Samambaia',
    dataColeta: '13/09/2025'
  }
];

// Hook principal para centralizaar todos os mocks
export const useMockData = () => {
  const [ubsList, setUbsList] = useState<UBS[]>(mockUBS);
  const [ongsList, setOngsList] = useState<ONG[]>(mockONGs);
  const [pacientesList, setPacientesList] = useState<Paciente[]>(mockPacientes);
  const [equipamentosSociais, setEquipamentosSociais] = useState<EquipamentoSocial[]>(mockEquipamentosSociais);
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

  // Função para atualizar posições dos marcadores
  const updatePosition = (id: string, type: 'ubs' | 'ong' | 'paciente' | 'equipamento', lat: number, lng: number) => {
    console.log('updatePosition called:', { id, type, lat, lng });
    
    switch (type) {
      case 'ubs':
        console.log('Updating UBS position');
        updateUBS(id, { latitude: lat, longitude: lng });
        break;
      case 'ong':
        console.log('Updating ONG position');
        updateONG(id, { latitude: lat, longitude: lng });
        break;
      case 'paciente':
        console.log('Updating Paciente position');
        updatePaciente(id, { latitude: lat, longitude: lng });
        break;
      case 'equipamento':
        console.log('Updating Equipamento position');
        setEquipamentosSociais(prev => 
          prev.map(eq => eq.id === id ? { ...eq, latitude: lat, longitude: lng } : eq)
        );
        break;
    }
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
      totalEquipamentosSociais: equipamentosSociais.length,
      pacientesVinculados,
      coberturaPorRegiao: {
        'Samambaia': pacientesList.filter(p => p.endereco.includes('Samambaia')).length,
        'Recanto das Emas': pacientesList.filter(p => p.endereco.includes('Recanto')).length,
        'Águas Quentes': pacientesList.filter(p => p.endereco.includes('Águas Quentes')).length,
      },
      distanciaMedia: isNaN(distanciaMedia) ? 0 : distanciaMedia
    };
  };

  return {
    // Data
    ubsList,
    ongsList,
    pacientesList,
    equipamentosSociais,
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
    updatePosition,
    
    // Actions
    fetchData
  };
};