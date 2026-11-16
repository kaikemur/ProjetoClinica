# Clínica Pequenos Passos — documentação

## Objetivo

Aplicação local para organizar operadores, responsáveis, crianças e atendimentos de uma clínica pediátrica. As páginas são renderizadas no servidor com EJS e os dados ficam no PostgreSQL.

## Requisitos funcionais

1. Operador entra com CPF e senha; senha verificada com bcrypt e erro genérico para credenciais inválidas.
2. Sessão protege os módulos, exibe o nome do operador e termina pelo botão Sair; expira após uma hora.
3. Responsáveis podem ser cadastrados, listados, editados, removidos e pesquisados parcialmente pelo nome.
4. Crianças podem ser cadastradas, listadas, editadas e removidas; cada criança deve ter um responsável cadastrado.
5. Atendimentos podem ser cadastrados, listados, editados e removidos; cada atendimento deve ter uma criança cadastrada.
6. A agenda apresenta criança e responsável com `JOIN`, ordenada por data e horário.

## Regras e proteção

O banco usa PK, FK e campos obrigatórios. Exclusões que deixariam vínculos órfãos são bloqueadas. As consultas usam parâmetros `$1`, `$2`. Os dados incluídos no SQL são fictícios. Senhas são armazenadas como hash bcrypt. Para CPFs reais, usar criptografia reversível com gestão segura de chaves e controles de acesso.

## Tecnologias e ambiente

Node.js com módulos ES, Express, EJS, PostgreSQL, `pg`, `express-session` e `bcrypt`. Requer Node.js 18 ou superior e PostgreSQL local. A aplicação usa HTTP 3000 por padrão; a porta do banco fica definida no `.env` (padrão do modelo: 5432).

## Modelo de dados

`usuarios` autentica operadores. Um `responsavel` pode ter várias `criancas` (1:N). Uma `crianca` pode ter vários `atendimentos` (1:N). O diagrama em PNG está na pasta `der/`.

## Dados demonstrativos

O SQL cria três linhas em cada tabela. A conta de demonstração usa CPF `00000000001` e senha `Troque123!`. Use somente para laboratório.
