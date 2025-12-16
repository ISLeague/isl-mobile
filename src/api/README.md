# 📁 API Modular - Estructura

Esta carpeta contiene toda la lógica de comunicación con el backend de forma modularizada y desacoplada.

## 🗂️ Estructura de Archivos

```
src/api/
├── client/                    # Configuración del cliente HTTP
│   ├── axiosClient.ts        # Cliente Axios con interceptores
│   └── authHelpers.ts        # Helpers para manejo de tokens
├── services/                  # Servicios por dominio (1 archivo = 1 recurso)
│   ├── auth.service.ts       # Autenticación (login, register, logout)
│   ├── paises.service.ts     # Países
│   ├── torneos.service.ts    # Torneos
│   ├── equipos.service.ts    # Equipos
│   ├── jugadores.service.ts  # Jugadores
│   ├── partidos.service.ts   # Partidos
│   └── ...                   # Un archivo por cada recurso (16 total)
├── types/                     # Tipos e interfaces TypeScript (modularizados)
│   ├── auth.types.ts         # Types de autenticación
│   ├── categorias.types.ts   # Types de categorías
│   ├── ediciones.types.ts    # Types de ediciones
│   ├── equipos.types.ts      # Types de equipos
│   ├── fases.types.ts        # Types de fases
│   ├── jugadores.types.ts    # Types de jugadores
│   ├── locales.types.ts      # Types de locales
│   ├── paises.types.ts       # Types de países
│   ├── partidos.types.ts     # Types de partidos
│   ├── rondas.types.ts       # Types de rondas
│   ├── torneos.types.ts      # Types de torneos
│   ├── usuarios.types.ts     # Types de usuarios
│   ├── index.ts              # Re-exporta todos los types
│   └── api.types.ts          # LEGACY - mantiene compatibilidad
├── index.ts                   # Punto de entrada - exporta todo
├── mockApi.ts                 # API mock para desarrollo/testing
└── api.ts                     # LEGACY - mantiene compatibilidad
```

---

## ✅ Ventajas de esta Estructura

### 1. **Separación de Responsabilidades**
Cada servicio maneja solo UN recurso del backend.

### 2. **Fácil de Mantener**
Si hay un bug en auth, solo miras `auth.service.ts`

### 3. **Escalable**
Agregar nuevos endpoints es tan fácil como crear un nuevo archivo de servicio

### 4. **Testeable**
Puedes hacer unit tests de cada servicio individualmente

### 5. **Imports Selectivos**
Solo importas lo que necesitas, reduciendo el bundle size

---

## 🚀 Formas de Usar la API

### Opción 1: Import Consolidado (Recomendado para comenzar)

```typescript
import api from '../api';

// Usar cualquier servicio
await api.auth.login({ email, password });
await api.paises.list();
await api.equipos.get(1);
```

**Ventajas:**
- ✅ Simple y directo
- ✅ Autocomplete de todos los servicios
- ✅ Compatible con código existente

---

### Opción 2: Import Específico (Recomendado para producción)

```typescript
import { authService, paisesService } from '../api';

// Solo importas lo que usas
await authService.login({ email, password });
await paisesService.list();
```

**Ventajas:**
- ✅ Tree-shaking: Solo incluye el código que usas
- ✅ Bundle más pequeño
- ✅ Más explícito

---

### Opción 3: Import Individual

```typescript
import { authService } from '../api/services/auth.service';
import { paisesService } from '../api/services/paises.service';

await authService.login({ email, password });
await paisesService.list();
```

**Ventajas:**
- ✅ Máximo control
- ✅ Útil para testing

---

## 📝 Cómo Agregar un Nuevo Endpoint

### Paso 1: Crea el archivo de types

```typescript
// src/api/types/comentarios.types.ts

export interface CreateComentarioRequest {
  texto: string;
  partido_id: number;
  usuario_id: number;
}

export interface UpdateComentarioRequest {
  id: number;
  texto?: string;
}
```

### Paso 2: Exporta los types en types/index.ts

```typescript
// src/api/types/index.ts

// ... otros exports
export * from './comentarios.types';
```

### Paso 3: Crea el servicio

```typescript
// src/api/services/comentarios.service.ts

import { apiClient } from '../client/axiosClient';
import { CreateComentarioRequest } from '../types/comentarios.types';

export const comentariosService = {
  list: async () => {
    const response = await apiClient.get('/comentarios-list');
    return response.data;
  },

  create: async (data: CreateComentarioRequest) => {
    const response = await apiClient.post('/comentarios-create', data);
    return response.data;
  },
};
```

### Paso 4: Exporta el servicio en index.ts

```typescript
// src/api/index.ts

export { comentariosService } from './services/comentarios.service';

// Y agrégalo al objeto api consolidado:
export const api = {
  // ... otros servicios
  comentarios: comentariosService,
};
```

### ¡Listo! Ya puedes usarlo:

```typescript
import api from '../api';

await api.comentarios.create({
  texto: "Gran partido!",
  partido_id: 1,
  usuario_id: 123
});
```

---

## 🔧 Configuración del Cliente Axios

El cliente Axios está configurado en `client/axiosClient.ts` con:

### Interceptores de Request:
- ✅ Agrega automáticamente el token de autenticación a cada petición

### Interceptores de Response:
- ✅ Maneja errores 401 (token expirado) automáticamente
- ✅ Limpia el token si es inválido

### Base URL:
```typescript
https://htjksrcbpozlgjqpqguw.supabase.co/functions/v1
```

### Timeout:
```typescript
30 segundos (30000ms)
```

---

## 🔑 Manejo de Tokens

Los helpers de autenticación están en `client/authHelpers.ts`:

```typescript
import { setAuthToken, getAuthToken, clearAuthToken } from '../api';

// Guardar token
await setAuthToken('eyJhbGciOiJIUzI1NiIs...');

// Obtener token
const token = await getAuthToken();

// Limpiar token
await clearAuthToken();
```

**Nota:** El token se guarda automáticamente al hacer login/register.

---

## 📦 Tipos Modulares (TypeScript)

Los types están separados por dominio en archivos individuales dentro de `types/`:

### Estructura:
```
types/
├── auth.types.ts         # LoginRequest, RegisterRequest, AuthResponse
├── categorias.types.ts   # CreateCategoriaRequest, UpdateCategoriaRequest
├── ediciones.types.ts    # CreateEdicionRequest, Edicion
├── equipos.types.ts      # CreateEquipoRequest, Equipo
├── fases.types.ts        # CreateFaseRequest
├── jugadores.types.ts    # CreateJugadorRequest
├── locales.types.ts      # CreateLocalRequest, UpdateLocalRequest
├── paises.types.ts       # CreatePaisRequest
├── partidos.types.ts     # CreatePartidoRequest, UpdatePartidoRequest, PartidoResultadoRequest
├── rondas.types.ts       # CreateRondaRequest, UpdateRondaRequest
├── torneos.types.ts      # CreateTorneoRequest
├── usuarios.types.ts     # CreateUsuarioRequest, UpdateUsuarioRequest
├── index.ts              # Re-exporta todos los types
└── api.types.ts          # LEGACY - mantiene compatibilidad
```

### Formas de Importar Types:

**Opción 1: Import desde index (Recomendado)**
```typescript
import { LoginRequest, CreateEquipoRequest } from '../api/types';
```

**Opción 2: Import específico (Mejor tree-shaking)**
```typescript
import { LoginRequest } from '../api/types/auth.types';
import { CreateEquipoRequest } from '../api/types/equipos.types';
```

**Opción 3: Import legacy (Compatibilidad)**
```typescript
import { LoginRequest } from '../api/types/api.types';
```

### Ventajas:
- ✅ Cada archivo contiene solo los types de su dominio
- ✅ Fácil de encontrar y mantener
- ✅ Mejor tree-shaking = bundle más pequeño
- ✅ Escalable (agregar nuevos types no afecta otros archivos)
- ✅ Retrocompatible con código existente

---

## 📋 Lista de Servicios Disponibles

| Servicio | Archivo | Endpoints |
|----------|---------|-----------|
| **Auth** | `auth.service.ts` | login, register, logout |
| **Países** | `paises.service.ts` | list, create |
| **Torneos** | `torneos.service.ts` | list, **getByCountry**, create |
| **Ediciones** | `ediciones.service.ts` | list, **getByTournament**, create |
| **Categorías** | `categorias.service.ts` | list, get, **getByEdition**, create, update |
| **Equipos** | `equipos.service.ts` | list, get, create |
| **Jugadores** | `jugadores.service.ts` | list, get, getByDNI, detalle, create |
| **Partidos** | `partidos.service.ts` | list, get, detalle, create, update, resultado |
| **Fases** | `fases.service.ts` | list, get, create |
| **Grupos** | `grupos.service.ts` | clasificacion |
| **Rondas** | `rondas.service.ts` | list, get, create, update, delete |
| **Locales** | `locales.service.ts` | list, get, mapa, cercanos, create, update, delete, uploadFoto, deleteFoto |
| **Estadísticas** | `estadisticas.service.ts` | goleadores, goleadoresPorEdicion, asistencias |
| **Notificaciones** | `notificaciones.service.ts` | mis |
| **Usuarios** | `usuarios.service.ts` | list, get, create, update, delete |
| **Health** | `health.service.ts` | check |

---

## 🧪 Testing

Puedes hacer mock de servicios individuales fácilmente:

```typescript
// __tests__/auth.test.ts

jest.mock('../api/services/auth.service', () => ({
  authService: {
    login: jest.fn().mockResolvedValue({
      token: 'fake-token',
      usuario: { id: 1, email: 'test@test.com' }
    })
  }
}));
```

---

## 🔄 Migración desde la API Antigua

### Antes (api.ts monolítico):
```typescript
import { api } from './api/api';
await api.auth.login(...);
```

### Ahora (modular):
```typescript
import api from './api';  // Sin '/api' al final
await api.auth.login(...);
```

**¡El código existente sigue funcionando!** Solo cambia el import.

---

## 💡 Tips y Mejores Prácticas

### ✅ DO:
- Usa imports específicos en producción para reducir bundle size
- Crea un servicio por cada recurso del backend
- Crea un archivo de types por cada dominio (siguiendo el patrón `nombre.types.ts`)
- Importa types desde archivos específicos para mejor tree-shaking
- Usa el cliente Axios compartido (`apiClient`)
- Re-exporta nuevos types en `types/index.ts` para mantener consistencia

### ❌ DON'T:
- No mezcles types de diferentes dominios en un solo archivo
- No hagas imports directos de `mockApi` en componentes de producción
- No pongas lógica de negocio en los servicios (solo llamadas HTTP)
- No guardes estados en los servicios (son stateless)
- No hardcodees URLs, usa el `apiClient` configurado
- No agregues types directamente a `api.types.ts` (está deprecated, usa archivos específicos)

---

## 🐛 Debugging

Si tienes problemas, verifica:

1. **Token está guardado?**
   ```typescript
   const token = await getAuthToken();
   console.log('Token:', token);
   ```

2. **La petición se está haciendo?**
   Los interceptores de Axios logean automáticamente en la consola

3. **El endpoint es correcto?**
   Verifica la URL en el network tab del navegador

4. **Timeout?**
   El timeout es de 30s. Si tu endpoint tarda más, ajústalo en `axiosClient.ts`

---

## 📚 Recursos

- [Axios Documentation](https://axios-http.com/docs/intro)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React Native AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
