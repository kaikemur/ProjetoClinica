import express from 'express';
import session from 'express-session';
import bcrypt from 'bcrypt';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './db.js';

const app = express();
const root = path.dirname(fileURLToPath(import.meta.url));
app.set('view engine', 'ejs');
app.set('views', path.join(root, 'views'));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(root, 'public')));
app.use(session({
  name: 'clinica.sid', secret: process.env.SESSION_SECRET || 'chave-apenas-para-aula',
  resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 1000 }
}));
app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario || null;
  res.locals.mensagem = req.session.mensagem || '';
  delete req.session.mensagem;
  next();
});
const logado = (req, res, next) => req.session.usuario ? next() : res.redirect('/login');
const texto = (v) => String(v ?? '').trim();
const erro = (res, mensagem, codigo = 400) => res.status(codigo).render('erro', { mensagem });

app.get('/login', (req, res) => req.session.usuario ? res.redirect('/') : res.render('login', { mensagem: '' }));
app.post('/login', async (req, res, next) => {
  try {
    const cpf = texto(req.body.cpf);
    const senha = String(req.body.senha || '');
    const { rows } = await db.query('SELECT id,nome,senha_hash FROM usuarios WHERE cpf=$1', [cpf]);
    const u = rows[0];
    if (!u || !(await bcrypt.compare(senha, u.senha_hash))) return res.status(401).render('login', { mensagem: 'CPF ou senha inválidos.' });
    req.session.regenerate((e) => {
      if (e) return next(e);
      req.session.usuario = { id: u.id, nome: u.nome };
      res.redirect('/');
    });
  } catch (e) { next(e); }
});
app.post('/sair', logado, (req, res) => req.session.destroy(() => res.redirect('/login')));

app.get('/', logado, async (req, res, next) => {
  try {
    const [r, c, a] = await Promise.all([
      db.query('SELECT COUNT(*)::int AS n FROM responsaveis'),
      db.query('SELECT COUNT(*)::int AS n FROM criancas'),
      db.query('SELECT COUNT(*)::int AS n FROM atendimentos')
    ]);
    res.render('inicio', { total: { responsaveis: r.rows[0].n, criancas: c.rows[0].n, atendimentos: a.rows[0].n } });
  } catch (e) { next(e); }
});

// Configuração simples dos três cadastros. Todas as consultas recebem parâmetros.
const recursos = {
  responsaveis: {
    nome: 'Responsáveis', tabela: 'responsaveis',
    campos: [
      { chave: 'nome', rotulo: 'Nome', tipo: 'text' },
      { chave: 'cpf', rotulo: 'CPF (11 números)', tipo: 'text' },
      { chave: 'email', rotulo: 'E-mail', tipo: 'email' },
      { chave: 'telefone', rotulo: 'Telefone', tipo: 'text' }
    ],
    listSql: 'SELECT id,nome,cpf,email,telefone FROM responsaveis WHERE nome ILIKE $1 ORDER BY nome',
    insertSql: 'INSERT INTO responsaveis (nome,cpf,email,telefone) VALUES ($1,$2,$3,$4)',
    updateSql: 'UPDATE responsaveis SET nome=$1,cpf=$2,email=$3,telefone=$4 WHERE id=$5',
    values: (b) => [b.nome,b.cpf,b.email,b.telefone],
    headers: ['Nome','CPF','E-mail','Telefone'],
    cells: (r) => [r.nome,r.cpf,r.email,r.telefone]
  },
  criancas: {
    nome: 'Crianças', tabela: 'criancas',
    campos: [
      { chave: 'nome', rotulo: 'Nome', tipo: 'text' },
      { chave: 'data_nascimento', rotulo: 'Data de nascimento', tipo: 'date' },
      { chave: 'responsavel_id', rotulo: 'Responsável', tipo: 'select', optionsSql: 'SELECT id,nome AS texto FROM responsaveis ORDER BY nome' }
    ],
    listSql: 'SELECT c.id,c.nome,c.data_nascimento,r.nome AS responsavel FROM criancas c JOIN responsaveis r ON r.id=c.responsavel_id ORDER BY c.nome',
    editSql: 'SELECT id,nome,data_nascimento,responsavel_id FROM criancas WHERE id=$1',
    insertSql: 'INSERT INTO criancas (nome,data_nascimento,responsavel_id) VALUES ($1,$2,$3)',
    updateSql: 'UPDATE criancas SET nome=$1,data_nascimento=$2,responsavel_id=$3 WHERE id=$4',
    values: (b) => [b.nome,b.data_nascimento,Number(b.responsavel_id)],
    headers: ['Nome','Nascimento','Responsável'],
    cells: (r) => [r.nome,new Date(r.data_nascimento).toLocaleDateString('pt-BR',{timeZone:'UTC'}),r.responsavel]
  },
  atendimentos: {
    nome: 'Atendimentos', tabela: 'atendimentos',
    campos: [
      { chave: 'crianca_id', rotulo: 'Criança', tipo: 'select', optionsSql: "SELECT c.id, c.nome || ' — ' || r.nome AS texto FROM criancas c JOIN responsaveis r ON r.id=c.responsavel_id ORDER BY c.nome" },
      { chave: 'data_atendimento', rotulo: 'Data', tipo: 'date' },
      { chave: 'horario', rotulo: 'Horário', tipo: 'time' },
      { chave: 'motivo', rotulo: 'Motivo', tipo: 'text' },
      { chave: 'situacao', rotulo: 'Situação', tipo: 'select', options: ['Agendado','Confirmado','Realizado','Cancelado'] }
    ],
    listSql: 'SELECT a.id,a.data_atendimento,a.horario,a.motivo,a.situacao,c.nome AS crianca,r.nome AS responsavel FROM atendimentos a JOIN criancas c ON c.id=a.crianca_id JOIN responsaveis r ON r.id=c.responsavel_id ORDER BY a.data_atendimento,a.horario',
    insertSql: 'INSERT INTO atendimentos (crianca_id,data_atendimento,horario,motivo,situacao) VALUES ($1,$2,$3,$4,$5)',
    updateSql: 'UPDATE atendimentos SET crianca_id=$1,data_atendimento=$2,horario=$3,motivo=$4,situacao=$5 WHERE id=$6',
    values: (b) => [Number(b.crianca_id),b.data_atendimento,b.horario,b.motivo,b.situacao],
    headers: ['Data','Horário','Criança','Responsável','Motivo','Situação'],
    cells: (r) => [new Date(r.data_atendimento).toLocaleDateString('pt-BR',{timeZone:'UTC'}),String(r.horario).slice(0,5),r.crianca,r.responsavel,r.motivo,r.situacao]
  }
};

async function camposForm(cfg, registro = {}) {
  const campos = await Promise.all(cfg.campos.map(async (f) => {
    let opcoes = f.options || [];
    if (f.optionsSql) opcoes = (await db.query(f.optionsSql)).rows.map((r) => ({ valor: r.id, texto: r.texto }));
    let valor = registro[f.chave] ?? '';
    if (valor instanceof Date) valor = valor.toISOString().slice(0,10);
    if (f.tipo === 'time') valor = String(valor).slice(0,5);
    return { ...f, opcoes, valor };
  }));
  return campos;
}

async function validar(cfg, slug, dados) {
  if (cfg.campos.some((f) => !dados[f.chave])) return 'Preencha todos os campos.';
  if (slug === 'responsaveis' && !/^\d{11}$/.test(dados.cpf)) return 'O CPF deve conter 11 números.';
  if (slug === 'responsaveis' && !/^\S+@\S+\.\S+$/.test(dados.email)) return 'Informe um e-mail válido.';
  for (const campo of cfg.campos) {
    if (campo.tipo === 'date' && (!/^\d{4}-\d{2}-\d{2}$/.test(dados[campo.chave]) || Number.isNaN(Date.parse(dados[campo.chave])))) return 'Informe uma data válida.';
    if (campo.optionsSql) {
      const opcoes = (await db.query(campo.optionsSql)).rows;
      if (!opcoes.some((o) => String(o.id) === String(dados[campo.chave]))) return `Selecione um valor válido para ${campo.rotulo.toLowerCase()}.`;
    }
  }
  return '';
}

for (const [slug, cfg] of Object.entries(recursos)) {
  app.get(`/${slug}`, logado, async (req, res, next) => {
    try {
      const busca = slug === 'responsaveis' ? texto(req.query.busca) : '';
      const { rows } = await db.query(cfg.listSql, slug === 'responsaveis' ? [`%${busca}%`] : []);
      res.render('lista', { titulo: cfg.nome, slug, headers: cfg.headers, rows: rows.map(r => ({ id: r.id, cells: cfg.cells(r) })), busca });
    } catch (e) { next(e); }
  });
  app.get(`/${slug}/novo`, logado, async (req, res, next) => {
    try { res.render('form', { titulo: `Novo cadastro: ${cfg.nome}`, slug, registro: {}, campos: await camposForm(cfg), erro: '' }); }
    catch (e) { next(e); }
  });
  app.post(`/${slug}`, logado, async (req, res, next) => {
    try {
      const b = Object.fromEntries(cfg.campos.map(f => [f.chave, texto(req.body[f.chave])]));
      const problema = await validar(cfg, slug, b);
      if (problema) return res.status(400).render('form', { titulo: `Novo cadastro: ${cfg.nome}`, slug, registro: b, campos: await camposForm(cfg,b), erro: problema });
      await db.query(cfg.insertSql, cfg.values(b)); res.redirect(`/${slug}`);
    } catch (e) { next(e); }
  });
  app.get(`/${slug}/:id/editar`, logado, async (req, res, next) => {
    try {
      const { rows } = await db.query(cfg.editSql || `SELECT * FROM ${cfg.tabela} WHERE id=$1`, [req.params.id]);
      if (!rows.length) return res.sendStatus(404);
      res.render('form', { titulo: `Editar: ${cfg.nome}`, slug, registro: rows[0], campos: await camposForm(cfg,rows[0]), erro: '' });
    } catch (e) { next(e); }
  });
  app.post(`/${slug}/:id`, logado, async (req, res, next) => {
    try {
      const b = Object.fromEntries(cfg.campos.map(f => [f.chave, texto(req.body[f.chave])]));
      const problema = await validar(cfg, slug, b);
      if (problema) return res.status(400).render('form', { titulo: `Editar: ${cfg.nome}`, slug, registro: b, campos: await camposForm(cfg,b), erro: problema });
      await db.query(cfg.updateSql, [...cfg.values(b), req.params.id]); res.redirect(`/${slug}`);
    } catch (e) { next(e); }
  });
  app.post(`/${slug}/:id/excluir`, logado, async (req, res, next) => {
    try {
      await db.query(`DELETE FROM ${cfg.tabela} WHERE id=$1`, [req.params.id]);
      res.redirect(`/${slug}`);
    } catch (e) {
      if (e.code === '23503') { req.session.mensagem = 'Não é possível excluir: há registros vinculados.'; return res.redirect(`/${slug}`); }
      next(e);
    }
  });
}

app.use((req,res) => res.status(404).render('erro',{mensagem:'Página não encontrada.'}));
app.use((err,req,res,next) => {
  console.error(err.message);
  if (res.headersSent) return next(err);
  res.status(500).render('erro',{mensagem:'Erro no servidor ou no banco. Confira o arquivo .env e o schema.sql.'});
});
app.listen(Number(process.env.PORT || 3000), () => console.log(`Clínica Pequenos Passos disponível em http://localhost:${process.env.PORT || 3000}`));
