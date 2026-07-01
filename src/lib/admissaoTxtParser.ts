/**
 * Parser do arquivo .txt de importação do módulo Admissão.
 * Formato esperado: uma informação por linha, no padrão "Chave: Valor".
 * Linhas em branco, iniciadas por "#" ou "##" (cabeçalhos de seção) são ignoradas.
 * Veja o modelo em: modelos/modelo_importacao_admissao.txt
 */

import { CampoAdmissao, CAMPOS_OBRIGATORIOS_IMPORTACAO, LABEL_CAMPO_ADMISSAO } from '../types/admissao';

// Mapa de "chave normalizada no txt" -> CampoAdmissao
// Aceita tanto a chave técnica (ex: salario_base) quanto o rótulo em português (ex: Salário base)
const ALIASES: Record<string, CampoAdmissao> = {
  nome: CampoAdmissao.NOME,
  cpf: CampoAdmissao.CPF,
  data_de_nascimento: CampoAdmissao.DATA_NASCIMENTO,
  data_nascimento: CampoAdmissao.DATA_NASCIMENTO,
  contato: CampoAdmissao.CONTATO,
  cidade: CampoAdmissao.CIDADE,
  email: CampoAdmissao.EMAIL,
  e_mail: CampoAdmissao.EMAIL,
  codigo_de_cadastro_rm: CampoAdmissao.CODIGO_CADASTRO_RM,
  codigo_cadastro_rm: CampoAdmissao.CODIGO_CADASTRO_RM,
  chapa: CampoAdmissao.CHAPA,

  empresa: CampoAdmissao.EMPRESA,
  data_de_inicio: CampoAdmissao.DATA_INICIO,
  data_inicio: CampoAdmissao.DATA_INICIO,
  lider: CampoAdmissao.LIDER,
  tipo_de_contrato: CampoAdmissao.TIPO_CONTRATO,
  tipo_contrato: CampoAdmissao.TIPO_CONTRATO,
  tempo_de_experiencia_contrato: CampoAdmissao.TEMPO_EXPERIENCIA,
  tempo_experiencia: CampoAdmissao.TEMPO_EXPERIENCIA,
  funcao: CampoAdmissao.FUNCAO,
  secao: CampoAdmissao.SECAO,

  salario_base: CampoAdmissao.SALARIO_BASE,
  bonificacao: CampoAdmissao.BONIFICACAO,
  gratificacao: CampoAdmissao.GRATIFICACAO,
  insalubridade: CampoAdmissao.INSALUBRIDADE,
  cargo_de_confianca: CampoAdmissao.CARGO_CONFIANCA,
  cargo_confianca: CampoAdmissao.CARGO_CONFIANCA,
  periculosidade: CampoAdmissao.PERICULOSIDADE,
  assiduidade: CampoAdmissao.ASSIDUIDADE,
  comissao: CampoAdmissao.COMISSAO,
  ajuda_de_custo: CampoAdmissao.AJUDA_CUSTO,
  ajuda_custo: CampoAdmissao.AJUDA_CUSTO,
  ajuda_de_custo_lanche: CampoAdmissao.AJUDA_CUSTO_LANCHE,
  ajuda_custo_lanche: CampoAdmissao.AJUDA_CUSTO_LANCHE,
  diaria_viagem: CampoAdmissao.DIARIA_VIAGEM,
  recebe_horas_extras: CampoAdmissao.RECEBE_HORAS_EXTRAS,
  jornada_de_trabalho: CampoAdmissao.JORNADA_TRABALHO,
  jornada_trabalho: CampoAdmissao.JORNADA_TRABALHO,
  observacoes: CampoAdmissao.OBSERVACOES,
  observacao: CampoAdmissao.OBSERVACOES,
};

function normalizarChave(chave: string): string {
  return chave
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_/]/g, '');
}

export interface ResultadoParseAdmissao {
  dados: Partial<Record<CampoAdmissao, string>>;
  camposNaoReconhecidos: string[];
  camposObrigatoriosFaltando: CampoAdmissao[];
  erros: string[];
  valido: boolean;
}

export function parseTxtAdmissao(conteudo: string): ResultadoParseAdmissao {
  const dados: Partial<Record<CampoAdmissao, string>> = {};
  const camposNaoReconhecidos: string[] = [];
  const erros: string[] = [];

  const linhas = conteudo.split(/\r?\n/);

  linhas.forEach((linhaOriginal, idx) => {
    const linha = linhaOriginal.trim();
    if (!linha) return; // linha em branco
    if (linha.startsWith('#')) return; // comentário / cabeçalho de seção

    const separadorIdx = linha.indexOf(':');
    if (separadorIdx === -1) {
      erros.push(`Linha ${idx + 1}: formato inválido, esperado "Chave: Valor" -> "${linha}"`);
      return;
    }

    const chaveBruta = linha.slice(0, separadorIdx);
    const valor = linha.slice(separadorIdx + 1).trim();

    const chaveNormalizada = normalizarChave(chaveBruta);
    const campo = ALIASES[chaveNormalizada];

    if (!campo) {
      camposNaoReconhecidos.push(chaveBruta.trim());
      return;
    }

    if (valor) {
      dados[campo] = valor;
    }
  });

  const camposObrigatoriosFaltando = CAMPOS_OBRIGATORIOS_IMPORTACAO.filter(c => !dados[c]?.trim());

  if (camposObrigatoriosFaltando.length > 0) {
    erros.push(
      `Campos obrigatórios ausentes: ${camposObrigatoriosFaltando.map(c => LABEL_CAMPO_ADMISSAO[c]).join(', ')}`
    );
  }

  return {
    dados,
    camposNaoReconhecidos,
    camposObrigatoriosFaltando,
    erros,
    valido: erros.length === 0,
  };
}
