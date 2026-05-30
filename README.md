# 🔧 Estoque Car — Sistema de Gerenciamento de Estoque para Oficinas Mecânicas

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-v20+-339933?style=for-the-badge&logo=node.js&logoColor=white"/>
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white"/>
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white"/>
  <img src="https://img.shields.io/badge/Azure-Cloud-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white"/>
  <img src="https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white"/>
</p>

---

## 📋 Sobre o Projeto

**Estoque Car** é uma solução web de gerenciamento de estoque e pedidos voltada para **oficinas mecânicas de pequeno e médio porte**, com foco especial em democratizar o acesso a ferramentas de controle de inventário para estabelecimentos que não têm condições de arcar com sistemas corporativos complexos e caros.

### Problema Abordado

Oficinas mecânicas menores frequentemente gerenciam seus estoques com papel, planilhas ou memória, o que gera:

- Perda de peças por falta de controle de entrada/saída
- Dificuldade em saber o que está acabando no estoque
- Erros em pedidos por informações desatualizadas
- Retrabalho no atendimento ao cliente

### Solução

Uma aplicação web responsiva, intuitiva e de baixo custo, acessível via navegador, com interface simplificada, fluxos curtos e linguagem acessível — pensada para proprietários e funcionários com diferentes níveis de familiaridade com tecnologia.

---

## 👥 Equipe

| Nome | Papel | Responsabilidade |
|------|-------|-----------------|
| **Michell Platini** | Backend / PO | Desenvolvimento back-end, arquitetura, coordenação de entregas |
| **Filipe Messias** | Backend | Desenvolvimento de APIs, regras de negócio |
| **Raul Victor** | DevOps / CI-CD | Pipeline, Docker, deploy Azure |
| **Gustavo Porto** | DBA | Modelagem, migrações, performance de banco |
| **Guilherme Neves** | Frontend | Interface, usabilidade, HTML/CSS/JS |

---

## 🏗️ Arquitetura

### Padrão Arquitetural: MVC + RESTful API

```
Frontend (HTML/CSS/JS)
        ↕ HTTP/JSON (Fetch API)
Backend (Node.js + Express + TypeScript)
  ├── Controllers  → lógica de requisição/resposta
  ├── Services     → regras de negócio
  ├── Repositories → acesso a dados via Prisma
  └── Middleware   → autenticação JWT, validação, RBAC
        ↕ Prisma ORM
MySQL (Azure Database for MySQL)
        +
Azure Blob Storage (imagens de peças)
```

### Stack Tecnológico

**Frontend**
- HTML5 + CSS3 + JavaScript ES6+
- Bootstrap 5 (responsividade)
- Chart.js (gráficos)
- SweetAlert2 (modais e feedback)

**Backend**
- Node.js v20 + TypeScript
- Express.js (framework HTTP)
- Prisma ORM (acesso a banco de dados)
- JSON Web Token (autenticação)
- bcryptjs (hash de senhas)
- Multer + Azure Blob Storage SDK (upload de imagens)
- Zod (validação de entrada)
- ExcelJS + PDFKit (geração de relatórios)

**Banco de Dados**
- MySQL 8.0 (Azure Database for MySQL - Flexible Server)

**Infraestrutura**
- Azure App Service (backend)
- Azure Static Web Apps (frontend)
- Azure Database for MySQL
- Azure Blob Storage (imagens)
- GitHub Actions (CI/CD)
- Docker (containerização)

---

## 📁 Estrutura de Pastas

```
estoque-car/
├── README.md
├── .gitignore
├── docker-compose.yml
│
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── Dockerfile
│   ├── prisma/
│   │   ├── schema.prisma       ← Modelos do banco
│   │   └── seed.ts             ← Dados iniciais
│   ├── src/
│   │   ├── server.ts           ← Entry point
│   │   ├── app.ts              ← Configuração Express
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   └── azure-blob.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts         ← JWT verificação
│   │   │   ├── role.ts         ← RBAC
│   │   │   └── validate.ts     ← Zod schemas
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── product.controller.ts
│   │   │   ├── stock.controller.ts
│   │   │   ├── order.controller.ts
│   │   │   ├── client.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   └── report.controller.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── product.service.ts
│   │   │   ├── stock.service.ts
│   │   │   ├── order.service.ts
│   │   │   ├── client.service.ts
│   │   │   ├── user.service.ts
│   │   │   └── report.service.ts
│   │   ├── routes/
│   │   │   ├── index.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── product.routes.ts
│   │   │   ├── stock.routes.ts
│   │   │   ├── order.routes.ts
│   │   │   ├── client.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   └── report.routes.ts
│   │   └── utils/
│   │       ├── password.ts
│   │       ├── token.ts
│   │       └── cnpj-cpf.ts
│   └── tests/
│       ├── unit/
│       │   ├── auth.service.test.ts
│       │   ├── product.service.test.ts
│       │   └── stock.service.test.ts
│       └── integration/
│           ├── auth.integration.test.ts
│           └── product.integration.test.ts
│
├── frontend/
│   ├── index.html              ← Login/Cadastro
│   ├── home.html               ← Dashboard
│   ├── products.html           ← Produtos/Estoque
│   ├── orders.html             ← Pedidos
│   ├── stock-in.html           ← Entrada de estoque
│   ├── stock-out.html          ← Saída/Baixa
│   ├── clients.html            ← Clientes/Fornecedores
│   ├── users.html              ← Usuários (admin)
│   ├── reports.html            ← Relatórios
│   ├── change-password.html    ← Troca de senha (1º login)
│   ├── css/
│   │   ├── global.css
│   │   └── components.css
│   └── js/
│       ├── api.js              ← Fetch wrapper + interceptor JWT
│       ├── auth.js
│       └── pages/
│           ├── home.js
│           ├── products.js
│           ├── orders.js
│           ├── stock.js
│           ├── clients.js
│           ├── users.js
│           └── reports.js
│
├── infra/
│   ├── azure-deploy.sh
│   └── nginx.conf
│
└── .github/
    └── workflows/
        └── ci-cd.yml
```

---

## 🚀 Como Executar Localmente

### Pré-requisitos

- Node.js v20+
- MySQL 8.0 local (ou Docker)
- Git

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/estoque-car.git
cd estoque-car
```

### 2. Configure o Backend

```bash
cd backend
npm install
cp .env.example .env
# Edite o .env com suas credenciais
```

### 3. Suba o banco de dados com Docker

```bash
# Na raiz do projeto
docker-compose up -d mysql
```

### 4. Execute as migrações e seed

```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

### 5. Inicie o servidor

```bash
npm run dev
```

### 6. Frontend

Abra o arquivo `frontend/index.html` diretamente no navegador, ou use um servidor estático:

```bash
# Na pasta frontend
npx serve .
```

### Credenciais padrão (seed)

| Usuário | Senha | Perfil |
|---------|-------|--------|
| admin@estoquecar.com | Admin@123 | Administrador |
| operador@estoquecar.com | Mudar123@ | Operador |

---

## 🧪 Testes

```bash
cd backend

# Todos os testes
npm test

# Unitários
npm run test:unit

# Integração
npm run test:integration

# Coverage
npm run test:coverage
```

---

## 🔄 Pipeline CI/CD (GitHub Actions)

O pipeline roda automaticamente em push para `main`:

1. **Lint** — ESLint + TypeScript check
2. **Testes** — Jest unit + integration
3. **Build** — Compilação TypeScript
4. **Docker Build** — Imagem de produção
5. **Deploy Azure** — Push para App Service

---

## 📊 Modelo de Banco de Dados

Ver documentação completa em [`/docs/modelo-banco.md`](docs/modelo-banco.md)

---

## 📝 Licença

MIT — uso livre para fins acadêmicos e comerciais.

---

> Projeto Integrado — Fatec Cotia — Tecnologia em Desenvolvimento de Software Multiplataforma — 2024
