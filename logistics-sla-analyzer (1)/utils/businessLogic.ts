import { parse, differenceInBusinessDays, isWeekend, addDays, startOfDay, endOfDay, isSameDay, addBusinessDays } from 'date-fns';
import { InternalRow, SLARow, MasterRecord, LogisticsStatus, RiskLevel, DashboardStats } from '../types';

export const sanitizeId = (id: string | number | undefined): string => {
  if (id === undefined || id === null) return '';
  const str = String(id).trim().toUpperCase();
  const clean = str.replace(/[^A-Z0-9]/g, '');
  return clean.replace(/^0+/, '');
};

export const parseExcelDate = (val: any): Date | null => {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === 'string') {
    const cleanVal = val.trim();
    const isoPattern = /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/;
    const isoMatch = cleanVal.match(isoPattern);
    if (isoMatch) {
       const y = parseInt(isoMatch[1], 10);
       const m = parseInt(isoMatch[2], 10) - 1;
       const d = parseInt(isoMatch[3], 10);
       return new Date(y, m, d);
    }
    const ddmmyyyyPattern = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/;
    const match = cleanVal.match(ddmmyyyyPattern);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const year = parseInt(match[3], 10);
      return new Date(year, month, day);
    }
    let d = new Date(cleanVal);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
};

export const calculateBusinessDays = (start: Date | null, end: Date | null): number => {
  if (!start || !end) return 0;
  if (start > end) return 0;
  return Math.abs(differenceInBusinessDays(end, start));
};

export const determineStatus = (
  slaRealDias: number,
  slaObjetivoDias: number,
  isEntregado: boolean,
  isDevuelto: boolean,
  isEstancado: boolean,
  isGhost: boolean,
  isHuerfano: boolean
): LogisticsStatus => {
  // PRIORITY 1: Data Integrity (If it's a ghost, that IS its status)
  if (isGhost) return LogisticsStatus.FANTASMA_SIN_URBANO;
  if (isHuerfano) return LogisticsStatus.HUERFANO_URBANO;

  // PRIORITY 2: Final outcomes
  if (isEntregado) {
    return slaRealDias > slaObjetivoDias 
      ? LogisticsStatus.ENTREGADO_FUERA_DE_SLA 
      : LogisticsStatus.EN_SLA;
  }
  if (isDevuelto) return LogisticsStatus.DEVUELTO;

  // PRIORITY 3: In-transit anomalies
  if (isEstancado) return LogisticsStatus.ESTANCADO;
  if (slaRealDias > slaObjetivoDias) return LogisticsStatus.NO_ENTREGADO_DEMORADO;
  
  return LogisticsStatus.PENDIENTE;
};

export const calculateRisk = (
  status: LogisticsStatus, 
  diasSinMov: number, 
  slaConsumido: number, 
  hasTwoVisits: boolean
): RiskLevel => {
  // CRITICAL if:
  // - Stagnant Ghost (>3 days since preparation)
  // - Stagnant in Transit (>3 days since last carrier event)
  // - Delayed beyond SLA
  // - 2 Failed Visits
  if (
    status === LogisticsStatus.NO_ENTREGADO_DEMORADO || 
    status === LogisticsStatus.ESTANCADO ||
    (status === LogisticsStatus.FANTASMA_SIN_URBANO && diasSinMov >= 3) ||
    (hasTwoVisits && status !== LogisticsStatus.DEVUELTO && status !== LogisticsStatus.EN_SLA && status !== LogisticsStatus.ENTREGADO_FUERA_DE_SLA)
  ) {
    return RiskLevel.CRITICAL;
  }

  if (status === LogisticsStatus.FANTASMA_SIN_URBANO || status === LogisticsStatus.HUERFANO_URBANO || slaConsumido >= 75 || diasSinMov >= 2) {
    return RiskLevel.MEDIUM;
  }

  return RiskLevel.LOW;
};

export const suggestAction = (record: Partial<MasterRecord>): string => {
  if (record.status === LogisticsStatus.FANTASMA_SIN_URBANO) {
    return (record.diasSinMovimiento || 0) >= 3 
      ? "URGENTE: Bulto extraviado en Depósito (+72hs)" 
      : "Verificar Despacho / Manifiesto";
  }
  if (record.status === LogisticsStatus.ESTANCADO) return "Reclamo Estancamiento Urbano (+72hs)";
  if (record.status === LogisticsStatus.NO_ENTREGADO_DEMORADO) return "Priorizar Entrega (Vencido)";
  if (record.isHuerfano) return "Cargar referencia interna";
  if (record.isDevuelto) return "Analizar Devolución";
  if (record.hasTwoVisits) return "Gestionar 3ra visita";
  
  return "Seguimiento normal";
};

const normalizeRow = (row: any): any => {
  const newRow: any = {};
  if (!row || typeof row !== 'object') return newRow;
  Object.keys(row).forEach(key => {
    const cleanKey = key.trim().toLowerCase();
    newRow[cleanKey] = row[key];
  });
  return newRow;
};

export const calculateDashboardStats = (data: MasterRecord[]): DashboardStats => {
    const total = data.length;
    const delivered = data.filter(r => r.isEntregado).length;
    const ghosts = data.filter(r => r.isGhost).length;
    const huerfanos = data.filter(r => r.isHuerfano).length;
    const stagnant = data.filter(r => r.status === LogisticsStatus.ESTANCADO).length;
    const delayed = data.filter(r => r.status === LogisticsStatus.NO_ENTREGADO_DEMORADO).length;
    const returned = data.filter(r => r.isDevuelto).length;

    let totalCycle = 0;
    let cycleCount = 0;
    data.forEach(r => {
        if(r.isEntregado && (r.fechaPI || r.fechaGE)) {
            const start = r.fechaPI || r.fechaGE;
            const end = r.fecha1raVisita || r.fechaAR;
            if(start && end) {
                totalCycle += calculateBusinessDays(start, end);
                cycleCount++;
            }
        }
    });
    const avgCycleTime = cycleCount > 0 ? parseFloat((totalCycle / cycleCount).toFixed(1)) : 0;

    return {
        date: new Date().toISOString(),
        total, delivered, performanceRate: total > 0 ? parseFloat(((delivered/total)*100).toFixed(1)) : 0,
        ghosts, stagnant, delayed, returned, huerfanos, avgCycleTime
    };
};

const extractId = (row: any): string => {
    const raw = row['referenciaprincipal'] || row['referencia principal'] || row['referencia'] || row['codigo pedido'] || row['remito'] || row['orden'] || row['tracking'] || row['nro'];
    return String(raw || '').trim();
};

export const processLogisticsData = (
  internalData: InternalRow[], 
  urbanoData: InternalRow[], 
  slaData: SLARow[]
): MasterRecord[] => {
  const normSLAData = slaData.map(normalizeRow);
  const normUrbanoData = urbanoData.map(normalizeRow);
  const normInternalData = internalData.map(normalizeRow);

  const slaMap = new Map<string, any>();
  normSLAData.forEach(row => {
    const cp = String(row['codigo postal'] || '').trim();
    if(cp) slaMap.set(cp, row);
  });

  const urbanoMap = new Map<string, { row: any, matched: boolean }>();
  normUrbanoData.forEach(row => {
    const potentialIdKeys = ['codigo pedido', 'referencia', 'remito', 'tracking', 'orden', 'nro'];
    potentialIdKeys.forEach(key => {
      if (row[key]) {
        const val = sanitizeId(row[key]);
        if (val.length > 2) urbanoMap.set(val, { row, matched: false });
      }
    });
  });

  const processed: MasterRecord[] = [];
  const processedIds = new Set<string>();
  const now = new Date();

  normInternalData.forEach(row => {
    const originalId = extractId(row);
    if (!originalId || originalId === '' || originalId === 'undefined') return;

    const rawClient = row['razon social'] || row['razonsocial'] || row['cliente'] || row['username'] || 'Desconocido';
    const client = String(rawClient).toUpperCase();
    const fuente = String(row['fuente'] || '').toUpperCase().trim();

    let canonicalId = originalId;
    if (fuente === 'TN') {
        if (client.includes('ANKER') && !originalId.toUpperCase().startsWith('ANKER')) canonicalId = `ANKER${originalId}`;
        else if ((client.includes('TONI')) && !originalId.toUpperCase().startsWith('TONIP')) canonicalId = `TONIP${originalId}`;
        else if (client.includes('AJAX') && !originalId.toUpperCase().startsWith('AJAX')) canonicalId = `AJAX${originalId}`;
    }

    const sanitizedId = sanitizeId(canonicalId);
    const sanitizedOriginal = sanitizeId(originalId);

    if (processedIds.has(sanitizedId)) return;
    processedIds.add(sanitizedId);

    let uMatch = urbanoMap.get(sanitizedId) || urbanoMap.get(sanitizedOriginal);
    if (uMatch) uMatch.matched = true;

    const finalRow = uMatch ? { ...row, ...uMatch.row } : row;
    processed.push(createRecordFromRow(finalRow, !!uMatch, false, slaMap, canonicalId, originalId, client, now));
  });

  urbanoMap.forEach((val, sId) => {
    if (!val.matched && !processedIds.has(sId)) {
        processedIds.add(sId);
        const row = val.row;
        const originalId = extractId(normalizeRow(row)) || sId;
        const potentialClientKeys = ['cuenta', 'remitente', 'nombre cliente', 'razon social', 'empresa'];
        let client = "[SÓLO EN URBANO]";
        for (const cKey of potentialClientKeys) {
            if (row[cKey]) { client = `${String(row[cKey]).toUpperCase()}`; break; }
        }
        processed.push(createRecordFromRow(row, true, true, slaMap, originalId, originalId, client, now));
    }
  });

  return processed;
};

function createRecordFromRow(finalRow: any, hasUrbano: boolean, isHuerfano: boolean, slaMap: Map<string, any>, id: string, originalId: string, client: string, now: Date): MasterRecord {
    const cp = String(finalRow['codigo postal'] || finalRow['cp'] || '').trim();
    const slaInfo = slaMap.get(cp);

    const fechaPI = parseExcelDate(finalRow['fecha pi']) || parseExcelDate(finalRow['fecha_pedido']) || parseExcelDate(finalRow['fecha_pe']) || parseExcelDate(finalRow['fecha_preparacion']);
    const fechaGE = parseExcelDate(finalRow['fecha ge']);
    const fechaAS = parseExcelDate(finalRow['fecha as']);
    const fechaAR = parseExcelDate(finalRow['fecha ar']);
    const fecha1raVisita = parseExcelDate(finalRow['fecha 1ra visita']);
    const fecha2daVisita = parseExcelDate(finalRow['fecha 2da visita']);

    const motivo1 = String(finalRow['motivo'] || '').toLowerCase();
    const rawEstado = String(finalRow['estado'] || '').toUpperCase();
    const isEntregado = rawEstado === 'ENTREGADO' || motivo1.includes('entregado');
    const isDevuelto = rawEstado === 'DEVUELTO' || motivo1.includes('devolucion') || (finalRow['tipo de servicio'] || '').toUpperCase() === 'RETIRO';
    
    // Ghost Logic
    const isGhost = !hasUrbano && !isEntregado && !isHuerfano;
    
    const eventList = [
        { d: fecha2daVisita, l: '2da Visita' },
        { d: fecha1raVisita, l: '1ra Visita' },
        { d: fechaAR, l: 'Arribo Sucursal (AR)' },
        { d: fechaAS, l: 'Salida a Sucursal (AS)' },
        { d: fechaGE, l: 'Ingreso Urbano (GE)' },
        { d: fechaPI, l: 'Preparado (PI)' }
    ].filter(e => e.d !== null).sort((a, b) => b.d!.getTime() - a.d!.getTime());

    const lastEvent = eventList.length > 0 ? eventList[0] : null;
    const slaObjetivoHoras = slaInfo ? (slaInfo['sla_despacho_horas'] || 48) : 48;
    const slaObjetivoDias = Math.ceil(slaObjetivoHoras / 24);
    
    let slaStartDate = fechaGE || (isGhost ? fechaPI : null);
    let slaEndDate = isEntregado ? (fecha1raVisita || fechaAR || now) : now;
    const slaRealDias = slaStartDate ? calculateBusinessDays(slaStartDate, slaEndDate) : 0;
    
    const movementDates = [fechaGE, fechaAS, fechaAR, fecha1raVisita, fecha2daVisita].filter(d => d !== null) as Date[];
    const lastMovement = movementDates.length > 0 ? new Date(Math.max(...movementDates.map(d => d.getTime()))) : null;
    
    let diasSinMovimiento = 0;
    if (!isEntregado && !isDevuelto) {
        if (lastMovement) diasSinMovimiento = calculateBusinessDays(lastMovement, now);
        else if (isGhost && fechaPI) diasSinMovimiento = calculateBusinessDays(fechaPI, now);
        else if (isHuerfano && fechaGE) diasSinMovimiento = calculateBusinessDays(fechaGE, now);
    }
    const isEstancado = !isEntregado && !isDevuelto && !isGhost && diasSinMovimiento >= 3;

    const status = determineStatus(slaRealDias, slaObjetivoDias, isEntregado, isDevuelto, isEstancado, isGhost, isHuerfano);
    const riskLevel = calculateRisk(status, diasSinMovimiento, slaObjetivoDias > 0 ? (slaRealDias / slaObjetivoDias) * 100 : 0, !!fecha2daVisita);

    const record: MasterRecord = {
      id, originalId, client, cp,
      localidad: slaInfo ? (slaInfo['descripción urbano'] || slaInfo['descripcion urbano']) : (finalRow['localidad'] || 'Desconocido'),
      provincia: slaInfo ? slaInfo['denom_prov'] : (finalRow['provincia'] || 'Desconocido'),
      peso: Number(finalRow['peso (kg)']) || 0,
      sku: finalRow['sku'] || '', productName: finalRow['nombre'] || '', quantity: finalRow['cantidad'] || 0,
      fechaPI, fechaGE, fechaAS, fechaAR, fecha1raVisita, fecha2daVisita,
      fechaLimite: slaStartDate ? addBusinessDays(slaStartDate, slaObjetivoDias) : null,
      lastEventDate: lastEvent ? lastEvent.d : null,
      lastEventDescription: lastEvent ? lastEvent.l : 'Sin Datos',
      motivo1: finalRow['motivo'] || '', motivo2: finalRow['motivo (2)'] || '',
      estado: rawEstado, tipoServicio: finalRow['tipo de servicio'] || '', observacion: finalRow['observacion'] || '',
      slaObjetivoHoras, slaObjetivoDias, slaRealDias, diasAtraso: Math.max(0, slaRealDias - slaObjetivoDias),
      diasSinMovimiento, slaPorcentajeConsumido: slaObjetivoDias > 0 ? (slaRealDias / slaObjetivoDias) * 100 : 0,
      diasGestionInterna: (fechaPI && fechaGE) ? calculateBusinessDays(fechaPI, fechaGE) : 0,
      diasGestionCorreo: fechaGE ? calculateBusinessDays(fechaGE, slaEndDate) : 0,
      isEntregado, isDevuelto, isGhost, isHuerfano, hasTwoVisits: !!fecha2daVisita,
      status, riskLevel
    };
    record.accionSugerida = suggestAction(record);
    return record;
}
