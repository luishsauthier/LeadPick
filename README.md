# LeadPick

Ferramenta interna da equipe comercial da BIMachine para limpar bases de leads em CSV.

## O que faz

1. Upload de CSV e mapeamento de colunas
2. Confirmação para apagar todos os Bads (`Identificador` começando com `[BADS]`)
3. Decisão estilo “esse ou esse” para e-mails e empresas duplicados
4. Export da base limpa + log local de metadados

## Desenvolvimento

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

Publicado via GitHub Pages em `/LeadPick/`.
