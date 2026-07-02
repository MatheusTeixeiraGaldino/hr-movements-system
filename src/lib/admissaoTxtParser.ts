/**
 * Parser do arquivo de importação do módulo Admissão.
 *
 * Aceita o export real do sistema (.txt ou .csv), no formato de TABELA:
 *   - 1ª linha: cabeçalho, com os nomes/códigos das colunas
 *     (ex: NOME;CPF;DATA_NASCIMENTO;...;OBSERVACAO;Total Geral)
 *   - Demais linhas: uma pessoa por linha, valores na mesma ordem do cabeçalho.
 *   - Delimitador aceito automaticamente: ";" (padrão do export do sistema) ou ",".
 *   - Decimal com vírgula (ex: 1548,00) é convertido automaticamente para ponto.
 *   - A coluna "Total Geral" (e qualquer coluna não reconhecida) é ignorada.
 *
 * Como LIDER e OBSERVACAO normalmente vêm vazios no export do sistema,
 * eles ficam disponíveis para revisão/preenchimento manual na tela de
 * importação (AdmissaoImportView) antes de confirmar.
 */

import { CampoAdmissao, CAMPOS_OBRIGATORIOS_IMPORTACAO, LABEL_CAMPO_ADMISSAO } from '../types/admissao';

// Mapa de "coluna normalizada no arquivo" -> CampoAdmissao
// Aceita o código de coluna do sistema (ex: VLRSALARIO, CODIGO_CADASTRO) e também
// o rótulo em português usado no modelo manual (ex: "Salário base").
const ALIASES: Record<string, CampoAdmissao> = {
  // --- códigos do export do sistema ---
  nome: CampoAdmissao.NOME,
  cpf: CampoAdmissao.CPF,
  data_nascimento: CampoAdmissao.DATA_NASCIMENTO,
  contato: CampoAdmissao.CONTATO,
  email: CampoAdmissao.EMAIL,
  codigo_cadastro: CampoAdmissao.CODIGO_CADASTRO_RM,
  chapa: CampoAdmissao.CHAPA,
  empresa: CampoAdmissao.EMPRESA,
  admissao: CampoAdmissao.DATA_INICIO,
  lider: CampoAdmissao.LIDER,
  tipo_contrato: CampoAdmissao.TIPO_CONTRATO,
  tempo_contrato: CampoAdmissao.TEMPO_EXPERIENCIA,
  funcao: CampoAdmissao.FUNCAO,
  descricao: CampoAdmissao.SECAO,
  vlrsalario: CampoAdmissao.SALARIO_BASE,
  bonificacao1: CampoAdmissao.BONIFICACAO,
  gratificacaofixa1: CampoAdmissao.GRATIFICACAO,
  insalubridade1: CampoAdmissao.INSALUBRIDADE,
  cargoconfianca1: CampoAdmissao.CARGO_CONFIANCA,
  periculosidade1: CampoAdmissao.PERICULOSIDADE,
  assiduidade1: CampoAdmissao.ASSIDUIDADE,
  comissaofixa1: CampoAdmissao.COMISSAO,
  ajudadecusto1: CampoAdmissao.AJUDA_CUSTO,
  ajuda_custo_lanche: CampoAdmissao.AJUDA_CUSTO_LANCHE,
  diariaviagem1: CampoAdmissao.DIARIA_VIAGEM,
  horasextras1: CampoAdmissao.RECEBE_HORAS_EXTRAS,
  jornada: CampoAdmissao.JORNADA_TRABALHO,
  observacao: CampoAdmissao.OBSERVACOES,

  // --- rótulos em português (modelo manual / planilha) ---
  cidade: CampoAdmissao.CIDADE,
  data_de_nascimento: CampoAdmissao.DATA_NASCIMENTO,
  e_mail: CampoAdmissao.EMAIL,
  codigo_de_cadastro_rm: CampoAdmissao.CODIGO_CADASTRO_RM,
  codigo_cadastro_rm: CampoAdmissao.CODIGO_CADASTRO_RM,
  data_de_inicio: CampoAdmissao.DATA_INICIO,
  data_inicio: CampoAdmissao.DATA_INICIO,
  tipo_de_contrato: CampoAdmissao.TIPO_CONTRATO,
  tempo_de_experiencia_contrato: CampoAdmissao.TEMPO_EXPERIENCIA,
  tempo_experiencia: CampoAdmissao.TEMPO_EXPERIENCIA,
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
  diaria_viagem: CampoAdmissao.DIARIA_VIAGEM,
  recebe_horas_extras: CampoAdmissao.RECEBE_HORAS_EXTRAS,
  jornada_de_trabalho: CampoAdmissao.JORNADA_TRABALHO,
  jornada_trabalho: CampoAdmissao.JORNADA_TRABALHO,
  observacoes: CampoAdmissao.OBSERVACOES,
};

// Colunas que sabemos que existem no export mas não mapeiam para nenhum campo
// (ignoradas silenciosamente, sem virar "coluna não reconhecida")
const COLUNAS_IGNORADAS_CONHECIDAS = new Set(['total_geral']);

// Campos numéricos/monetários: "1548,00" -> "1548.00"
const CAMPOS_MONETARIOS = new Set<CampoAdmissao>([
  CampoAdmissao.SALARIO_BASE,
  CampoAdmissao.BONIFICACAO,
  CampoAdmissao.GRATIFICACAO,
  CampoAdmissao.INSALUBRIDADE,
  CampoAdmissao.CARGO_CONFIANCA,
  CampoAdmissao.PERICULOSIDADE,
  CampoAdmissao.ASSIDUIDADE,
  CampoAdmissao.COMISSAO,
  CampoAdmissao.AJUDA_CUSTO,
  CampoAdmissao.AJUDA_CUSTO_LANCHE,
  CampoAdmissao.DIARIA_VIAGEM,
]);

function normalizarChave(chave: string): string {
  return chave
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/\s*\/\s*/g, '_')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

/** Converte "1548,00" -> "1548.00". Não mexe em valores que já usam ponto ou não são numéricos. */
function normalizarValorMonetario(valor: string): string {
  const v = valor.trim();
  if (/^-?\d{1,3}(\.\d{3})*,\d{1,2}$/.test(v) || /^-?\d+,\d{1,2}$/.test(v)) {
    return v.replace(/\./g, '').replace(',', '.');
  }
  return v;
}

/** "01/07/2026 00:00:00" -> "01/07/2026" (remove hora quando presente) */
function normalizarData(valor: string): string {
  const v = valor.trim();
  const match = v.match(/^(\d{2}\/\d{2}\/\d{4})/);
  return match ? match[1] : v;
}

/** Detecta o delimitador do arquivo (TAB, ";" ou ",") olhando a linha de cabeçalho. */
function detectarDelimitador(linhaCabecalho: string): '\t' | ';' | ',' {
  const qtdTab = (linhaCabecalho.match(/\t/g) || []).length;
  const qtdPontoEVirgula = (linhaCabecalho.match(/;/g) || []).length;
  const qtdVirgula = (linhaCabecalho.match(/,/g) || []).length;

  if (qtdTab > 0 && qtdTab >= qtdPontoEVirgula && qtdTab >= qtdVirgula) return '\t';
  if (qtdPontoEVirgula >= qtdVirgula) return ';';
  return ',';
}

/** Divide uma linha respeitando valores entre aspas duplas. */
function splitLinha(linha: string, delimitador: string): string[] {
  const campos: string[] = [];
  let atual = '';
  let dentroDeAspas = false;

  for (let i = 0; i < linha.length; i++) {
    const char = linha[i];

    if (char === '"') {
      if (dentroDeAspas && linha[i + 1] === '"') {
        atual += '"';
        i++;
      } else {
        dentroDeAspas = !dentroDeAspas;
      }
      continue;
    }

    if (char === delimitador && !dentroDeAspas) {
      campos.push(atual);
      atual = '';
      continue;
    }

    atual += char;
  }
  campos.push(atual);

  return campos.map(c => c.trim());
}

export interface LinhaAdmissaoImportada {
  linha: number; // número da linha no arquivo (para referência ao usuário)
  dados: Partial<Record<CampoAdmissao, string>>;
  camposObrigatoriosFaltando: CampoAdmissao[];
  erros: string[];
  valida: boolean;
}

export interface ResultadoParseAdmissaoLote {
  registros: LinhaAdmissaoImportada[];
  camposNaoReconhecidos: string[];
  erroGeral?: string;
}

/**
 * Faz o parse do arquivo completo (.txt ou .csv), retornando um registro
 * por pessoa/linha de dados encontrada.
 */
export function parseArquivoAdmissao(conteudo: string): ResultadoParseAdmissaoLote {
  const linhasBrutas = conteudo.split(/\r?\n/).filter(l => l.trim() && !l.trim().startsWith('#'));

  if (linhasBrutas.length < 2) {
    return {
      registros: [],
      camposNaoReconhecidos: [],
      erroGeral: 'O arquivo precisa ter uma linha de cabeçalho e ao menos uma linha de dados.',
    };
  }

  const delimitador = detectarDelimitador(linhasBrutas[0]);
  const colunasCabecalho = splitLinha(linhasBrutas[0], delimitador);
  const chavesNormalizadas = colunasCabecalho.map(normalizarChave);

  const camposNaoReconhecidos = new Set<string>();
  const registros: LinhaAdmissaoImportada[] = [];

  for (let i = 1; i < linhasBrutas.length; i++) {
    const valores = splitLinha(linhasBrutas[i], delimitador);
    // Ignora linha totalmente vazia (todas as colunas em branco)
    if (valores.every(v => !v.trim())) continue;

    const dados: Partial<Record<CampoAdmissao, string>> = {};

    chavesNormalizadas.forEach((chaveNormalizada, idx) => {
      const campo = ALIASES[chaveNormalizada];
      let valor = (valores[idx] || '').trim();
      if (!valor) return;

      if (!campo) {
        if (!COLUNAS_IGNORADAS_CONHECIDAS.has(chaveNormalizada)) {
          camposNaoReconhecidos.add(colunasCabecalho[idx].trim());
        }
        return;
      }

      if (campo === CampoAdmissao.DATA_INICIO || campo === CampoAdmissao.DATA_NASCIMENTO) {
        valor = normalizarData(valor);
      } else if (CAMPOS_MONETARIOS.has(campo)) {
        valor = normalizarValorMonetario(valor);
      }

      dados[campo] = valor;
    });

    const camposObrigatoriosFaltando = CAMPOS_OBRIGATORIOS_IMPORTACAO.filter(c => !dados[c]?.trim());
    const erros: string[] = [];
    if (camposObrigatoriosFaltando.length > 0) {
      erros.push(
        `Campos obrigatórios ausentes: ${camposObrigatoriosFaltando.map(c => LABEL_CAMPO_ADMISSAO[c]).join(', ')}`
      );
    }

    registros.push({
      linha: i + 1,
      dados,
      camposObrigatoriosFaltando,
      erros,
      valida: erros.length === 0,
    });
  }

  return {
    registros,
    camposNaoReconhecidos: Array.from(camposNaoReconhecidos),
  };
}
