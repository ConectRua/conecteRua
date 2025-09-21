# Plano de Migração: Mock Data → Backend Real com PostgreSQL

## 📋 Status Atual

### ✅ O que já temos implementado:
- **Frontend completo** com React + TypeScript + shadcn/ui
- **Sistema de autenticação** com Passport.js configurado
- **Interface de storage** abstrata (`IStorage`) em `server/storage.ts`
- **Implementação mock** (`MemStorage`) funcional
- **Rotas de API** básicas protegidas por autenticação
- **Dependências instaladas**: Express, Passport, PostgreSQL drivers, session management

### ⚠️ O que precisa ser migrado:
- **Dados mock** → Banco PostgreSQL real
- **MemStorage** → PostgreSQL Storage 
- **Session em memória** → Session persistente
- **Validação de geocodificação** mock → APIs reais

---

## 🎯 Objetivos da Migração

### Funcionalidades Principais:
1. **Autenticação persistente** com sessões em banco
2. **CRUD completo** para UBS, ONGs, Pacientes, Equipamentos Sociais
3. **Geocodificação real** com APIs Nominatim/ViaCEP
4. **Upload e processamento** de planilhas Excel/CSV
5. **Auditoria e logs** de todas operações

---

## 🗂️ Estrutura de Banco PostgreSQL

### 1. Esquema de Usuários (já definido em `shared/schema.ts`)
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Esquema de Dados Georreferenciados
```sql
-- Extensão PostGIS para geolocalização
CREATE EXTENSION IF NOT EXISTS postgis;

-- UBS (Unidades Básicas de Saúde)
CREATE TABLE ubs (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  endereco TEXT NOT NULL,
  cep VARCHAR(10) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  geom GEOMETRY(POINT, 4326), -- PostGIS para cálculos geográficos
  telefone VARCHAR(20),
  email VARCHAR(255),
  horario_funcionamento TEXT,
  especialidades TEXT[],
  gestor VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ONGs
CREATE TABLE ongs (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  endereco TEXT NOT NULL,
  cep VARCHAR(10) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  geom GEOMETRY(POINT, 4326),
  telefone VARCHAR(20),
  email VARCHAR(255),
  site VARCHAR(255),
  servicos TEXT[],
  responsavel VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Pacientes
CREATE TABLE pacientes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  endereco TEXT NOT NULL,
  cep VARCHAR(10) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  geom GEOMETRY(POINT, 4326),
  telefone VARCHAR(20),
  idade INTEGER,
  condicoes_saude TEXT[],
  ubs_mais_proxima_id INTEGER REFERENCES ubs(id),
  distancia_ubs DECIMAL(8, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Equipamentos Sociais
CREATE TABLE equipamentos_sociais (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(100) NOT NULL, -- CRAS, CAPS, Conselho Tutelar, etc.
  endereco TEXT NOT NULL,
  cep VARCHAR(10) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  geom GEOMETRY(POINT, 4326),
  telefone VARCHAR(20),
  email VARCHAR(255),
  horario_funcionamento TEXT,
  servicos TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Auditoria de operações
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(50) NOT NULL,
  record_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔧 Plano de Implementação

### FASE 1: Configuração de Banco (2-3 horas)

#### 1.1 Configurar PostgreSQL no Replit ✅
```bash
# Usar ferramenta create_postgresql_database_tool
# Configurará automaticamente: DATABASE_URL, PGPORT, PGUSER, etc.
```

#### 1.2 Instalar Dependências PostgreSQL 
**Pacotes necessários** (já instalados no package.json):
- `connect-pg-simple`: Session store para PostgreSQL
- Tipos TypeScript para PostgreSQL

#### 1.3 Criar Migrations
**Arquivo**: `server/migrations/001_initial_schema.sql`
- Implementar todo o esquema acima
- Função para inserir dados iniciais mock

#### 1.4 Script de Migração
**Arquivo**: `server/migrate.ts`
- Executar migrations automáticamente
- Verificar conexão com banco
- Popular dados iniciais

---

### FASE 2: Implementação PostgreSQL Storage (4-5 horas)

#### 2.1 Criar PostgreSQLStorage
**Arquivo**: `server/postgres-storage.ts`
```typescript
export class PostgreSQLStorage implements IStorage {
  private pool: Pool;
  public sessionStore: session.SessionStore;
  
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    this.sessionStore = new ConnectPgSession(session)({
      pool: this.pool,
      createTableIfMissing: true
    });
  }
  
  // Implementar todos os métodos da interface IStorage
  async getUserByUsername(username: string): Promise<User | null> { ... }
  async createUser(user: InsertUser): Promise<User> { ... }
  async getUBSList(): Promise<UBS[]> { ... }
  async createUBS(ubs: InsertUBS): Promise<UBS> { ... }
  async updateUBS(id: number, ubs: Partial<UBS>): Promise<UBS | null> { ... }
  async deleteUBS(id: number): Promise<boolean> { ... }
  // ... demais métodos CRUD
}
```

#### 2.2 Atualizar Interface IStorage
**Arquivo**: `server/storage.ts`
- Adicionar métodos CRUD completos para todas entidades
- Métodos de busca geográfica com PostGIS
- Métodos de auditoria

#### 2.3 Configurar Troca de Storage
**Arquivo**: `server/storage.ts`
```typescript
// Permitir alternar entre Mock e PostgreSQL
export const storage: IStorage = process.env.NODE_ENV === 'development' 
  ? new MemStorage()  // Para desenvolvimento rápido
  : new PostgreSQLStorage(); // Para produção
```

---

### FASE 3: APIs CRUD Completas (3-4 horas)

#### 3.1 Expandir Rotas de API
**Arquivo**: `server/routes.ts`
- Implementar endpoints POST, PUT, DELETE para todas entidades
- Validação com schemas Zod
- Tratamento de erros padronizado
- Logs de auditoria automáticos

#### 3.2 Endpoints Geográficos
**Novos endpoints**:
- `POST /api/geocode` - Converter endereço em coordenadas
- `GET /api/nearby/:lat/:lng/:radius` - Buscar serviços próximos
- `GET /api/distances/:patientId` - Calcular distâncias para UBS

#### 3.3 Upload de Planilhas
**Novo endpoint**:
- `POST /api/upload/planilha` - Processar Excel/CSV
- Validação de colunas obrigatórias
- Geocodificação em lote
- Relatório de importação

---

### FASE 4: Geocodificação Real (2-3 horas)

#### 4.1 Serviço de Geocodificação
**Arquivo**: `server/services/geocoding.ts`
```typescript
export class GeocodingService {
  async geocodeAddress(address: string, cep: string): Promise<Coordinates> {
    // 1. Tentar Nominatim API (gratuita)
    // 2. Fallback para ViaCEP
    // 3. Cache de resultados
  }
  
  async batchGeocode(addresses: Address[]): Promise<GeocodeResult[]> {
    // Geocodificação em lote para importação
  }
}
```

#### 4.2 Cache de Geocodificação
**Tabela**: `geocoding_cache`
```sql
CREATE TABLE geocoding_cache (
  id SERIAL PRIMARY KEY,
  address_hash VARCHAR(64) UNIQUE NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  source VARCHAR(20), -- 'nominatim' ou 'viacep'
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### FASE 5: Frontend → Backend Integration (2-3 horas)

#### 5.1 Atualizar React Query
**Arquivo**: `client/src/lib/queryClient.ts`
- Configurar mutations para CRUD operations
- Invalidação de cache otimizada
- Tratamento de erros do backend

#### 5.2 Remover useMockData Hook
**Arquivo**: `client/src/hooks/useMockData.tsx`
- Substituir por chamadas reais de API
- Manter interface idêntica para não quebrar componentes
- Migração gradual componente por componente

#### 5.3 Atualizar Formulários
**Arquivos**: `client/src/pages/*.tsx`
- Conectar formulários às APIs reais
- Adicionar geocodificação automática
- Feedback de upload de planilhas

---

### FASE 6: Autenticação Production-Ready (1-2 horas)

#### 6.1 Session Store PostgreSQL
**Já configurado** com `connect-pg-simple`:
- Sessions persistem no banco
- Auto-cleanup de sessions expiradas
- Suporte a múltiplas instâncias do servidor

#### 6.2 Variáveis de Ambiente
**Arquivo**: `.env` (usar ask_secrets se necessário)
```bash
DATABASE_URL=postgresql://user:pass@host:port/dbname
SESSION_SECRET=random-secret-key-production
NODE_ENV=production
NOMINATIM_API_URL=https://nominatim.openstreetmap.org/search
VIACEP_API_URL=https://viacep.com.br/ws
```

---

## 📊 Dependências e Recursos

### Pacotes Já Instalados ✅
- `express`: Web framework
- `passport` + `passport-local`: Autenticação
- `express-session`: Gerenciamento de sessões
- `connect-pg-simple`: PostgreSQL session store
- `cors`: Cross-origin requests
- `@types/*`: TypeScript definitions

### APIs Externas (Gratuitas)
- **Nominatim**: Geocodificação principal
- **ViaCEP**: Backup para CEPs brasileiros
- **Google Maps**: Frontend (já integrado)

### Ferramentas Replit
- **PostgreSQL Database**: Banco gerenciado
- **Environment Variables**: Secrets management
- **Workflow**: Auto-deploy nas mudanças

---

## ⚡ Ordem de Execução Recomendada

### Preparação (30min)
1. ✅ Criar banco PostgreSQL com `create_postgresql_database_tool`
2. ✅ Configurar variáveis de ambiente
3. ✅ Testar conexão

### Implementação Core (6-8h)
1. 🔄 Criar migrations e esquema do banco
2. 🔄 Implementar `PostgreSQLStorage` class
3. 🔄 Expandir rotas API com CRUD completo
4. 🔄 Implementar geocodificação real

### Frontend Integration (3-4h)
1. 🔄 Atualizar `queryClient` com APIs reais
2. 🔄 Migrar componente por componente
3. 🔄 Testar todas funcionalidades
4. 🔄 Ajustar tratamento de erros

### Finalização (1-2h)
1. 🔄 Configurar session store PostgreSQL
2. 🔄 Implementar logs de auditoria
3. 🔄 Testes de carga básicos
4. 🔄 Documentação de API

---

## 🚀 Benefícios Esperados

### Performance
- **Dados persistentes** entre sessões
- **Cache de geocodificação** para consultas repetidas
- **Consultas geográficas otimizadas** com PostGIS

### Confiabilidade
- **Backup automático** do banco
- **Sessions persistentes** mesmo com restart
- **Auditoria completa** de todas operações

### Escalabilidade
- **Multiple instances** support
- **Geographic indexing** para consultas rápidas
- **Bulk operations** para importação de planilhas

---

## 📝 Notas Importantes

### Compatibilidade
- **Zero downtime migration**: Frontend continuará funcionando durante migração
- **Fallback graceful**: Se algo falhar, volta para mock temporariamente
- **Progressive migration**: Migrar módulo por módulo

### Segurança
- **Password hashing** já implementado com scrypt
- **SQL injection protection** com queries parametrizadas
- **Session security** com PostgreSQL store
- **Input validation** com schemas Zod

### Manutenção
- **Database migrations** versionadas
- **Backup strategy** automática do Replit
- **Monitoring** através de logs estruturados
- **Error tracking** padronizado

---

## 📋 Checklist de Execução

### ☐ Fase 1: Database Setup
- [ ] Criar banco PostgreSQL 
- [ ] Configurar variáveis de ambiente
- [ ] Executar migrations iniciais
- [ ] Testar conexão e queries básicas

### ☐ Fase 2: Backend Implementation  
- [ ] Implementar PostgreSQLStorage class
- [ ] Atualizar interface IStorage
- [ ] Criar métodos CRUD completos
- [ ] Implementar auditoria

### ☐ Fase 3: API Enhancement
- [ ] Expandir rotas com CRUD
- [ ] Adicionar endpoints geográficos
- [ ] Implementar upload de planilhas
- [ ] Configurar validação e errors

### ☐ Fase 4: Geocoding Integration
- [ ] Implementar GeocodingService
- [ ] Configurar cache de geocodificação
- [ ] Integrar Nominatim + ViaCEP
- [ ] Testar geocodificação em lote

### ☐ Fase 5: Frontend Migration
- [ ] Atualizar React Query configuration
- [ ] Migrar useMockData para APIs reais
- [ ] Atualizar formulários e componentes
- [ ] Testar todas as telas

### ☐ Fase 6: Production Ready
- [ ] Configurar session store PostgreSQL
- [ ] Implementar logs estruturados
- [ ] Configurar variáveis de produção
- [ ] Testes de integração final

---

**Tempo estimado total: 12-15 horas**
**Prioridade: Alta - Base crítica para produção**
**Risco: Baixo - Migração incremental com fallbacks**