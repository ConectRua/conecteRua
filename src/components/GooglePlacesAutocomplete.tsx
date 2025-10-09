import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PlaceResult {
  nome: string;
  endereco: string;
  cep: string;
  latitude: number;
  longitude: number;
  telefone?: string;
  horarioFuncionamento?: string;
  email?: string;
}

interface GooglePlacesAutocompleteProps {
  onPlaceSelected: (place: PlaceResult) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export const GooglePlacesAutocomplete = ({
  onPlaceSelected,
  placeholder = "Digite o nome ou endereço do estabelecimento...",
  label = "Buscar no Google Maps",
  className = "",
  disabled = false
}: GooglePlacesAutocompleteProps) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const placeServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    if (!inputRef.current) return;

    // Verificar se Google Maps API está disponível
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      console.warn('Google Maps Places API não está carregada');
      return;
    }

    // Criar elemento div invisível para o PlacesService
    const serviceDiv = document.createElement('div');
    placeServiceRef.current = new google.maps.places.PlacesService(serviceDiv);

    // Configurar Autocomplete
    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'BR' },
      fields: [
        'name', 
        'formatted_address', 
        'geometry', 
        'formatted_phone_number',
        'opening_hours',
        'website',
        'address_components',
        'place_id'
      ],
      types: ['establishment'] // Buscar apenas estabelecimentos
    });

    autocompleteRef.current = autocomplete;

    // Adicionar listener para quando um lugar for selecionado
    const listener = autocomplete.addListener('place_changed', () => {
      handlePlaceSelection();
    });

    // Cleanup
    return () => {
      if (listener) {
        google.maps.event.removeListener(listener);
      }
    };
  }, []);

  const handlePlaceSelection = async () => {
    if (!autocompleteRef.current) return;

    const place = autocompleteRef.current.getPlace();
    
    if (!place || !place.geometry || !place.geometry.location) {
      toast.error('Não foi possível obter informações do lugar selecionado');
      return;
    }

    setIsSearching(true);
    
    try {
      // Extrair CEP dos componentes do endereço
      let cep = '';
      if (place.address_components) {
        const postalCode = place.address_components.find(
          component => component.types.includes('postal_code')
        );
        if (postalCode) {
          cep = postalCode.long_name;
        }
      }

      // Formatar horário de funcionamento
      let horarioFuncionamento = '';
      if (place.opening_hours && place.opening_hours.weekday_text) {
        // Pegar apenas o horário de segunda-feira como exemplo
        const mondayHours = place.opening_hours.weekday_text.find(
          text => text.toLowerCase().includes('segunda') || text.toLowerCase().includes('monday')
        );
        if (mondayHours) {
          // Extrair apenas o horário (ex: "08:00 - 17:00")
          const hoursMatch = mondayHours.match(/\d{1,2}:\d{2}\s*[–-]\s*\d{1,2}:\d{2}/);
          if (hoursMatch) {
            horarioFuncionamento = hoursMatch[0].replace(/[–]/g, '-');
          }
        }
      }

      // Criar objeto com os dados do lugar
      const placeData: PlaceResult = {
        nome: place.name || '',
        endereco: place.formatted_address || '',
        cep: cep,
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
        telefone: place.formatted_phone_number || undefined,
        horarioFuncionamento: horarioFuncionamento || undefined,
        email: place.website ? undefined : undefined // Email não é fornecido diretamente pela API
      };

      // Se não tiver CEP, tentar geocodificação reversa
      if (!cep && place.geometry.location) {
        try {
          const geocoder = new google.maps.Geocoder();
          const response = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
            geocoder.geocode(
              { location: place.geometry!.location },
              (results, status) => {
                if (status === 'OK' && results && results.length > 0) {
                  resolve(results);
                } else {
                  reject(new Error('Geocodificação reversa falhou'));
                }
              }
            );
          });

          // Procurar CEP na resposta
          for (const result of response) {
            if (result.address_components) {
              const postalCode = result.address_components.find(
                component => component.types.includes('postal_code')
              );
              if (postalCode) {
                placeData.cep = postalCode.long_name;
                break;
              }
            }
          }
        } catch (error) {
          console.warn('Erro ao buscar CEP por geocodificação reversa:', error);
        }
      }

      onPlaceSelected(placeData);
      toast.success('Dados do estabelecimento preenchidos automaticamente!');
      
      // Limpar o campo após seleção
      setSearchQuery('');
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    } catch (error) {
      console.error('Erro ao processar dados do lugar:', error);
      toast.error('Erro ao processar informações do estabelecimento');
    } finally {
      setIsSearching(false);
    }
  };

  // Função alternativa de busca por texto (para fallback)
  const searchByText = async (query: string) => {
    if (!placeServiceRef.current) {
      toast.error('Serviço de busca não disponível');
      return;
    }

    setIsSearching(true);

    const request = {
      query: query,
      fields: [
        'name',
        'formatted_address',
        'geometry',
        'formatted_phone_number',
        'opening_hours',
        'address_components',
        'place_id'
      ],
      locationBias: {
        // Centro aproximado de Brasília/DF
        center: { lat: -15.7801, lng: -47.9292 },
        radius: 50000 // 50km de raio
      }
    };

    placeServiceRef.current.findPlaceFromQuery(request, (results, status) => {
      setIsSearching(false);
      
      if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
        // Se encontrou resultado, obter detalhes completos
        const placeId = results[0].place_id;
        if (placeId) {
          getPlaceDetails(placeId);
        }
      } else {
        toast.error('Nenhum estabelecimento encontrado');
      }
    });
  };

  const getPlaceDetails = (placeId: string) => {
    if (!placeServiceRef.current) return;

    const request = {
      placeId: placeId,
      fields: [
        'name',
        'formatted_address',
        'geometry',
        'formatted_phone_number',
        'opening_hours',
        'website',
        'address_components'
      ]
    };

    placeServiceRef.current.getDetails(request, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && place) {
        // Processar o lugar selecionado
        if (autocompleteRef.current) {
          // Simular seleção no autocomplete
          const event = new Event('place_changed');
          autocompleteRef.current.set('place', place);
          handlePlaceSelection();
        }
      }
    });
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="places-search" className="flex items-center gap-2">
        <Search className="h-4 w-4 text-blue-600" />
        {label}
      </Label>
      <div className="relative">
        <Input
          ref={inputRef}
          id="places-search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || isSearching}
          className="pr-10"
          data-testid="input-places-search"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Comece a digitar para buscar estabelecimentos no Google Maps
      </p>
    </div>
  );
};