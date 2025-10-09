# Plano de Desenvolvimento - Sistema de Georreferenciamento ConecteRua

## 📋 Visão Geral do Projeto
Sistema de georreferenciamento para assistência social e saúde em Samambaia, Recanto das Emas e Águas Claras. 
Aplicação web completa para mapeamento de unidades de saúde (UBS), ONGs e pacientes, com pareamento inteligente baseado em proximidade geográfica.

---

## ✅ FUNCIONALIDADES IMPLEMENTADAS

### 🔐 **Fase 1: Sistema de Autenticação (100% Completo)**
- [x] Autenticação local com Passport.js
- [x] Sistema de login/logout
- [x] Cadastro de novos usuários 
- [x] Sessões persistentes com PostgreSQL (connect-pg-simple)
- [x] Segurança hardened em produção (cookies seguros, session regeneration)
- [x] Email verification flow (auto-verificado em dev, obrigatório em prod)
- [x] Audit logging com JSON estruturado
- [x] Prevenção de session fixation
- [x] XSS e CSRF protection

### 🗺️ **Fase 2: Mapa Interativo (100% Completo)**
- [x] Integração com Google Maps API
- [x] Visualização de múltiplas camadas (UBS, ONGs, Pacientes)
- [x] Marcadores customizados por tipo de entidade
- [x] Modo de edição para reposicionar marcadores
- [x] Info windows com informações detalhadas
- [x] Toggle de camadas do mapa
- [x] Conversão automática string → número para coordenadas (bug fix aplicado)

### 🏥 **Fase 3: CRUD Completo de Entidades (100% Completo)**

#### **UBS (Unidades Básicas de Saúde)**
- [x] Cadastro com campos: nome, endereço, CEP, telefone, horário funcionamento
- [x] Lista de especialidades médicas disponíveis
- [x] Coordenadas GPS (latitude/longitude)
- [x] Edição e exclusão
- [x] Visualização em lista e cards

#### **ONGs**
- [x] Cadastro com campos: nome, tipo, endereço, CEP, telefone
- [x] Serviços oferecidos
- [x] Coordenadas GPS
- [x] CRUD completo

#### **Pacientes**
- [x] Ficha de avaliação multiprofissional completa com 80+ campos
- [x] Identificação completa (nome, nome social, naturalidade, etc)
- [x] Dados demográficos (identidade de gênero, cor/raça, orientação sexual)
- [x] Sinais vitais (PA, FC, FR, temperatura, peso, glicemia)
- [x] Testes rápidos (HIV, Hepatites, Sífilis, gravidez)
- [x] Padrão de uso de substâncias
- [x] Histórico familiar de doenças
- [x] Exame físico completo (cabeça, tórax, abdome, MMII)
- [x] Evolução e observações
- [x] Conversão automática de datas ISO → Date object (bug fix aplicado)

#### **Equipamentos Sociais**
- [x] CRUD básico implementado
- [x] Integração com mapa

### 📊 **Fase 4: Dashboard e Estatísticas (100% Completo)**
- [x] Endpoint `/api/estatisticas` com métricas completas
- [x] Total de entidades cadastradas (UBS, ONGs, Pacientes)
- [x] Pacientes vinculados a UBS
- [x] Cobertura por região
- [x] Distância média paciente-UBS
- [x] Visualização em cards no dashboard

### 📍 **Fase 5: Sistema de Geocodificação (100% Completo - Atualizado para Google Maps API)**

#### **Geocodificação Direta (CEP → Coordenadas)**
- [x] Integração com API ViaCEP para buscar endereço por CEP
- [x] **ATUALIZADO: Integração com Google Geocoding API para maior precisão (substituiu Nominatim)**
- [x] Cache em memória para otimização
- [x] Cache persistente no banco de dados
- [x] Fallback: ViaCEP → Google Geocoding para confiabilidade
- [x] Rate limiting para respeitar limites das APIs
- [x] Debounce de 1.5 segundos nas requisições

#### **Geocodificação Reversa (Coordenadas → CEP)**  
- [x] Endpoint `/api/geocode/reverse` implementado
- [x] Busca CEP a partir de latitude/longitude
- [x] **ATUALIZADO: Integração com Google Reverse Geocoding (substituiu Nominatim)**
- [x] Extração precisa de componentes do endereço (rua, número, bairro, CEP)
- [x] Cache duplo (memória + banco)
- [x] Debounce de 2 segundos
- [x] Request ID para cancelamento de requisições antigas
- [x] Toast notifications para feedback visual

#### **Integração no Formulário de Pacientes**
- [x] Auto-preenchimento bidirecional implementado
- [x] Digite CEP → preenche automaticamente coordenadas
- [x] Use GPS → preenche automaticamente CEP e endereço
- [x] Modifique coordenadas → busca CEP correspondente
- [x] Botão "Usar Localização Atual" com Capacitor Geolocation
- [x] Indicadores visuais de carregamento
- [x] Mensagens de erro e sucesso via toast

### 📅 **Fase 6: Agenda e Atendimentos (100% Completo)**

#### **Sistema de Agendamento**
- [x] Página de Agenda com 3 abas (Hoje, Próximos 7 dias, Calendário)
- [x] Filtro por equipe/região
- [x] Cards de pacientes com informações resumidas
- [x] Sistema de atendimento (Próximo/Último)
- [x] Persistência de datas no banco

#### **Calendário Mensal Completo**
- [x] Visualização em grid 7×6 (42 dias)
- [x] Navegação por mês (anterior/próximo)
- [x] Indicadores visuais (pontos azul/verde para próximo/último)
- [x] Seleção de dia para ver lista detalhada
- [x] Sidebar responsiva com lista de pacientes do dia
- [x] Localização pt-BR com date-fns
- [x] Performance otimizada com useMemo
- [x] Data-testid completo para testes

### 📁 **Fase 7: Importação de Dados (100% Completo)**
- [x] Upload de planilhas Excel/CSV
- [x] Preview dos dados antes de importar
- [x] Detecção automática do tipo de dados
- [x] Mapeamento de colunas flexível
- [x] Validação de dados antes da importação
- [x] Geocodificação em lote para endereços
- [x] Relatório de importação com sucessos/erros

### 🔍 **Fase 8: Busca e Filtros (100% Completo)**
- [x] Busca global no header
- [x] Filtros por tipo de entidade
- [x] Filtros por região/bairro
- [x] Ordenação de resultados

### 📱 **Fase 9: Mobile Support (100% Completo)**
- [x] Design responsivo com Tailwind CSS
- [x] Capacitor configurado para Android/iOS
- [x] Geolocalização nativa
- [x] Menu mobile hambúrguer
- [x] Touch-friendly interface

---

## 🚧 FUNCIONALIDADES PENDENTES OU PARCIAIS

### 📋 **Gestão de Orientações (0% - Não Iniciado)**
- [ ] Sistema de orientações médicas/sociais
- [ ] Templates de orientações
- [ ] Histórico de orientações por paciente
- [ ] Impressão de orientações

### 🏥 **Vinculação Paciente-UBS (50% - Parcial)**
- [x] Cálculo de distância implementado
- [x] Endpoint `/api/pacientes/:id/distancias-ubs`
- [ ] Interface para vincular paciente a UBS
- [ ] Sugestão automática da UBS mais próxima
- [ ] Histórico de vinculações

### 📊 **Relatórios Avançados (20% - Básico)**
- [x] Estatísticas básicas no dashboard
- [ ] Relatórios por período
- [ ] Gráficos interativos (Recharts parcialmente configurado)
- [ ] Exportação PDF
- [ ] Relatórios de produtividade por equipe

### 🔔 **Sistema de Notificações (0% - Não Iniciado)**
- [ ] Notificações de novos pacientes
- [ ] Lembretes de atendimento
- [ ] Alertas de pacientes em situação de risco
- [ ] Notificações push (mobile)

### 👥 **Gestão de Equipes (0% - Não Iniciado)**
- [ ] Cadastro de profissionais
- [ ] Atribuição de equipes
- [ ] Escalas de atendimento
- [ ] Permissões por equipe

### 🔄 **Sincronização Offline (0% - Não Iniciado)**
- [ ] Service Worker para cache offline
- [ ] Fila de sincronização
- [ ] Resolução de conflitos
- [ ] Indicador de status online/offline

---

## 🎯 MELHORIAS E OTIMIZAÇÕES REALIZADAS

### **Geocodificação com Google Maps API (30/09/2025)**
- ✅ **Migração de Nominatim para Google Geocoding API**
- ✅ **Precisão melhorada**: Coordenadas exatas para endereços no DF
- ✅ **Fluxo otimizado**: ViaCEP → Google Geocoding → Google Maps
- ✅ **Testes validados**: 
  - Ceilândia (72210-180): -15.8141796, -48.0980437
  - Samambaia (72302-103): -15.8710784, -48.0775651
  - Reverse geocoding funcionando com extração completa de componentes

### Performance
- ✅ Cache duplo no sistema de geocodificação (memória + banco)
- ✅ Debounce em requisições de geocodificação
- ✅ Memoização de cálculos no calendário
- ✅ React Query para cache de dados da API
- ✅ Lazy loading de componentes

### Segurança
- ✅ Session management com PostgreSQL
- ✅ Cookies seguros (httpOnly, sameSite, secure)
- ✅ Prevenção XSS/CSRF
- ✅ Rate limiting em APIs externas
- ✅ Validação Zod em todos os endpoints
- ✅ Audit logging estruturado

### UX/UI
- ✅ Toast notifications para feedback
- ✅ Loading states em todas operações assíncronas
- ✅ Skeleton loaders
- ✅ Formulários com validação em tempo real
- ✅ Dark mode preparado (estrutura pronta)
- ✅ Responsividade completa

### Correções de Bugs
- ✅ **MapComponent**: Conversão string → number para coordenadas (corrigido InvalidValueError)
- ✅ **PatientForm**: Conversão de datas ISO → Date objects no servidor
- ✅ **Geocoding**: Tratamento de CEPs inválidos ou não encontrados
- ✅ **Session**: Regeneração de sessão após login (prevenção fixation)

---

## 📈 MÉTRICAS DO SISTEMA

- **Total de Tabelas no Banco**: 8 (users, ubs, ongs, pacientes, equipamentos_sociais, sessions, geocoding_cache, audit_log)
- **Total de Endpoints API**: 30+
- **Componentes React**: 50+
- **Cobertura de Testes**: Data-testid em todos elementos interativos
- **Pacientes Cadastrados**: 12 (com dados reais de teste)
- **Precisão Geocodificação**: ~2km para endereços do DF

---

## 🔮 PRÓXIMOS PASSOS RECOMENDADOS

1. **Prioridade Alta**:
   - Implementar vinculação visual paciente-UBS
   - Adicionar interface para gestão de orientações
   - Melhorar precisão da geocodificação com API do Google

2. **Prioridade Média**:
   - Desenvolver relatórios com gráficos
   - Implementar sistema de notificações básico
   - Adicionar gestão de equipes

3. **Prioridade Baixa**:
   - Sincronização offline
   - Notificações push mobile
   - Integração com sistemas externos (SUS, e-SUS)

---

## 🛠️ STACK TECNOLÓGICA

**Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui, React Router, React Query, React Hook Form

**Backend**: Node.js, Express, Passport.js, Drizzle ORM

**Banco de Dados**: PostgreSQL (Neon)

**APIs**: Google Maps, ViaCEP, Nominatim (OpenStreetMap)

**Mobile**: Capacitor (Android/iOS)

**Ferramentas**: Vite, ESLint, date-fns, Zod

---

*Última atualização: 30 de Setembro de 2025*