# Clínica Pequenos Passos — versão simples

Projeto didático com Node.js, Express, EJS e PostgreSQL. O código da aplicação fica em poucos arquivos: `sistema/app.js` concentra as rotas; `sistema/db.js` conecta ao banco; `sistema/views/` contém páginas EJS.

## 1. Criar o banco

Crie no pgAdmin um banco com o nome `clinica_pediatrica`. No Query Tool conectado a esse banco, abra e execute `banco/schema.sql`.

**Atenção:** o script começa removendo e recriando as tabelas. Execute somente em banco de teste ou depois de salvar uma cópia dos dados.

## 2. Configurar e iniciar

Abra o terminal dentro da pasta `sistema` e execute:

```text
npm install
```

Copie `.env.example` para `.env`. No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Edite `.env` e informe a senha do usuário PostgreSQL em `DB_PASSWORD`. Confirme `DB_PORT`: o exemplo usa `5432`; se o seu PostgreSQL estiver na porta `7777`, altere o valor.

Inicie o servidor:

```text
npm start
```

Abra `http://localhost:3000` no navegador.

## Login de demonstração

CPF `00000000001` e senha `Troque123!`. O SQL cria três operadores, três responsáveis, três crianças e três atendimentos. Todos os nomes/CPFs são fictícios.

## O que funciona

Login com bcrypt, sessão com expiração e logout; painel inicial; cadastro/listagem/edição/exclusão dos três módulos; busca parcial de responsáveis; vínculo obrigatório de criança a responsável e atendimento a criança; agenda com JOIN em ordem cronológica. As consultas SQL são parametrizadas.

A sessão em memória é somente para o exercício local. Não use dados reais de pacientes nem credenciais demonstrativas em produção.
