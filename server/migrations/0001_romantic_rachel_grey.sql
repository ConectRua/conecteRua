CREATE TABLE "atividades_territoriais" (
	"id" serial PRIMARY KEY NOT NULL,
	"titulo" varchar(255) NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"quantidade_pessoas" integer NOT NULL,
	"descricao_local" text NOT NULL,
	"endereco" text,
	"cep" varchar(10),
	"regiao" varchar(100),
	"usuario_id" integer,
	"data_atividade" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "pacientes" ALTER COLUMN "cep" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "equipamentos_sociais" ADD COLUMN "responsavel" varchar(255);--> statement-breakpoint
ALTER TABLE "equipamentos_sociais" ADD COLUMN "place_id" varchar(255);--> statement-breakpoint
ALTER TABLE "equipamentos_sociais" ADD COLUMN "google_rating" double precision;--> statement-breakpoint
ALTER TABLE "equipamentos_sociais" ADD COLUMN "google_photo_url" varchar(500);--> statement-breakpoint
ALTER TABLE "ongs" ADD COLUMN "tipo" varchar(100);--> statement-breakpoint
ALTER TABLE "ongs" ADD COLUMN "areas_atuacao" text[];--> statement-breakpoint
ALTER TABLE "ongs" ADD COLUMN "horario_funcionamento" varchar(100);--> statement-breakpoint
ALTER TABLE "ongs" ADD COLUMN "place_id" varchar(255);--> statement-breakpoint
ALTER TABLE "ongs" ADD COLUMN "google_rating" double precision;--> statement-breakpoint
ALTER TABLE "ongs" ADD COLUMN "google_photo_url" varchar(500);--> statement-breakpoint
ALTER TABLE "pacientes" ADD COLUMN "precisao_geocode" varchar(30);--> statement-breakpoint
ALTER TABLE "ubs" ADD COLUMN "place_id" varchar(255);--> statement-breakpoint
ALTER TABLE "ubs" ADD COLUMN "google_rating" double precision;--> statement-breakpoint
ALTER TABLE "ubs" ADD COLUMN "google_photo_url" varchar(500);--> statement-breakpoint
ALTER TABLE "atividades_territoriais" ADD CONSTRAINT "atividades_territoriais_usuario_id_users_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pacientes" ADD CONSTRAINT "pacientes_cns_ou_cpf_unique" UNIQUE("cns_ou_cpf");