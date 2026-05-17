# GestorFrota PR

Sistema de gestão de frota de veículos para motoristas de aplicativo no estado do Paraná.

## Stack
| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14 + TypeScript + TailwindCSS |
| Backend | NestJS + TypeScript + MongoDB/Mongoose |
| Banco de Dados | MongoDB |
| Notificações | Nodemailer (e-mail) + Twilio (WhatsApp) |
| Infraestrutura | Docker + Nginx |
| Deploy | AWS ECS Fargate + ECR + ALB + CloudFront |

---

## Executar localmente com Docker

### Pré-requisitos
- Docker Desktop instalado e rodando

### 1. Clone e configure variáveis de ambiente
```bash
cp .env.example .env
# Edite o .env com suas credenciais (SMTP, Twilio, etc.)
```

### 2. Suba todos os serviços
```bash
docker compose up -d --build
```

### 3. Acesse os serviços
| Serviço | URL |
|---------|-----|
| **Frontend** | http://localhost:3000 |
| **API Backend** | http://localhost:3001/api |
| **Swagger (docs)** | http://localhost:3001/api/docs |
| **MongoDB Express** | http://localhost:8081 (admin/admin123) |

### 4. Parar os serviços
```bash
docker compose down
```

---

## Desenvolvimento local sem Docker

### Backend
```bash
cd backend
cp .env.example .env
npm install
npm run start:dev
```

### Frontend
```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

---

## Módulos do Sistema

| Módulo | Descrição |
|--------|-----------|
| **Motoristas** | Cadastro e gestão de motoristas (CNH, plataformas, avaliação) |
| **Veículos** | Frota de veículos com documentos e status |
| **Aluguéis** | Contratos de aluguel com cronograma de pagamentos |
| **Manutenções** | Agendamento e histórico de manutenções |
| **Detran PR** | Consulta de multas, IPVA e licenciamento (mock + adaptador) |
| **Notificações** | Alertas automáticos por e-mail e WhatsApp |
| **Histórico** | Timeline completa de eventos por veículo/motorista |
| **Relatórios** | Dashboard com KPIs e gráficos financeiros |

---

## Variáveis de Ambiente

Copie `.env.example` para `.env` e preencha:

| Variável | Descrição |
|----------|-----------|
| `JWT_SECRET` | Chave secreta JWT (use uma string longa e aleatória) |
| `SMTP_HOST` | Servidor SMTP para e-mails |
| `SMTP_USER` | Usuário SMTP |
| `SMTP_PASS` | Senha/App Password SMTP |
| `TWILIO_ACCOUNT_SID` | SID da conta Twilio |
| `TWILIO_AUTH_TOKEN` | Token de autenticação Twilio |
| `TWILIO_WHATSAPP_FROM` | Número WhatsApp Twilio sandbox |

---

## Deploy em Produção (Vercel + Render + MongoDB Atlas)

Para garantir alta disponibilidade (HA) e o menor custo possível (PaaS / Serverless), a arquitetura recomendada foge da nuvem tradicional (AWS) e adota serviços gerenciados de ponta a ponta.

### Arquitetura
```
Internet → Vercel Edge Network (Frontend)
                     ↓
         Render Web Service (Backend Docker)
                     ↓
         MongoDB Atlas (Banco de Dados)
```

### 1. MongoDB Atlas (Banco de Dados)
1. Crie uma conta gratuita no [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Crie um cluster do tipo **Serverless** (paga centavos por milhão de requisições) ou **M0 (Free)**.
3. Configure o _Network Access_ para permitir acesso de qualquer IP (`0.0.0.0/0`) ou restrinja aos IPs do Render.
4. Crie um usuário de banco de dados e copie a **Connection String (URI)** gerada.

### 2. Render (Backend)
O repositório já possui um arquivo `render.yaml` pronto para deploy automatizado e configuração de **disco persistente** (para que os uploads das fotos de motoristas e veículos não sejam perdidos a cada atualização).

1. Crie uma conta no [Render](https://render.com/).
2. Conecte seu GitHub e clique em **New > Blueprint**.
3. Selecione este repositório. O Render detectará automaticamente o arquivo `render.yaml`.
4. Preencha as variáveis de ambiente sensíveis no dashboard do Render (como a `MONGODB_URI` gerada no passo anterior, além de credenciais JWT, Twilio e SMTP).
5. Clique em **Apply**. O Render fará o build do Dockerfile e colocará a API no ar. Copie o domínio gerado (ex: `https://gestor-frota-backend.onrender.com`).

### 3. Vercel (Frontend)
1. Crie uma conta na [Vercel](https://vercel.com/).
2. Clique em **Add New Project** e importe este repositório do GitHub.
3. Na seção **Framework Preset**, deixe como `Next.js`.
4. Em **Root Directory**, altere para `frontend`.
5. Em **Environment Variables**, adicione:
   - `NEXT_PUBLIC_API_URL`: coloque a URL do backend gerada no Render (ex: `https://gestor-frota-backend.onrender.com/api`).
6. Clique em **Deploy**. A Vercel cuidará de toda a distribuição via Edge CDN globalmente.

---

## Detran PR

> **Nota:** A API pública do Detran Paraná não está disponível oficialmente para consultas externas. O sistema inclui um módulo de simulação (mock) que imita as respostas para desenvolvimento. Quando o acesso à API real for liberado, basta atualizar o `DetranService` (`backend/src/detran/detran.service.ts`) com as chamadas reais — a interface não precisará de alterações.

---

## Notificações Automáticas (Cron Jobs)

| Horário | Verificação |
|---------|-------------|
| 08:00 | CNHs próximas ao vencimento (30 dias) |
| 08:30 | Documentos de veículos (IPVA, licenciamento, seguro) |
| 09:00 | Pagamentos de aluguel atrasados |

---

## Licença

Privado — Todos os direitos reservados.
