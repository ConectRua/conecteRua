import { useMemo } from 'react';
import { type UBS, type Paciente, type EquipamentoSocial } from './useMockData';

interface AnalyticsData {
  especialidades: Array<{ name: string; total: number; color: string }>;
  necessidades: Array<{ name: string; pacientes: number; color: string }>;
  tiposEquipamentos: Array<{ name: string; count: number; color: string }>;
  distribuicaoIdade: Array<{ faixa: string; count: number; color: string }>;
  coberturaRegional: Array<{
    regiao: string;
    ubsCount: number;
    pacientesCount: number;
    distanciaMedia: number;
    cobertura: number;
    status: 'excelente' | 'boa' | 'regular' | 'precária';
  }>;
  metricas: {
    menorDistancia: number;
    maiorDistancia: number;
    mediaGeral: number;
    pacientesSemVinculacao: number;
  };
}

const ESPECIALIDADE_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];
const NECESSIDADE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
const EQUIPAMENTO_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export const useAnalytics = (
  ubsList: UBS[],
  pacientesList: Paciente[],
  equipamentosSociais: EquipamentoSocial[]
): AnalyticsData => {

  // Processar especialidades das UBS
  const processEspecialidades = (ubsList: UBS[]) => {
    const especialidadesCount: Record<string, number> = {};
    
    ubsList.forEach(ubs => {
      ubs.especialidades.forEach(esp => {
        especialidadesCount[esp] = (especialidadesCount[esp] || 0) + 1;
      });
    });

    return Object.entries(especialidadesCount)
      .map(([name, total], index) => ({
        name: name.length > 15 ? name.substring(0, 15) + '...' : name,
        total,
        color: ESPECIALIDADE_COLORS[index % ESPECIALIDADE_COLORS.length]
      }))
      .sort((a, b) => b.total - a.total);
  };

  // Processar necessidades dos pacientes
  const processNecessidades = (pacientesList: Paciente[]) => {
    const necessidadesCount: Record<string, number> = {};
    
    pacientesList.forEach(paciente => {
      paciente.necessidades.forEach(nec => {
        necessidadesCount[nec] = (necessidadesCount[nec] || 0) + 1;
      });
    });

    return Object.entries(necessidadesCount)
      .map(([name, pacientes], index) => ({
        name,
        pacientes,
        color: NECESSIDADE_COLORS[index % NECESSIDADE_COLORS.length]
      }))
      .sort((a, b) => b.pacientes - a.pacientes);
  };

  // Processar tipos de equipamentos sociais
  const processTiposEquipamentos = (equipamentos: EquipamentoSocial[]) => {
    const tiposCount: Record<string, number> = {};
    
    equipamentos.forEach(eq => {
      // Simplificar tipos para melhor visualização
      let tipoSimplificado = eq.tipo;
      if (tipoSimplificado.length > 25) {
        tipoSimplificado = tipoSimplificado.substring(0, 25) + '...';
      }
      tiposCount[tipoSimplificado] = (tiposCount[tipoSimplificado] || 0) + 1;
    });

    return Object.entries(tiposCount)
      .map(([name, count], index) => ({
        name,
        count,
        color: EQUIPAMENTO_COLORS[index % EQUIPAMENTO_COLORS.length]
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Pegar apenas os top 8 tipos
  };

  // Processar distribuição por idade
  const processDistribuicaoIdade = (pacientesList: Paciente[]) => {
    const faixasEtarias = {
      '0-17': 0,
      '18-29': 0,
      '30-44': 0,
      '45-59': 0,
      '60+': 0
    };

    pacientesList.forEach(paciente => {
      if (paciente.idade <= 17) faixasEtarias['0-17']++;
      else if (paciente.idade <= 29) faixasEtarias['18-29']++;
      else if (paciente.idade <= 44) faixasEtarias['30-44']++;
      else if (paciente.idade <= 59) faixasEtarias['45-59']++;
      else faixasEtarias['60+']++;
    });

    return Object.entries(faixasEtarias)
      .map(([faixa, count]) => ({ faixa, count, color: '' }))
      .filter(item => item.count > 0);
  };

  // Processar cobertura regional
  const processCoberturaRegional = (ubsList: UBS[], pacientesList: Paciente[]) => {
    const regioes = ['Samambaia', 'Recanto das Emas', 'Águas Claras'];
    
    return regioes.map(regiao => {
      const ubsRegiao = ubsList.filter(ubs => 
        ubs.endereco.toLowerCase().includes(regiao.toLowerCase())
      );
      
      const pacientesRegiao = pacientesList.filter(paciente => 
        paciente.endereco.toLowerCase().includes(regiao.toLowerCase())
      );

      const distancias = pacientesRegiao
        .filter(p => p.distanciaUBS !== undefined)
        .map(p => p.distanciaUBS!);
      
      const distanciaMedia = distancias.length > 0 
        ? distancias.reduce((sum, d) => sum + d, 0) / distancias.length 
        : 0;

      // Calcular cobertura baseada na relação UBS/pacientes e distância média
      const ratioUBSPacientes = ubsRegiao.length > 0 ? pacientesRegiao.length / ubsRegiao.length : 0;
      let cobertura = Math.min(100, (ubsRegiao.length * 30) + (ratioUBSPacientes <= 10 ? 20 : 0));
      
      // Ajustar cobertura baseado na distância média
      if (distanciaMedia > 2) cobertura *= 0.8;
      else if (distanciaMedia > 1) cobertura *= 0.9;

      let status: 'excelente' | 'boa' | 'regular' | 'precária';
      if (cobertura >= 80) status = 'excelente';
      else if (cobertura >= 65) status = 'boa';
      else if (cobertura >= 45) status = 'regular';
      else status = 'precária';

      return {
        regiao,
        ubsCount: ubsRegiao.length,
        pacientesCount: pacientesRegiao.length,
        distanciaMedia: Math.max(distanciaMedia, 0.1),
        cobertura: Math.round(cobertura),
        status
      };
    });
  };

  // Calcular métricas gerais
  const calcularMetricas = (pacientesList: Paciente[]) => {
    const distancias = pacientesList
      .filter(p => p.distanciaUBS !== undefined)
      .map(p => p.distanciaUBS!);
    
    return {
      menorDistancia: distancias.length > 0 ? Math.min(...distancias) : 0,
      maiorDistancia: distancias.length > 0 ? Math.max(...distancias) : 0,
      mediaGeral: distancias.length > 0 
        ? distancias.reduce((sum, d) => sum + d, 0) / distancias.length 
        : 0,
      pacientesSemVinculacao: pacientesList.filter(p => !p.ubsVinculada).length
    };
  };

  return useMemo(() => ({
    especialidades: processEspecialidades(ubsList),
    necessidades: processNecessidades(pacientesList),
    tiposEquipamentos: processTiposEquipamentos(equipamentosSociais),
    distribuicaoIdade: processDistribuicaoIdade(pacientesList),
    coberturaRegional: processCoberturaRegional(ubsList, pacientesList),
    metricas: calcularMetricas(pacientesList)
  }), [ubsList, pacientesList, equipamentosSociais]);
};