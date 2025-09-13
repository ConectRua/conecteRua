import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { useMockData, type Paciente } from '@/hooks/useMockData';
import { toast } from 'sonner';

const patientSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cns: z.string().min(15, 'CNS deve ter 15 dígitos').max(15, 'CNS deve ter 15 dígitos'),
  endereco: z.string().min(5, 'Endereço é obrigatório'),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
  telefone: z.string().min(10, 'Telefone é obrigatório'),
  idade: z.number().min(0).max(120),
  genero: z.enum(['M', 'F', 'Outro']),
  necessidades: z.array(z.string()).min(1, 'Selecione pelo menos uma necessidade'),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface PatientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const necessidadesOptions = [
  'Clínica Geral',
  'Pediatria',
  'Ginecologia',
  'Cardiologia',
  'Hipertensão',
  'Diabetes',
  'Pré-natal',
  'Saúde Mental',
  'Odontologia',
  'Check-up Geral',
  'Acompanhamento Nutricional'
];

export const PatientForm = ({ open, onOpenChange }: PatientFormProps) => {
  const { addPaciente } = useMockData();
  const [selectedNecessidades, setSelectedNecessidades] = useState<string[]>([]);

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      nome: '',
      cns: '',
      endereco: '',
      cep: '',
      telefone: '',
      idade: 0,
      genero: 'F',
      necessidades: [],
    },
  });

  const onSubmit = async (data: PatientFormData) => {
    try {
      // Simular coordenadas baseadas no CEP (em um app real, seria via API de geocoding)
      const mockCoordinates = {
        latitude: -15.8781 + (Math.random() - 0.5) * 0.1,
        longitude: -48.0958 + (Math.random() - 0.5) * 0.1,
      };

      const newPatient: Omit<Paciente, 'id'> = {
        nome: data.nome,
        cns: data.cns,
        endereco: data.endereco,
        cep: data.cep,
        telefone: data.telefone,
        idade: data.idade,
        genero: data.genero,
        necessidades: selectedNecessidades,
        ...mockCoordinates,
      };

      addPaciente(newPatient);
      toast.success('Paciente cadastrado com sucesso!');
      form.reset();
      setSelectedNecessidades([]);
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao cadastrar paciente');
    }
  };

  const handleNecessidadeChange = (necessidade: string, checked: boolean) => {
    if (checked) {
      setSelectedNecessidades(prev => [...prev, necessidade]);
    } else {
      setSelectedNecessidades(prev => prev.filter(n => n !== necessidade));
    }
    form.setValue('necessidades', selectedNecessidades);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Paciente</DialogTitle>
          <DialogDescription>
            Cadastre um novo paciente no sistema
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do paciente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cns"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cartão Nacional de Saúde (CNS)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="000000000000000" 
                        maxLength={15}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="endereco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Endereço completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="cep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <Input placeholder="00000-000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="idade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Idade</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="genero"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gênero</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o gênero" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="F">Feminino</SelectItem>
                      <SelectItem value="M">Masculino</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <Label className="text-sm font-medium">Necessidades de Saúde</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {necessidadesOptions.map((necessidade) => (
                  <div key={necessidade} className="flex items-center space-x-2">
                    <Checkbox
                      id={necessidade}
                      checked={selectedNecessidades.includes(necessidade)}
                      onCheckedChange={(checked) => 
                        handleNecessidadeChange(necessidade, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={necessidade}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {necessidade}
                    </Label>
                  </div>
                ))}
              </div>
              {form.formState.errors.necessidades && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.necessidades.message}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Cadastrar Paciente</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};