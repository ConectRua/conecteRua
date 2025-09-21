PRD - Sistema de Georreferenciamento da Rede de Assistência Social e Saúde (v2)
1. Visão do Produto
Sistema web responsivo para mapear e conectar pacientes aos serviços de assistência social e saúde em Samambaia, Recanto das Emas e Águas Claras, otimizando o acesso aos cuidados através de geolocalização.
3. Funcionalidades Core
3.1 Mapeamento da Rede
Cadastro manual de UBS com CEP/coordenadas
Cadastro de ONGs e instituições filantrópicas
Importação via planilhas Excel/CSV
Web scraping de sites públicos
3.2 Gestão de Pacientes
Importação de lista de pacientes com endereços
Geocodificação automática de endereços
Pareamento automático paciente-UBS por proximidade
Busca manual por CEP/endereço
3.3 Interface Web
Dashboard para visualização do mapa
Filtros por tipo de serviço
Busca por CEP/endereço
Exportação de relatórios
4. Especificações Técnicas
4.1 Ferramenta de Georreferenciamento
Recomendação: OpenStreetMap + Leaflet + Nominatim API
Vantagens: Gratuito, sem limites de uso
Geocodificação: API Nominatim (gratuita)
Backup: ViaCEP para CEPs brasileiros
4.2 Stack Tecnológica
Frontend: React.js + Tailwind CSS
Backend: Node.js + Express
Banco: PostgreSQL + PostGIS
Hospedagem: Vercel (frontend) + Railway (backend)
5. Estratégias de Alimentação
5.1 Dados Iniciais
Cadastro Manual: Interface para equipe cadastrar UBS e serviços
Importação: Upload de planilhas Excel/CSV existentes
Web Scraping: Sites públicos da Secretaria e SES-DF
Crowdsourcing: Equipe local valida e complementa dados
5.2 Fontes de Dados
Planilhas internas da assistência social
Sites institucionais públicos
Cadastro manual pela equipe
Validação por conhecimento local
6. Funcionalidades de Entrada de Dados
6.1 Interface de Cadastro
Formulário web para UBS/ONGs/instituições
Upload em lote via planilhas
Validação automática de CEPs
Geocodificação em tempo real
6.2 Validação de Dados
Verificação automática de coordenadas
Review manual pela equipe
Sistema de flags para dados suspeitos
Histórico de alterações
Tarefas para Implementação por Fases
FASE 1 - Infraestrutura Base
Backend
Configurar PostgreSQL com extensão PostGIS
Estruturar API REST com Express.js
Implementar modelos de dados (UBS, ONGs, Pacientes, Endereços)
Configurar autenticação básica
Deploy inicial no Railway
Frontend
Setup React.js + Tailwind CSS
Estrutura de rotas e componentes base
Layout responsivo principal
Deploy inicial no Vercel
Geocodificação
Integrar Nominatim API para geocodificação
Implementar fallback com ViaCEP
Criar serviço de validação de coordenadas
FASE 2 - Cadastro e Gestão
Cadastro Manual
Interface para cadastro de UBS/ONGs
Formulários com validação em tempo real
Geocodificação automática por CEP
Sistema de review/aprovação
Importação de Dados
Upload e processamento de planilhas Excel/CSV
Validação e limpeza automática de dados
Interface para resolução de conflitos
Logs de importação
Gestão de Pacientes
Importação de listas de pacientes
Pareamento automático por proximidade
Interface de busca e filtros
FASE 3 - Visualização e Mapa (2 semanas)
Dashboard Principal
Mapa interativo com Leaflet
Marcadores para UBS/ONGs/Pacientes
Filtros por tipo de serviço
Informações detalhadas em popups
Funcionalidades do Mapa
Busca por CEP/endereço
Cálculo de rotas e distâncias
Layers toggleáveis
Zoom automático por região
FASE 4 - Recursos Avançados
Web Scraping
Scripts para coleta de dados públicos
Agendamento automático de atualizações
Detecção de novos serviços
Relatórios e Exportação
Geração de relatórios em PDF/Excel
Estatísticas de cobertura por região
Métricas de distância média
Dashboards analíticos
FASE 5 - Otimização e Deploy Final 
Performance
Cache de geocodificação
Otimização de consultas
Compressão de assets
Monitoramento
Testes e Documentação
Testes automatizados
Manual de usuário
Documentação técnica
Treinamento da equipe
graph TD
    A[Página Inicial] --> B{Login/Acesso}
    
    B --> C[Dashboard Principal]
    
    C --> D[Visualização do Mapa]
    C --> E[Gestão de Dados]
    C --> F[Relatórios]
    
    %% Fluxo do Mapa
    D --> D1[Mapa Interativo]
    D1 --> D2[Filtros por Serviço]
    D1 --> D3[Busca por CEP/Endereço]
    D2 --> D1
    D3 --> D4[Resultado da Busca]
    D4 --> D5[Detalhes da UBS/Serviço]
    D5 --> D6[Pareamento com Pacientes]
    
    %% Fluxo de Gestão
    E --> E1{Tipo de Cadastro}
    
    E1 --> E2[Cadastro Manual]
    E2 --> E2a[Form UBS/ONG]
    E2a --> E2b[Validação CEP]
    E2b --> E2c[Geocodificação Auto]
    E2c --> E2d[Confirmação]
    E2d --> C
    
    E1 --> E3[Import Planilha]
    E3 --> E3a[Upload Excel/CSV]
    E3a --> E3b[Validação Dados]
    E3b --> E3c[Review Manual]
    E3c --> E3d[Aprovação/Correção]
    E3d --> C
    
    E1 --> E4[Web Scraping]
    E4 --> E4a[Sites Públicos SES-DF]
    E4a --> E4b[Extração Automática]
    E4b --> E4c[Validação Equipe]
    E4c --> C
    
    %% Fluxo de Pacientes
    E --> E5[Gestão Pacientes]
    E5 --> E5a[Import Lista Pacientes]
    E5a --> E5b[Geocodificação Endereços]
    E5b --> E5c[Pareamento Auto UBS]
    E5c --> E5d[Review Pareamentos]
    E5d --> C
    
    E5 --> E5e[Busca Manual Paciente]
    E5e --> E5f[CEP/Endereço]
    E5f --> E5g[UBS Mais Próxima]
    E5g --> D5
    
    %% Fluxo de Relatórios
    F --> F1[Configurar Filtros]
    F1 --> F2[Gerar Relatório]
    F2 --> F3[Visualizar/Exportar]
    F3 --> C
    
    %% Estados de Erro/Validação
    E2b --> E2e[Erro CEP]
    E2e --> E2a
    E3b --> E3e[Dados Inválidos]
    E3e --> E3a
    
    style A fill:#e1f5fe
    style C fill:#f3e5f5
    style D1 fill:#e8f5e8
    style E2d fill:#fff3e0
    style E3d fill:#fff3e0
