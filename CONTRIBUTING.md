# Guía de Contribución

¡Gracias por tu interés en contribuir!

## 1. Configuración inicial

```bash
npm install
copy .env.example .env     # Windows
cp .env.example .env       # Unix
npm run start:dev
```

## 2. Ramas

| Prefijo | Uso |
|---|---|
| `feature/` | Nueva funcionalidad |
| `fix/` | Corrección de bug |
| `docs/` | Documentación |
| `refactor/` | Refactor sin cambio funcional |
| `test/` | Tests |

## 3. Commits Convencionales

`tipo(alcance): descripción` — tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.

```
feat(ventas): agregar estrategia de descuento por cantidad
fix(clientes): validar email duplicado sin distinguir mayusculas
```

## 4. Desarrollo

- Seguir el checklist de nuevos módulos del `AGENT.md` raíz.
- Mantener la separación de capas: controller → service → repository (interfaz).
- Agregar tests con cada cambio.

## 5. Pull Request

- [ ] `npm run lint` sin errores
- [ ] `npm test` en verde
- [ ] `CHANGELOG.md` actualizado
- [ ] `AGENT.md` del módulo actualizado si cambió la estructura
- [ ] Postman actualizado si cambió la API

## 6. Reglas del código

- TypeScript estricto, `async/await`, sin `console.log` (usar `Logger`)
- Errores de negocio con `AppError` y subclases
- Services sin `req`/`res` ni imports de TypeORM
- Nuevas reglas de venta en `rules/`, nuevos cálculos de precio en `pricing/`
- Cobertura de tests objetivo: 80% o más

## 7. Estructura

Ver `README.md` y `AGENT.md`.
