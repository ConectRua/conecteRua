// Migration script to initialize the PostgreSQL database
// Runs the initial setup and seeds data

import {db, pool} from "./db";
import {equipamentosSociais, ongs, pacientes, ubs, users} from "../shared/schema";
import {randomBytes, scrypt} from "crypto";
import {promisify} from "util";
import {migrate as runMigrations} from "drizzle-orm/node-postgres/migrator";
import {dirname, resolve} from "path";
import {fileURLToPath} from "url";

const scryptAsync = promisify(scrypt);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function migrate() {
  console.log("🚀 Starting database migration...");
  
  try {
    // Test database connection
    await pool.query("SELECT 1");
    console.log("✅ Database connected successfully");

    // Ensure schema migrations are applied before seeding data
    console.log("🏗️ Applying schema migrations...");
    await runMigrations(db, { migrationsFolder: resolve(__dirname, "./migrations") });
    console.log("✅ Schema migrations applied");
    
    // Create test users
    const hashedAdminPassword = await hashPassword("123456");
    const hashedUserPassword = await hashPassword("123456");
    
    console.log("📝 Creating test users...");
    
    const testUsers = await db.insert(users).values([
      {
        username: "admin",
        email: "admin@conecterua.org",
        password: hashedAdminPassword,
        isAdmin: true,
        emailVerified: true,
      },
      {
        username: "usuario",
        email: "usuario@conecterua.org",
        password: hashedUserPassword,
        isAdmin: false,
        emailVerified: true,
      }
    ]).onConflictDoNothing().returning();
    
    console.log(`✅ Created ${testUsers.length} test users`);
    if (testUsers.length === 0) {
      console.log("ℹ️  Test users already existed, skipped seeding users");
    }
    // Create initial UBS data
    console.log("🏥 Creating UBS data...");
    
    const ubsData = await db.insert(ubs).values([
      {
        nome: "UBS Samambaia Norte",
        endereco: "QR 425 Conjunto A - Samambaia Norte",
        cep: "72329-500",
        latitude: "-15.8747",
        longitude: "-48.0961",
        telefone: "(61) 3458-1234",
        email: "ubs.samambaia@saude.df.gov.br",
        horarioFuncionamento: "Segunda a Sexta: 7h às 17h",
        especialidades: ["Clínica Geral", "Pediatria", "Ginecologia"],
        gestor: "Dr. João Silva"
      },
      {
        nome: "UBS Recanto das Emas",
        endereco: "Quadra 104 Conjunto 5 - Recanto das Emas",
        cep: "72610-105",
        latitude: "-15.9058",
        longitude: "-48.0641",
        telefone: "(61) 3434-5678",
        email: "ubs.recanto@saude.df.gov.br",
        horarioFuncionamento: "Segunda a Sexta: 7h às 18h",
        especialidades: ["Clínica Geral", "Odontologia", "Enfermagem"],
        gestor: "Dra. Maria Santos"
      },
      {
        nome: "UBS Água Quente",
        endereco: "Rua Alecrim Lote 05 - Água Quente",
        cep: "71936-250",
        latitude: "-15.8359",
        longitude: "-48.0287",
        telefone: "(61) 3435-9012",
        email: "ubs.aguasclaras@saude.df.gov.br",
        horarioFuncionamento: "Segunda a Sexta: 7h às 17h",
        especialidades: ["Clínica Geral", "Pediatria", "Psicologia"],
        gestor: "Dr. Pedro Costa"
      }
    ]).returning();
    
    console.log(`✅ Created ${ubsData.length} UBS records`);
    
    // Create initial ONGs data
    console.log("🤝 Creating ONGs data...");
    
    const ongsData = await db.insert(ongs).values([
      {
        nome: "Instituto Vida Nova",
        endereco: "QR 301 Conjunto 2 - Samambaia Sul",
        cep: "72300-532",
        latitude: "-15.8827",
        longitude: "-48.0921",
        telefone: "(61) 3358-4567",
        email: "contato@vidanova.org.br",
        site: "www.vidanova.org.br",
        servicos: ["Apoio psicológico", "Distribuição de cestas básicas", "Cursos profissionalizantes"],
        responsavel: "Ana Paula Ferreira"
      },
      {
        nome: "Associação Mãos Solidárias",
        endereco: "Quadra 203 Lote 14 - Recanto das Emas",
        cep: "72620-203",
        latitude: "-15.9128",
        longitude: "-48.0581",
        telefone: "(61) 3434-8901",
        email: "maossolidarias@gmail.com",
        servicos: ["Reforço escolar", "Atividades esportivas", "Assistência jurídica"],
        responsavel: "Carlos Mendonça"
      }
    ]).returning();
    
    console.log(`✅ Created ${ongsData.length} ONG records`);
    
    // Create initial Pacientes data
    console.log("👥 Creating Pacientes data...");
    
    const pacientesData = await db.insert(pacientes).values([
      {
        nome: "Maria da Silva",
        endereco: "QR 401 Casa 15 - Samambaia",
        cep: "72329-401",
        latitude: "-15.8767",
        longitude: "-48.0941",
        telefone: "(61) 98765-4321",
        idade: 45,
        condicoesSaude: ["Hipertensão", "Diabetes"],
        ubsMaisProximaId: ubsData[0].id,
        distanciaUbs: "0.8"
      },
      {
        nome: "José Santos",
        endereco: "Quadra 105 Lote 20 - Recanto das Emas",
        cep: "72610-106",
        latitude: "-15.9078",
        longitude: "-48.0621",
        telefone: "(61) 98765-1234",
        idade: 62,
        condicoesSaude: ["Cardiopatia"],
        ubsMaisProximaId: ubsData[1].id,
        distanciaUbs: "0.5"
      }
    ]).returning();
    
    console.log(`✅ Created ${pacientesData.length} patient records`);
    
    // Create initial Equipamentos Sociais data
    console.log("🏛️ Creating Equipamentos Sociais data...");
    
    const equipamentosData = await db.insert(equipamentosSociais).values([
      {
        nome: "CRAS Samambaia",
        tipo: "CRAS",
        endereco: "QN 523 Conjunto A - Samambaia Sul",
        cep: "72331-500",
        latitude: "-15.8797",
        longitude: "-48.0891",
        telefone: "(61) 3459-2345",
        email: "cras.samambaia@social.df.gov.br",
        horarioFuncionamento: "Segunda a Sexta: 8h às 17h",
        servicos: ["Cadastro Único", "Bolsa Família", "Atendimento Social"]
      },
      {
        nome: "CAPS II Recanto das Emas",
        tipo: "CAPS",
        endereco: "Quadra 300 Conjunto 4 - Recanto das Emas",
        cep: "72620-300",
        latitude: "-15.9098",
        longitude: "-48.0611",
        telefone: "(61) 3434-3456",
        email: "caps.recanto@saude.df.gov.br",
        horarioFuncionamento: "Segunda a Sexta: 7h às 18h",
        servicos: ["Saúde Mental", "Atendimento Psicológico", "Grupos Terapêuticos"]
      },
      {
        nome: "Conselho Tutelar Água Quente",
        tipo: "Conselho Tutelar",
        endereco: "Avenida Castanheiras 3000 - Água Quente",
        cep: "71936-250",
        latitude: "-15.8339",
        longitude: "-48.0267",
        telefone: "(61) 3435-6789",
        horarioFuncionamento: "24 horas",
        servicos: ["Proteção à Criança", "Proteção ao Adolescente"]
      }
    ]).returning();
    
    console.log(`✅ Created ${equipamentosData.length} social equipment records`);
    
    console.log("\n✨ Migration completed successfully!");
    console.log("📊 Database initialized with:");
    console.log(`   - ${testUsers.length} users`);
    console.log(`   - ${ubsData.length} UBS`);
    console.log(`   - ${ongsData.length} ONGs`);
    console.log(`   - ${pacientesData.length} patients`);
    console.log(`   - ${equipamentosData.length} social equipment`);
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate().catch(console.error);
}

export { migrate };
