---
globs: ["**/import*", "**/export*", "**/persistence*", "**/boardkitFile*", "**/*Editor*"]
---

# Security Rules

## Context
Boardkit is offline-first with no backend. Main risks:
- XSS via user content
- Data corruption
- Malicious file imports

## HTML/Rich Text

### Forbidden
```typescript
// Never use v-html with user content
<div v-html="userContent" /> // DANGEROUS

// Never use innerHTML directly
element.innerHTML = userInput // DANGEROUS
```

### Required
- Tiptap sanitizes by default (verify extensions)
- If raw HTML needed, use DOMPurify

## File Import (.boardkit)

### Validation Checklist
- [ ] Max size check (50MB limit)
- [ ] Valid ZIP structure
- [ ] Valid JSON inside
- [ ] Schema validation
- [ ] Version compatibility check

### Current Mitigations
```typescript
// Size limit
if (file.size > 50 * 1024 * 1024) throw new Error('File too large')

// JSON validation
try {
  JSON.parse(content)
} catch {
  throw new Error('Invalid JSON')
}

// Schema validation (todo: implement)
validateDocument(doc)
```

## Filesystem (Tauri)

### Rules
- Use official plugins only (@tauri-apps/plugin-fs, plugin-dialog)
- No arbitrary path access
- Validate all paths
- Use dialog for user file selection

### Path Validation
```typescript
// Good: user-selected via dialog
const path = await dialog.open({ filters: [{ name: 'Boardkit', extensions: ['boardkit'] }] })

// Bad: arbitrary path
await fs.readFile('/etc/passwd') // NEVER
```

## Dependencies

### High-Risk (audit regularly)
- `jszip` — ZIP handling
- `tiptap` — Rich text
- `roughjs` — Canvas rendering

### Audit Command
```bash
pnpm audit
```

## Checklist for Security Review

- [ ] No `v-html` without sanitization
- [ ] No `eval()` or `new Function()`
- [ ] No hardcoded secrets
- [ ] Input validation at boundaries
- [ ] Error messages don't leak internals
- [ ] Dependencies audited
