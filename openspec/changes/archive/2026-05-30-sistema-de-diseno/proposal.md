# Proposal: Sistema de Diseño

## Intent

Eliminar la duplicación masiva de design tokens hardcodeados en todos los estilos del layout. `#0891B2` aparece 19+ veces, `#0F172A` 16+, `#64748B` 15+, `#FFFFFF` 20+, shadows y border radii se repiten idénticos. Esto no escala: cambiar el color primario requiere tocar 5+ archivos, y dark mode es imposible sin una fuente única de verdad.

## Scope

### In Scope
- `src/theme/index.ts` — objeto `theme` con colores, spacing, typography, shadows, borderRadii
- Migrar 5 screens proof-of-concept a `StyleSheet.create` basado en `theme`
- Borrar valores hardcodeados de los screens migrados

### Out of Scope
- Dark mode y dynamic theming (requiere `ThemeContext`)
- Component library o componentes reutilizables (botones, cards, inputs)
- Screens no listados en el alcance — se migran en cambios futuros

## Capabilities

### New Capabilities
None — refactor puro, no introduce capacidades nuevas.

### Modified Capabilities
None — el comportamiento de las pantallas no cambia. Solo cambia la fuente de los valores de estilo.

## Approach

Crear `src/theme/index.ts` como objeto plano (sin context, sin hooks):

```ts
export const theme = {
  colors: { primary: '#0891B2', textPrimary: '#0F172A', textSecondary: '#64748B', background: '#F8FAFC', surface: '#FFFFFF', border: '#E2E8F0' },
  spacing: { sm: 8, md: 16, lg: 20, xl: 24 },
  borderRadius: { sm: 10, md: 12, lg: 16 },
  shadow: { card: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 } },
  typography: { ... } // sizes, weights
}
```

Cada screen importa `{ theme }` y reemplaza valores hardcodeados con `theme.colors.primary`, `theme.spacing.md`, etc.

Orden: crear `theme/` → migrar login.tsx → forgot-password.tsx → profile.tsx → home.tsx → [id].tsx.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/theme/index.ts` | New | Objeto de design tokens (colores, spacing, borders, shadows, typography) |
| `src/app/(auth)/login.tsx` | Modified | Importa theme, elimina ~40 líneas de valores hardcodeados |
| `src/app/(auth)/forgot-password.tsx` | Modified | Importa theme, elimina ~45 líneas hardcodeadas |
| `src/app/(app)/appointment/[id].tsx` | Modified | Importa theme, shadows y border radii centralizados |
| `src/app/(app)/profile.tsx` | Modified | Importa theme, elimina ~30 líneas hardcodeadas |
| `src/app/(app)/(patient)/home.tsx` | Modified | Importa theme, elimina ~60 líneas hardcodeadas |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Olvidar reemplazar un valor hardcodeado | Low | Code review + `grep '#[0-9A-Fa-f]'` en archivos migrados |
| Theme cambia y un screen no se actualiza | Low | Solo se usa `theme` — cambiar el source cambia todos |

## Rollback Plan

Revertir el commit. Borrar `src/theme/`. Los screens vuelven a valores hardcodeados.

## Dependencies

Ninguna — el theme es JS puro, no requiere paquetes nuevos.

## Success Criteria

- [ ] `src/theme/index.ts` exporta un objeto `theme` con todos los tokens actuales
- [ ] Los 5 screens migrados NO contienen `#0891B2`, `#0F172A`, `#64748B`, `#F8FAFC`, `#E2E8F0` hardcodeados
- [ ] `grep -r '#[0-9A-Fa-f]\{6\}'` en los 5 screens arroja 0 resultados
- [ ] Visual appearance es idéntico — no hay regresiones visibles
- [ ] `tsc --noEmit` pasa sin errores
