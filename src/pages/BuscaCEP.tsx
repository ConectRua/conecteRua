import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Phone, Clock } from 'lucide-react';

const BuscaCEP = () => {
  const [cep, setCep] = useState('');
  
  const mockResults = [
    {
      id: 1,
      name: "UBS Central",
      type: "UBS",
      address: "Rua das Flores, 123 - Centro",
      phone: "(11) 1234-5678",
      distance: "0.5 km",
      hours: "07:00 - 17:00"
    },
    {
      id: 2,
      name: "Instituto Esperança",
      type: "ONG",
      address: "Av. Principal, 456 - Centro",
      phone: "(11) 9876-5432",
      distance: "0.8 km",
      hours: "08:00 - 18:00"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Busca por CEP</h1>
        <p className="text-muted-foreground">
          Encontre UBS e ONGs próximas a um endereço específico
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Localizar Serviços
          </CardTitle>
          <CardDescription>
            Digite o CEP para encontrar serviços de saúde e assistência próximos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Digite o CEP (ex: 12345-678)"
              value={cep}
              onChange={(e) => setCep(e.target.value)}
              className="flex-1"
            />
            <Button>
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Resultados da Busca</h2>
        
        {mockResults.map((result) => (
          <Card key={result.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold">{result.name}</h3>
                    <Badge variant={result.type === 'UBS' ? 'default' : 'secondary'}>
                      {result.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm mb-2">
                    <MapPin className="h-4 w-4" />
                    {result.address}
                  </div>
                </div>
                <span className="text-sm font-medium text-primary">{result.distance}</span>
              </div>
              
              <div className="grid gap-2 md:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {result.phone}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {result.hours}
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button size="sm">Ver Detalhes</Button>
                <Button size="sm" variant="outline">Como Chegar</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BuscaCEP;