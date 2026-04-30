
/**
 * ATLAS Optimization Service
 * Handles local intent detection, text preprocessing, and caching.
 */

// Simple in-memory cache for responses
const responseCache: Record<string, string> = {};
const MAX_CACHE_SIZE = 50;

/**
 * Pre-processing: Normalize and correct user text
 */
export function preprocessText(text: string): string {
  let normalized = text.toLowerCase().trim();
  
  // Standardize project/brand name
  normalized = normalized.replace(/focoflow/g, 'foco flow');
  normalized = normalized.replace(/focoflo/g, 'foco flow');
  normalized = normalized.replace(/foco flo/g, 'foco flow');
  normalized = normalized.replace(/focus flow/g, 'foco flow');
  
  // Action standardization
  normalized = normalized.replace(/registrar/g, 'salvar');
  normalized = normalized.replace(/anote/g, 'salvar');
  normalized = normalized.replace(/marcar/g, 'salvar');
  normalized = normalized.replace(/adicione/g, 'salvar');
  normalized = normalized.replace(/incluir/g, 'salvar');
  normalized = normalized.replace(/insira/g, 'salvar');
  
  // Financial terms normalization
  normalized = normalized.replace(/gastei/g, 'despesa');
  normalized = normalized.replace(/paguei/g, 'despesa');
  normalized = normalized.replace(/compro/g, 'despesa');
  normalized = normalized.replace(/saída/g, 'despesa');
  normalized = normalized.replace(/recebi/g, 'entrada');
  normalized = normalized.replace(/ganhei/g, 'entrada');
  normalized = normalized.replace(/salario/g, 'entrada');
  normalized = normalized.replace(/vendi/g, 'entrada');
  
  // Clean up common fillers
  normalized = normalized.replace(/por favor/g, '');
  normalized = normalized.replace(/atlas/g, '');
  
  // Remove multiple spaces
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

/**
 * Intent Detection: Identify user intent without AI
 */
export type Intent = 'SALVAR_DADO' | 'CONSULTAR_SALDO' | 'CONSULTAR_RELATORIO' | 'OUTRO';

export function detectIntent(text: string): Intent {
  const normalized = preprocessText(text);
  
  // Specific patterns for financial consultation (priority)
  if (normalized.includes('saldo') || normalized.includes('quanto tenho') || normalized.includes('balanço') || normalized.includes('meu dinheiro')) {
    return 'CONSULTAR_SALDO';
  }
  
  if (normalized.includes('relatório') || normalized.includes('resumo do mês') || (normalized.includes('quanto') && normalized.includes('despesa'))) {
    return 'CONSULTAR_RELATORIO';
  }

  // Saving data keywords (if not consultation)
  if (
    normalized.includes('salvar') || 
    normalized.includes('anotar') || 
    normalized.includes('registrar') ||
    normalized.includes('despesa') ||
    normalized.includes('entrada') ||
    (/(\d+)/.test(normalized) && (normalized.includes('com') || normalized.includes('em') || normalized.includes('de')))
  ) {
    // Check if it has an amount
    if (/(\d+([.,]\d{1,2})?)/.test(normalized)) {
       return 'SALVAR_DADO';
    }
  }
  
  return 'OUTRO';
}

/**
 * Data Extraction: Extract value, type, and category using Regex
 */
export interface ExtractedData {
  amount?: number;
  type?: 'income' | 'expense';
  category?: string;
  description?: string;
}

export function extractFinancialData(text: string): ExtractedData {
  const normalized = preprocessText(text);
  const data: ExtractedData = {};
  
  // Extract amount (matches numbers like 10, 10.50, 1.000, etc)
  const amountMatch = normalized.match(/(\d+([.,]\d{1,2})?)/);
  if (amountMatch) {
    data.amount = parseFloat(amountMatch[1].replace(',', '.'));
  }
  
  // Detect type
  if (normalized.includes('despesa') || normalized.includes('paguei') || normalized.includes('gasto') || normalized.includes('compro') || normalized.includes('saída')) {
    data.type = 'expense';
  } else if (normalized.includes('entrada') || normalized.includes('recebi') || normalized.includes('ganhei') || normalized.includes('salário') || normalized.includes('renda')) {
    data.type = 'income';
  }
  
  // Simple category detection
  const categories: Record<string, string[]> = {
    'Alimentação': ['mercado', 'comida', 'jantar', 'lanche', 'restaurante', 'ifood', 'merenda'],
    'Transporte': ['uber', 'ônibus', 'combustível', 'gasolina', 'carro', 'metrô'],
    'Lazer': ['cinema', 'show', 'viagem', 'festa', 'cerveja'],
    'Saúde': ['farmácia', 'médico', 'consulta', 'remédio'],
    'Moradia': ['aluguel', 'luz', 'água', 'internet', 'condomínio'],
    'Educação': ['curso', 'livro', 'escola', 'faculdade'],
  };
  
  for (const [cat, keywords] of Object.entries(categories)) {
    if (keywords.some(kw => normalized.includes(kw))) {
      data.category = cat;
      break;
    }
  }
  
  // Fallback category
  if (!data.category) data.category = 'Outros';
  
  // Extract description (everything except amount and keywords)
  let description = normalized
    .replace(/(\d+([.,]\d{1,2})?)/, '')
    .replace(/salvar|anotar|registrar|despesa|entrada|paguei|recebi|no foco flow|foco flow/g, '')
    .trim();
  
  data.description = description || 'Transação rápida';
  
  return data;
}

/**
 * Cache Management
 */
export function getFromCache(text: string): string | null {
  const normalized = preprocessText(text);
  return responseCache[normalized] || null;
}

export function saveToCache(text: string, response: string): void {
  const normalized = preprocessText(text);
  
  // Prevent cache bloat
  const keys = Object.keys(responseCache);
  if (keys.length >= MAX_CACHE_SIZE) {
    delete responseCache[keys[0]];
  }
  
  responseCache[normalized] = response;
}
