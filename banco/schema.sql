-- Clínica Pequenos Passos — SQL simples para PostgreSQL
-- Para começar do zero, executa a partir do banco clinica_pediatrica.
-- ATENÇÃO: apaga tabelas e dados existentes.

DROP TABLE IF EXISTS atendimentos CASCADE;
DROP TABLE IF EXISTS criancas CASCADE;
DROP TABLE IF EXISTS responsaveis CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  cpf CHAR(11) UNIQUE NOT NULL,
  senha_hash VARCHAR(60) NOT NULL
);

CREATE TABLE responsaveis (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  cpf CHAR(11) UNIQUE NOT NULL,
  email VARCHAR(150) NOT NULL,
  telefone VARCHAR(20) NOT NULL
);

CREATE TABLE criancas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  data_nascimento DATE NOT NULL,
  responsavel_id INTEGER NOT NULL REFERENCES responsaveis(id) ON DELETE RESTRICT
);

CREATE TABLE atendimentos (
  id SERIAL PRIMARY KEY,
  crianca_id INTEGER NOT NULL REFERENCES criancas(id) ON DELETE RESTRICT,
  data_atendimento DATE NOT NULL,
  horario TIME NOT NULL,
  motivo VARCHAR(300) NOT NULL,
  situacao VARCHAR(20) NOT NULL DEFAULT 'Agendado'
);

-- Os três hashes bcrypt abaixo correspondem à senha de teste: Troque123!
INSERT INTO usuarios (nome, cpf, senha_hash) VALUES
('Operador 1', '00000000001', '$2b$12$F09ScidcaLGP0s/EpFx.fu/d7MhH67PAAg.S4oqC5TJq6MHaz3.o6'),
('Operador 2', '00000000002', '$2b$12$dt1Uv2efztOwehIXlOsGm.9r5KvVwMDfJvv1jQID8DvKE4CXuwTFu'),
('Operador 3', '00000000003', '$2b$12$j5TFAZCvc4DOrj.dC6CCnuzhhYRqFoDpjfwpT0UXFK8/gIv7Nc5yS');

INSERT INTO responsaveis (nome, cpf, email, telefone) VALUES
('Ana Exemplo', '11111111111', 'ana@example.test', '(11) 90000-0001'),
('Bruno Exemplo', '22222222222', 'bruno@example.test', '(11) 90000-0002'),
('Carla Exemplo', '33333333333', 'carla@example.test', '(11) 90000-0003');

INSERT INTO criancas (nome, data_nascimento, responsavel_id) VALUES
('Lia Exemplo', '2020-03-15', 1),
('Theo Exemplo', '2018-08-22', 2),
('Maya Exemplo', '2022-01-10', 3);

INSERT INTO atendimentos (crianca_id, data_atendimento, horario, motivo, situacao) VALUES
(1, '2027-01-12', '09:00', 'Consulta de rotina', 'Agendado'),
(2, '2027-01-12', '10:30', 'Acompanhamento', 'Confirmado'),
(3, '2027-01-15', '14:00', 'Avaliação de crescimento', 'Agendado');
