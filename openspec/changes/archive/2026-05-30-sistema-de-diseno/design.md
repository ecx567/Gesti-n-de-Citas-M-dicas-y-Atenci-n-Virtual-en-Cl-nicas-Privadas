# Design: Sistema de Diseño

## Technical Approach

Crear `src/theme/index.ts` con design tokens planos y tipados (`as const`), y migrar 5 screens reemplazando cada valor hardcodeado por una referencia al token. Refactor puro — no cambia comportamiento, no agrega dependencias, no introduce Context ni Provider.

## Architecture Decisions

### Decision: Plain named exports vs. ThemeContext

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `ThemeContext` + Provider | Permite dark mode futuro pero agrega wrapping, boilerplate, y re-renders | ❌ Rechazado |
| Single `theme` object (`import { theme } from '@/theme'`) | Simple, pero `theme.colors.primary` es más verboso que `colors.primary` | ❌ Rechazado |
| **Named exports con `as const`** | Máximo type safety, sin boilerplate, import directo y tree-shakeable | ✅ **Elegido** |

**Rationale**: Named exports (`import { colors, spacing } from '@/theme'`) dan el mismo type safety que un objeto único pero con menos typing. No hay runtime overhead. `as const` permite que TypeScript infiera los valores literales, no solo `string`.

### Decision: Single file vs. Multi-file module

**Choice**: Single file `src/theme/index.ts` (~80 líneas)
**Alternatives considered**: `src/theme/` con `colors.ts`, `spacing.ts`, `typography.ts`, `shadows.ts`, `borderRadius.ts` + barrel `index.ts`
**Rationale**: El token set es pequeño (~20 colores, ~13 spacings, ~7 font sizes, ~3 shadows). Un solo file es más fácil de navegar y editar. Separar en 5 archivos + barrel agrega over-engineering sin beneficio real. Si crece, se separa después.

## Token Inventory (extraído del codebase)

```
colors:
  primary:        '#0891B2'
  textPrimary:    '#0F172A'
  textSecondary:  '#64748B'
  textBody:       '#334155'
  textMuted:      '#94A3B8'
  iconMuted:      '#CBD5E1'
  border:         '#E2E8F0'
  divider:        '#F1F5F9'
  background:     '#F8FAFC'
  white:          '#FFFFFF'
  primaryLight:   '#ECFEFF'
  error:          '#DC2626'
  errorBg:        '#FEF2F2'
  errorBorder:    '#FECACA'
  success:        '#16A34A'
  successBg:      '#F0FDF4'
  warning:        '#D97706'
  warningBg:      '#FFFBEB'
  successIcon:    '#059669'
  successIconBg:  '#D1FAE5'

spacing: { xs:4, sm:6, md:8, lg:10, xl:12, '2xl':14, '3xl':16, '4xl':20, '5xl':24, '6xl':32, '7xl':40, '8xl':48, '9xl':60 }

borderRadius: { sm:8, md:10, lg:12, xl:14, '2xl':16, full:9999 }

fontSize: { xs:12, sm:13, base:14, lg:15, xl:16, '2xl':18, '3xl':20, '4xl':22, '5xl':28 }

fontWeight: { normal:'400', medium:'500', semibold:'600', bold:'700' }

shadows:
  card: { shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:8, elevation:3 }
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/theme/index.ts` | Create | ~80 líneas con todos los tokens exportados como const + `as const` |
| `src/app/(auth)/login.tsx` | Modify | Reemplazar ~115 líneas de StyleSheet con referencias a tokens |
| `src/app/(auth)/forgot-password.tsx` | Modify | Ídem, ~120 líneas de estilos migradas |
| `src/app/(app)/profile.tsx` | Modify | ~80 líneas migradas, incluye shadow token |
| `src/app/(app)/(patient)/home.tsx` | Modify | ~190 líneas migradas, incluye card shadows, loader, error, empty states |
| `src/app/(app)/appointment/[id].tsx` | Modify | ~150 líneas migradas, 3 StyleSheets, múltiples shadows |

## Data Flow

N/A — refactor puro.

## Interfaces

```typescript
export const colors = { primary: '#0891B2', ... } as const;
export const spacing = { xs: 4, sm: 6, ... } as const;
export const borderRadius = { sm: 8, ... } as const;
export const fontSize = { xs: 12, ... } as const;
export const fontWeight = { normal: '400', ... } as const;
export const shadows = { card: { ... } } as const;
```

## Migration Strategy

1. Crear `src/theme/index.ts`
2. Migrar `login.tsx` (más simple, establece patrón)
3. Migrar `forgot-password.tsx` (mismo patrón)
4. Migrar `appointment/[id].tsx` (3 StyleSheets + shadows)
5. Migrar `profile.tsx` (shadow en menuSection)
6. Migrar `home.tsx` (el más grande, ~190 líneas de estilos)

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| TypeScript | Compilación | `tsc --noEmit` sin errores |
| Visual | Regresión visual | Revisión manual en simulator |
| Unit | Tests existentes | `npx jest` — 40 tests deben pasar |
| Validation | Hardcodeados residuales | `grep '#[0-9A-Fa-f]\{6\}'` → 0 resultados |

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Typo en nombre de token | Medium | TypeScript catch en compile-time |
| Olvidar reemplazar valor | Low | `grep` post-migración + code review |
| Regresión visual | Low | Revisión en simulator + tests existentes |

**Overall risk**: LOW — refactor mecánico, type-safe.

## Open Questions

Ninguna.

## Rollback

Revertir el commit. Eliminar `src/theme/`. Screens vuelven a valores hardcodeados.
