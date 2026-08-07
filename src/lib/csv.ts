import Papa from 'papaparse'
import type { Lead, LeadRow } from '../types/lead'

export type ParsedCsv = {
  headers: string[]
  leads: Lead[]
}

export function parseCsvFile(file: File): Promise<ParsedCsv> {
  return new Promise((resolve, reject) => {
    Papa.parse<LeadRow>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => h.trim(),
      complete: (result) => {
        if (result.errors.length > 0 && result.data.length === 0) {
          reject(new Error(result.errors[0]?.message ?? 'Erro ao ler CSV'))
          return
        }

        const headers =
          result.meta.fields?.filter((h) => h && h.trim().length > 0) ?? []

        const leads: Lead[] = result.data
          .map((row, index) => {
            const cleaned: LeadRow = {}
            for (const key of headers) {
              const raw = row[key]
              cleaned[key] =
                raw === undefined || raw === null ? '' : String(raw).trim()
            }
            const hasAny = Object.values(cleaned).some((v) => v.length > 0)
            if (!hasAny) return null
            return { id: `lead-${index}-${Math.random().toString(36).slice(2, 8)}`, row: cleaned }
          })
          .filter((l): l is Lead => l !== null)

        resolve({ headers, leads })
      },
      error: (err) => reject(err),
    })
  })
}

export function leadsToCsv(leads: Lead[], headers: string[]): string {
  const data = leads.map((lead) => {
    const out: LeadRow = {}
    for (const h of headers) {
      out[h] = lead.row[h] ?? ''
    }
    return out
  })
  return Papa.unparse(data, { columns: headers, header: true })
}

export function downloadCsv(content: string, fileName: string) {
  const blob = new Blob(['\uFEFF' + content], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

const EMAIL_HINTS = ['email', 'e-mail', 'mail', 'correio']
const EMPRESA_HINTS = ['empresa', 'company', 'negocio', 'negócio', 'business', 'firma']
const ID_HINTS = ['identificador', 'identifier', 'id', 'status']
const NOME_HINTS = ['nome', 'name', 'contato', 'contact']
const TEL_HINTS = ['telefone', 'phone', 'celular', 'whatsapp', 'tel']

function findHeader(headers: string[], hints: string[]): string | undefined {
  const lower = headers.map((h) => ({ raw: h, n: h.toLowerCase() }))
  for (const hint of hints) {
    const exact = lower.find((h) => h.n === hint)
    if (exact) return exact.raw
  }
  for (const hint of hints) {
    const partial = lower.find((h) => h.n.includes(hint))
    if (partial) return partial.raw
  }
  return undefined
}

export function guessMapping(headers: string[]) {
  return {
    email: findHeader(headers, EMAIL_HINTS),
    empresa: findHeader(headers, EMPRESA_HINTS),
    identificador: findHeader(headers, ID_HINTS) ?? findHeader(headers, ['identificador']),
    nome: findHeader(headers, NOME_HINTS),
    telefone: findHeader(headers, TEL_HINTS),
  }
}
