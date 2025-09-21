import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface HealthChartProps {
  data: {
    especialidades: Array<{ name: string; total: number; color: string }>;
    necessidades: Array<{ name: string; pacientes: number; color: string }>;
    tiposEquipamentos: Array<{ name: string; count: number; color: string }>;
    distribuicaoIdade: Array<{ faixa: string; count: number; color: string }>;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

export const HealthChart = ({ data }: HealthChartProps) => {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Especialidades Médicas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Especialidades Disponíveis nas UBS</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.especialidades}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#2563eb" name="Unidades" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Necessidades de Saúde dos Pacientes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Necessidades de Saúde dos Pacientes</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.necessidades}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="pacientes"
              >
                {data.necessidades.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tipos de Equipamentos Sociais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Equipamentos Sociais por Tipo</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.tiposEquipamentos} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={120} fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#10b981" name="Quantidade" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Distribuição por Faixa Etária */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Distribuição dos Pacientes por Idade</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.distribuicaoIdade}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="count"
              >
                {data.distribuicaoIdade.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};