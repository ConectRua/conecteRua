import { useState } from 'react';

interface DuplicateCheckResult {
  existe: boolean;
  registro?: any;
}

export function useDuplicateCheck() {
  const [isChecking, setIsChecking] = useState(false);

  const checkPacienteDuplicate = async (cnsOuCpf: string): Promise<DuplicateCheckResult> => {
    if (!cnsOuCpf || cnsOuCpf.trim() === '') {
      return { existe: false };
    }

    setIsChecking(true);
    try {
      const response = await fetch(`/api/pacientes/verificar?cnsOuCpf=${encodeURIComponent(cnsOuCpf)}`);
      if (!response.ok) {
        throw new Error('Erro ao verificar duplicata');
      }
      const data = await response.json();
      return { existe: data.existe, registro: data.paciente };
    } catch (error) {
      console.error('Erro ao verificar duplicata de paciente:', error);
      return { existe: false };
    } finally {
      setIsChecking(false);
    }
  };

  const checkUBSDuplicate = async (nome: string): Promise<DuplicateCheckResult> => {
    if (!nome || nome.trim() === '') {
      return { existe: false };
    }

    setIsChecking(true);
    try {
      const response = await fetch(`/api/ubs/verificar?nome=${encodeURIComponent(nome)}`);
      if (!response.ok) {
        throw new Error('Erro ao verificar duplicata');
      }
      const data = await response.json();
      return { existe: data.existe, registro: data.ubs };
    } catch (error) {
      console.error('Erro ao verificar duplicata de UBS:', error);
      return { existe: false };
    } finally {
      setIsChecking(false);
    }
  };

  const checkONGDuplicate = async (nome: string): Promise<DuplicateCheckResult> => {
    if (!nome || nome.trim() === '') {
      return { existe: false };
    }

    setIsChecking(true);
    try {
      const response = await fetch(`/api/ongs/verificar?nome=${encodeURIComponent(nome)}`);
      if (!response.ok) {
        throw new Error('Erro ao verificar duplicata');
      }
      const data = await response.json();
      return { existe: data.existe, registro: data.ong };
    } catch (error) {
      console.error('Erro ao verificar duplicata de ONG:', error);
      return { existe: false };
    } finally {
      setIsChecking(false);
    }
  };

  const checkEquipamentoSocialDuplicate = async (nome: string): Promise<DuplicateCheckResult> => {
    if (!nome || nome.trim() === '') {
      return { existe: false };
    }

    setIsChecking(true);
    try {
      const response = await fetch(`/api/equipamentos-sociais/verificar?nome=${encodeURIComponent(nome)}`);
      if (!response.ok) {
        throw new Error('Erro ao verificar duplicata');
      }
      const data = await response.json();
      return { existe: data.existe, registro: data.equipamento };
    } catch (error) {
      console.error('Erro ao verificar duplicata de equipamento social:', error);
      return { existe: false };
    } finally {
      setIsChecking(false);
    }
  };

  return {
    isChecking,
    checkPacienteDuplicate,
    checkUBSDuplicate,
    checkONGDuplicate,
    checkEquipamentoSocialDuplicate
  };
}
