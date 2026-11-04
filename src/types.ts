export interface TreemapAsset {
  id: string;
  nome: string;
  categoria: string;
  tipo: string;
  uf: string;
  municipio: string;
  potencia_mw: number;
  conexoes_total?: number;
  variacao_periodo: string;
  status_regulatório: string;
  operadora: string;
  ano_inicio: number;
  dossier: {
    fonte_primaria: string;
    enquadramento: string;
    tensao_conexao: string;
    fator_capacidade: string;
    impacto_dessem: string;
    geolocalizacao_auditada: string;
  };
}

export interface CargaPonto {
  hora: string;
  verificada_mw: number;
  programada_mw: number;
  delta_mw: number;
}

export interface DessemPonto {
  hora: string;
  hidraulica_mw: number;
  termica_mw: number;
  eolica_mw: number;
  solar_mw: number;
  carga_total_mw: number;
}

export interface SqlQueryResult {
  type: string;
  columns?: string[];
  rows?: any[];
  rowCount?: number;
  changes?: number;
  lastInsertRowid?: number;
  executionTimeMs: number;
}

export interface EtlStatus {
  status: string;
  banco: string;
  metricas: {
    raw_count: number;
    fato_count: number;
    uf_count: number;
    geo_count: number;
    outliers_count: number;
    total_mmgd_mw: number;
    total_siga_mw: number;
    capacidade_nacional_mw: number;
  };
  logs: Array<{
    id: number;
    timestamp: string;
    origem: string;
    linhas_processadas: number;
    status: string;
    mensagem: string;
  }>;
}

export interface GeoItem {
  id: string;
  nome: string;
  tipo: string;
  nivel_tensao_kv: string;
  concessionaria: string;
  uf: string;
  municipio: string;
  lat: number;
  lon: number;
  capacidade_mva: number;
  status_auditoria: string;
  tem_gd: number;
  tem_gc: number;
}

export interface UsinaFatoGeo {
  id: string;
  nom_empreendimento: string;
  sig_uf: string;
  nom_municipio: string;
  potencia_kw: number;
  fonte_norm: string;
  faixa_regulatoria: string;
  is_outlier: number;
  lat: number;
  lon: number;
}

export interface BdgdRedeItem {
  id: string;
  uf: string;
  concessionaria: string;
  municipio: string;
  bairro: string;
  quadra: string;
  rua: string;
  cep: string;
  subestacao_nome: string;
  subestacao_tensao_kv: string;
  subestacao_cap_mva: number;
  subestacao_demanda_mw: number;
  subestacao_taxa_uso_percent: number;
  subestacao_cap_disp_gd_mw: number;
  alimentador_codigo: string;
  trafo_codigo: string;
  trafo_cap_kva: number;
  demanda_ponta_kw: number;
  demanda_fora_ponta_kw: number;
  taxa_uso_percent: number;
  potencia_gd_instalada_kw: number;
  qtd_conexoes_gd: number;
  qtd_unidades_consumidoras: number;
  inversao_fluxo_risco: string;
  tensao_fornecimento: string;
  lat: number;
  lon: number;
}

export interface SubestacaoTelemetria {
  subestacao_nome: string;
  subestacao_tensao_kv: string;
  subestacao_cap_mva: number;
  subestacao_demanda_mw: number;
  subestacao_taxa_uso_percent: number;
  subestacao_cap_disp_gd_mw: number;
  concessionaria: string;
  municipio: string;
  uf: string;
  total_alimentadores: number;
  total_trafos_mt_bt: number;
  total_gd_conectada_kw: number;
  demanda_agregada_ponta_kw: number;
}
