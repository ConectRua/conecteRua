import { Geolocation } from '@capacitor/geolocation';
import { toast } from 'sonner';

/**
 * Detecta se o dispositivo é iOS/iPhone
 */
export const isIOS = (): boolean => {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

/**
 * Detecta se está no Safari
 */
export const isSafari = (): boolean => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

/**
 * Mensagens de erro específicas para iOS/iPhone
 */
const getIOSLocationErrorMessage = (errorCode: number): { title: string; message: string } => {
  switch (errorCode) {
    case 1: // PERMISSION_DENIED
      return {
        title: '📱 Localização Bloqueada no iPhone',
        message: `Para habilitar, siga os passos:

1. Abra Ajustes → Privacidade e Segurança → Localização
2. Ative "Serviços de Localização"
3. Role até "Safari" → selecione "Ao Usar o App"
4. Volte ao app e toque no botão novamente

Se já fez isso, toque no "aA" na barra de endereço do Safari → Configurações do Site → Localização → Permitir`
      };
    case 2: // POSITION_UNAVAILABLE
      return {
        title: '📍 Localização Indisponível',
        message: 'Não foi possível obter sua localização. Verifique se o GPS está ativado e tente novamente.'
      };
    case 3: // TIMEOUT
      return {
        title: '⏱️ Tempo Esgotado',
        message: 'A busca pela localização demorou muito. Verifique sua conexão e tente novamente.'
      };
    default:
      return {
        title: '❌ Erro ao Obter Localização',
        message: 'Não foi possível obter sua localização. Verifique as permissões nas configurações.'
      };
  }
};

/**
 * Mensagens de erro genéricas para outros dispositivos
 */
const getGenericLocationErrorMessage = (errorCode: number): { title: string; message: string } => {
  switch (errorCode) {
    case 1: // PERMISSION_DENIED
      return {
        title: '🚫 Permissão de Localização Negada',
        message: `Para usar sua localização:

1. Permita o acesso à localização quando solicitado pelo navegador
2. Se já negou, clique no ícone de cadeado/permissões na barra de endereço
3. Altere as permissões de localização para "Permitir"
4. Recarregue a página e tente novamente`
      };
    case 2: // POSITION_UNAVAILABLE
      return {
        title: '📍 Localização Indisponível',
        message: 'Não foi possível obter sua localização. Verifique se o GPS está ativado.'
      };
    case 3: // TIMEOUT
      return {
        title: '⏱️ Tempo Esgotado',
        message: 'A busca pela localização demorou muito. Tente novamente.'
      };
    default:
      return {
        title: '❌ Erro ao Obter Localização',
        message: 'Não foi possível obter sua localização. Verifique as permissões.'
      };
  }
};

/**
 * Mostra mensagem de erro específica com base no dispositivo e erro
 */
export const showLocationError = (errorCode: number) => {
  const errorInfo = isIOS() 
    ? getIOSLocationErrorMessage(errorCode)
    : getGenericLocationErrorMessage(errorCode);
  
  toast.error(errorInfo.title, {
    description: errorInfo.message,
    duration: 8000, // 8 segundos para dar tempo de ler as instruções
  });
};

/**
 * Interface para resultado da localização
 */
export interface LocationResult {
  latitude: string;
  longitude: string;
}

/**
 * Opções para obter localização
 */
export interface GetLocationOptions {
  onSuccess: (location: LocationResult) => void;
  onError?: (error: Error) => void;
  timeout?: number;
  enableHighAccuracy?: boolean;
}

/**
 * Função principal para obter localização atual com tratamento adequado de erros
 */
export const getCurrentLocation = async (options: GetLocationOptions): Promise<void> => {
  const {
    onSuccess,
    onError,
    timeout = 10000,
    enableHighAccuracy = true
  } = options;

  try {
    // Primeiro tenta a API Capacitor (para mobile)
    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy,
        timeout
      });
      
      const location: LocationResult = {
        latitude: coordinates.coords.latitude.toString(),
        longitude: coordinates.coords.longitude.toString()
      };
      
      onSuccess(location);
      toast.success('📍 Localização obtida com sucesso!');
      return;
    } catch (capacitorError: any) {
      console.log('Capacitor geolocation failed, trying browser API:', capacitorError);
      
      // Fallback para API do browser (para web)
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location: LocationResult = {
              latitude: position.coords.latitude.toString(),
              longitude: position.coords.longitude.toString()
            };
            
            onSuccess(location);
            toast.success('📍 Localização obtida com sucesso!');
          },
          (error) => {
            console.error('Browser geolocation error:', error);
            showLocationError(error.code);
            
            if (onError) {
              onError(new Error(`Geolocation error: ${error.message}`));
            }
          },
          { 
            enableHighAccuracy, 
            timeout,
            maximumAge: 0 // Sempre pegar localização fresca
          }
        );
        return;
      } else {
        throw new Error('Geolocalização não suportada pelo navegador');
      }
    }
  } catch (error: any) {
    console.error('Erro ao obter localização:', error);
    
    // Mostrar mensagem de erro genérica se nenhuma outra foi mostrada
    toast.error('❌ Erro ao Obter Localização', {
      description: 'Não foi possível obter sua localização. Verifique as permissões.',
      duration: 5000
    });
    
    if (onError) {
      onError(error);
    }
  }
};
