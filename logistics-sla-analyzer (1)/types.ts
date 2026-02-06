
export interface InternalRow {
  // Standard / Old Internal / Urbano Columns
  Nro?: string | number;
  'Codigo Pedido'?: string;
  'Codigo Postal'?: string;
  'Peso (Kg)'?: number;
  'Fecha PP'?: string;
  'Fecha EP'?: string;
  'Fecha PR'?: string;
  'Fecha CW'?: string;
  'Fecha PI'?: string;
  'Fecha GE'?: string;
  'Fecha AS'?: string;
  'Fecha AR'?: string;
  'Fecha 1ra Visita'?: string;
  'Motivo'?: string;
  'Fecha 2da Visita'?: string;
  'Motivo (2)'?: string;
  'En custodia'?: string;
  'Estado'?: string;
  'Tipo de servicio'?: string;
  'Observacion'?: string;

  // New Internal File Columns
  razonSocial?: string;
  Fecha_pr?: string;
  Fecha_pe?: string;
  tipo?: string;
  fuente?: string;
  referencia?: string; // Mapped to ID
  cantidad?: number;
  ean?: string;
  sku?: string;
  nombre?: string;
  username?: string;

  // User Specific Custom Columns
  referenciaPrincipal?: string;
  Fecha_preparacion?: string;
  Fecha_pedido?: string;
  Cliente?: string;
}

export interface SLARow {
  'Codigo Postal': string;
  'Descripción Urbano': string;
  'SLA_Despacho_Horas': number;
  'DENOM_PROV': string;
}

export enum LogisticsStatus {
  EN_SLA = 'EN_SLA',
  FUERA_DE_SLA = 'FUERA_DE_SLA',
  ENTREGADO_FUERA_DE_SLA = 'ENTREGADO_FUERA_DE_SLA',
  NO_ENTREGADO_DEMORADO = 'NO_ENTREGADO_DEMORADO',
  ESTANCADO = 'ESTANCADO',
  DEVUELTO = 'DEVUELTO',
  PENDIENTE = 'PENDIENTE', // Within SLA, not delivered
  FANTASMA_SIN_URBANO = 'FANTASMA_SIN_URBANO', // Dispatched internally, not in Urbano file
  HUERFANO_URBANO = 'HUERFANO_URBANO' // In Urbano file, but missing from Internal file
}

export enum RiskLevel {
  LOW = 'LOW',       // Green: On time, moving
  MEDIUM = 'MEDIUM', // Yellow: >75% SLA used, or 1 visit failed
  CRITICAL = 'CRITICAL' // Red: Late, Stagnant > 3 days, or 2 visits failed
}

export interface MasterRecord {
  id: string; // Modified Tracking ID (with prefix)
  originalId: string; // Original Raw Tracking ID
  client: string; // Name of the client
  cp: string;
  localidad: string;
  provincia: string;
  peso: number;
  
  // Product Info
  sku: string;
  productName: string;
  quantity: number;

  // Dates (Normalized to Date objects or null)
  fechaPI: Date | null;
  fechaGE: Date | null;
  fechaAS: Date | null;
  fechaAR: Date | null;
  fecha1raVisita: Date | null;
  fecha2daVisita: Date | null;
  fechaLimite: Date | null; // Calculated Deadline
  
  // Last Event Tracking
  lastEventDate: Date | null;
  lastEventDescription: string;

  // Text Data
  motivo1: string;
  motivo2: string;
  estado: string;
  tipoServicio: string;
  observacion: string;

  // Calculation Results
  slaObjetivoHoras: number; // Original
  slaObjetivoDias: number;  // Converted / 24
  slaRealDias: number;      // Business Days
  diasSinMovimiento: number; // Business Days
  diasAtraso: number;       // Positive if late
  slaPorcentajeConsumido: number; // % of SLA used
  
  // Cycle Time Analysis
  diasGestionInterna: number; // PI -> GE
  diasGestionCorreo: number;  // GE -> End
  
  // Flags & Risks
  isEntregado: boolean;
  isDevuelto: boolean;
  isGhost: boolean; // True if in Internal but not in Urbano
  isHuerfano: boolean; // True if in Urbano but not in Internal
  hasTwoVisits: boolean; // True if 2 visits done but not delivered
  status: LogisticsStatus;
  riskLevel: RiskLevel;
  
  // Analysis helpers
  motivoDevolucion?: string;
  tramoDevolucion?: string;
  accionSugerida?: string; // AI/Logic suggested action
}

export interface FileState {
  internal: File | null;
  urbano: File | null;
  sla: File | null;
}

export interface DashboardStats {
  date: string; // ISO Date of the report
  total: number;
  delivered: number;
  performanceRate: number; // %
  ghosts: number;
  stagnant: number;
  delayed: number;
  returned: number;
  huerfanos: number;
  avgCycleTime: number;
}

export interface HistoryRecord {
  id: string;
  savedAt: number; // timestamp
  stats: DashboardStats;
  fileName: string;
}
