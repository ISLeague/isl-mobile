# 📋 Endpoints Pendientes para Eliminar Mock Data

Este documento detalla todos los endpoints de API que faltan para dejar de usar mock data en la aplicación ISL Mobile.

---

## 📊 Estado Actual

### ✅ Endpoints Implementados
- ✅ **Equipos**: `GET /equipos-list`, `GET /equipos-get`, `POST /equipos-create`, `POST /equipos-create-bulk/:id`
- ✅ **Categorías**: `GET /categorias-list`
- ✅ **Ediciones**: `GET /ediciones-list`

### ❌ Endpoints Pendientes (usan mock data)
- ❌ Locales y Canchas
- ❌ Sponsors
- ❌ Grupos y Clasificación
- ❌ Jugadores y Plantillas
- ❌ Estadísticas (The Best)
- ❌ Partidos y Rondas (Fixture)
- ❌ Eliminatorias (Knockout)
- ❌ Seguimiento de Equipos (Mi Equipo)

---

## 🏟️ 1. LOCALES Y CANCHAS

### 📍 Componente: `LocalTab`
**Ubicación**: `src/screens/admin/components/LocalTab.tsx`
**Mock Data**: Líneas 47-62

**Usado también en**:
- `src/screens/admin/CreatePartidoScreen.tsx` (línea 16, selección de local y cancha)
- `src/screens/admin/EditPartidoScreen.tsx` (línea 19, selección de local y cancha)

### Endpoints Necesarios:

#### 1.1. Listar Locales por Edición Categoría
```
GET /locales-list
Query: ?id_edicion_categoria={id}
```

**Usado en**:
- `src/screens/admin/components/LocalTab.tsx`
- `src/screens/admin/CreatePartidoScreen.tsx` (línea 16)
- `src/screens/admin/EditPartidoScreen.tsx` (línea 19)

**Response esperado:**
```json
{
  "success": true,
  "data": [
    {
      "id_local": 1,
      "nombre": "Complejo Deportivo Villa El Salvador",
      "latitud": -12.2167,
      "longitud": -76.9333,
      "id_edicion_categoria": 1,
      "activo": true,
      "created_at": "2025-01-10T10:00:00Z",
      "updated_at": "2025-01-10T10:00:00Z"
    }
  ],
  "timestamp": "2025-12-23T03:11:26Z"
}
```

#### 1.2. Listar Canchas por Local
```
GET /canchas-list
Query: ?id_local={id}
```

**Usado en**:
- `src/screens/admin/components/LocalTab.tsx`
- `src/screens/admin/CreatePartidoScreen.tsx` (línea 54-56, filtrar canchas por local)
- `src/screens/admin/EditPartidoScreen.tsx` (línea 65-67)

**Response esperado:**
```json
{
  "success": true,
  "data": [
    {
      "id_cancha": 1,
      "nombre": "Cancha Principal A",
      "id_local": 1,
      "tipo": "sintética",
      "activo": true,
      "created_at": "2025-01-10T10:00:00Z",
      "updated_at": "2025-01-10T10:00:00Z"
    }
  ],
  "timestamp": "2025-12-23T03:11:26Z"
}
```

### 📍 Pantallas Admin para Locales y Canchas:

#### 1.3. Crear Local (Admin) - `LocalTab`
```
POST /locales-create
Authorization: Required
```

**Usado en**: `src/screens/admin/components/LocalTab.tsx`

**Request Body:**
```json
{
  "nombre": "Complejo Deportivo Villa El Salvador",
  "latitud": -12.2167,
  "longitud": -76.9333,
  "id_edicion_categoria": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id_local": 1,
    "nombre": "Complejo Deportivo Villa El Salvador",
    "latitud": -12.2167,
    "longitud": -76.9333,
    "id_edicion_categoria": 1,
    "activo": true,
    "created_at": "2025-12-23T03:11:26Z",
    "updated_at": "2025-12-23T03:11:26Z"
  },
  "timestamp": "2025-12-23T03:11:26Z"
}
```

#### 1.4. Crear Cancha (Admin) - `LocalTab`
```
POST /canchas-create
Authorization: Required
```

**Usado en**: `src/screens/admin/components/LocalTab.tsx`

**Request Body:**
```json
{
  "nombre": "Cancha Principal A",
  "id_local": 1,
  "tipo": "sintética"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id_cancha": 1,
    "nombre": "Cancha Principal A",
    "id_local": 1,
    "tipo": "sintética",
    "activo": true,
    "created_at": "2025-12-23T03:11:26Z"
  },
  "timestamp": "2025-12-23T03:11:26Z"
}
```

#### 1.5. Actualizar Local (Admin) - `LocalTab`
```
PUT /locales-update/:id
Authorization: Required
```

**Usado en**: `src/screens/admin/components/LocalTab.tsx`

**Request Body:**
```json
{
  "nombre": "Complejo Deportivo Villa El Salvador - Actualizado",
  "latitud": -12.2167,
  "longitud": -76.9333
}
```

#### 1.6. Actualizar Cancha (Admin) - `LocalTab`
```
PUT /canchas-update/:id
Authorization: Required
```

**Usado en**: `src/screens/admin/components/LocalTab.tsx`

**Request Body:**
```json
{
  "nombre": "Cancha Principal A - Actualizada",
  "tipo": "césped natural"
}
```

#### 1.7. Eliminar Local (Admin) - `LocalTab`
```
DELETE /locales-delete/:id
Authorization: Required
```

**Usado en**: `src/screens/admin/components/LocalTab.tsx`

**Response:**
```json
{
  "success": true,
  "message": "Local eliminado exitosamente",
  "timestamp": "2025-12-23T03:11:26Z"
}
```

#### 1.8. Eliminar Cancha (Admin) - `LocalTab`
```
DELETE /canchas-delete/:id
Authorization: Required
```

**Usado en**: `src/screens/admin/components/LocalTab.tsx`

**Response:**
```json
{
  "success": true,
  "message": "Cancha eliminada exitosamente",
  "timestamp": "2025-12-23T03:11:26Z"
}
```

---

## 💼 2. SPONSORS

### 📍 Componente: `SponsorTab`
**Ubicación**: `src/screens/admin/components/SponsorTab.tsx`
**Mock Data**: Línea 42

### Endpoints Necesarios:

#### 2.1. Listar Sponsors por Edición Categoría
```
GET /sponsors-list
Query: ?id_edicion_categoria={id}
```

**Usado en**: `src/screens/admin/components/SponsorTab.tsx`

**Response esperado:**
```json
{
  "success": true,
  "data": [
    {
      "id_sponsor": 1,
      "nombre": "Nike",
      "logo": "https://example.com/nike-logo.png",
      "link": "https://www.nike.com",
      "id_edicion_categoria": 1,
      "orden": 1,
      "activo": true,
      "created_at": "2025-01-10T10:00:00Z",
      "updated_at": "2025-01-10T10:00:00Z"
    }
  ],
  "timestamp": "2025-12-23T03:11:26Z"
}
```

### 📍 Pantallas Admin para Sponsors:

#### 2.2. Crear Sponsor (Admin) - `SponsorTab`
```
POST /sponsors-create
Authorization: Required
```

**Usado en**: `src/screens/admin/components/SponsorTab.tsx`

**Request Body:**
```json
{
  "nombre": "Nike",
  "logo": "https://example.com/nike-logo.png",
  "link": "https://www.nike.com",
  "id_edicion_categoria": 1,
  "orden": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id_sponsor": 1,
    "nombre": "Nike",
    "logo": "https://example.com/nike-logo.png",
    "link": "https://www.nike.com",
    "id_edicion_categoria": 1,
    "orden": 1,
    "activo": true,
    "created_at": "2025-12-23T03:11:26Z"
  },
  "timestamp": "2025-12-23T03:11:26Z"
}
```

#### 2.3. Actualizar Sponsor (Admin) - `SponsorTab`
```
PUT /sponsors-update/:id
Authorization: Required
```

**Usado en**: `src/screens/admin/components/SponsorTab.tsx`

**Request Body:**
```json
{
  "nombre": "Nike - Actualizado",
  "logo": "https://example.com/nike-logo-new.png",
  "link": "https://www.nike.com/peru",
  "orden": 2
}
```

#### 2.4. Eliminar Sponsor (Admin) - `SponsorTab`
```
DELETE /sponsors-delete/:id
Authorization: Required
```

**Usado en**: `src/screens/admin/components/SponsorTab.tsx`

**Response:**
```json
{
  "success": true,
  "message": "Sponsor eliminado exitosamente",
  "timestamp": "2025-12-23T03:11:26Z"
}
```

---

## 🏆 3. GRUPOS Y CLASIFICACIÓN

### 📍 Componente: `GroupStageEmbed`
**Ubicación**: `src/screens/admin/components/GroupStageEmbed.tsx`
**Mock Data**: Líneas 50, 161

### Endpoints Necesarios:

#### 3.1. Listar Grupos
```
GET /grupos-list
Query: ?id_edicion_categoria={id}
```

**Response esperado:**
```json
{
  "success": true,
  "data": [
    {
      "id_grupo": 1,
      "nombre": "Grupo A",
      "id_fase": 1,
      "tipo_clasificacion": "pasa_copa_general",
      "cantidad_equipos": 4,
      "equipos_pasan_oro": 2,
      "equipos_pasan_plata": 1,
      "created_at": "2025-01-10T10:00:00Z",
      "updated_at": "2025-01-10T10:00:00Z"
    }
  ],
  "timestamp": "2025-12-23T03:11:26Z"
}
```

#### 3.2. Obtener Clasificación por Grupo
```
GET /clasificacion-list
Query: ?id_grupo={id}
```

**Response esperado:**
```json
{
  "success": true,
  "data": [
    {
      "id_clasificacion": 1,
      "id_equipo": 1,
      "id_grupo": 1,
      "pj": 6,
      "pg": 5,
      "pe": 1,
      "pp": 0,
      "gf": 18,
      "gc": 8,
      "dif": 10,
      "puntos": 16,
      "posicion": 1,
      "equipo": {
        "id_equipo": 1,
        "nombre": "FC Barcelona Lima",
        "logo": "https://...",
        "color_primario": "#A50044",
        "color_secundario": "#004D98"
      }
    }
  ],
  "timestamp": "2025-12-23T03:11:26Z"
}
```

#### 3.3. Obtener Toda la Clasificación de la Edición
```
GET /clasificacion-edicion
Query: ?id_edicion_categoria={id}
```

**Response esperado:**
```json
{
  "success": true,
  "data": [
    {
      "id_grupo": 1,
      "nombre_grupo": "Grupo A",
      "clasificacion": [
        {
          "id_clasificacion": 1,
          "id_equipo": 1,
          "posicion": 1,
          "pj": 6,
          "pg": 5,
          "pe": 1,
          "pp": 0,
          "gf": 18,
          "gc": 8,
          "dif": 10,
          "puntos": 16,
          "equipo": {
            "id_equipo": 1,
            "nombre": "FC Barcelona Lima",
            "logo": "https://..."
          }
        }
      ]
    }
  ],
  "timestamp": "2025-12-23T03:11:26Z"
}
```

### 📍 Pantallas Admin para Grupos:

#### 3.4. Crear Grupo (Admin) - `CreateGroupScreen`
```
POST /grupos-create
Authorization: Required
```

**Usado en**: `src/screens/admin/CreateGroupScreen.tsx`

**Request Body:**
```json
{
  "nombre": "Grupo A",
  "id_edicion_categoria": 1,
  "tipo_clasificacion": "pasa_copa_general",
  "equipos_pasan_oro": 2,
  "equipos_pasan_plata": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id_grupo": 1,
    "nombre": "Grupo A",
    "id_fase": 1,
    "tipo_clasificacion": "pasa_copa_general",
    "cantidad_equipos": 4,
    "equipos_pasan_oro": 2,
    "equipos_pasan_plata": 1,
    "created_at": "2025-12-23T03:11:26Z",
    "updated_at": "2025-12-23T03:11:26Z"
  },
  "timestamp": "2025-12-23T03:11:26Z"
}
```

#### 3.5. Editar Grupo (Admin) - `EditGroupScreen`
```
PUT /grupos-update/:id
Authorization: Required
```

**Usado en**: `src/screens/admin/EditGroupScreen.tsx`

#### 3.6. Agregar Equipo a Grupo (Admin) - `AddTeamToGroupModal`
```
POST /grupos-agregar-equipo
Authorization: Required
```

**Usado en**: `src/screens/admin/components/AddTeamToGroupModal.tsx`, `GroupStageEmbed`

**Request Body:**
```json
{
  "id_grupo": 1,
  "id_equipo": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id_clasificacion": 15,
    "id_equipo": 5,
    "id_grupo": 1,
    "pj": 0,
    "pg": 0,
    "pe": 0,
    "pp": 0,
    "gf": 0,
    "gc": 0,
    "dif": 0,
    "puntos": 0,
    "posicion": 5
  },
  "timestamp": "2025-12-23T03:11:26Z"
}
```

#### 3.7. Mover Equipo entre Grupos (Admin) - `MoveTeamToGroupModal`
```
PUT /grupos-mover-equipo
Authorization: Required
```

**Usado en**: `src/screens/admin/components/MoveTeamToGroupModal.tsx`, `GroupStageEmbed`

**Request Body:**
```json
{
  "id_clasificacion": 15,
  "id_grupo_destino": 2
}
```

#### 3.8. Remover Equipo de Grupo (Admin) - `GroupStageEmbed`
```
DELETE /grupos-remover-equipo/:id_clasificacion
Authorization: Required
```

**Usado en**: `src/screens/admin/components/GroupStageEmbed.tsx`

#### 3.9. Importar Equipos a Grupo (Admin) - `ImportTeamsModal`
```
POST /grupos-importar-equipos/:id_grupo
Authorization: Required
Content-Type: multipart/form-data
```

**Usado en**: `src/screens/admin/components/ImportTeamsModal.tsx`

**Request Body:**
```
FormData {
  csv: File
}
```

**Formato CSV esperado:**
```
nombre,nombre_corto,logo,color_primario,color_secundario
FC Barcelona,Barça,https://...,#A50044,#004D98
Real Madrid,Madrid,https://...,#FFFFFF,#00529F
```

---

## ⚽ 4. JUGADORES Y PLANTILLAS

### 📍 Componente: `TeamDetailScreen` (Fan)
**Ubicación**: `src/screens/home/TeamDetailScreen.tsx`
**Mock Data**: Líneas 65-67 (mockPlantillas, mockJugadores)

**Usado también en**:
- `src/screens/admin/LoadResultsScreen.tsx` (línea 18, para seleccionar jugadores en eventos)
- `src/screens/admin/components/TeamsTab.tsx` (gestión de plantillas)

### Endpoints Necesarios:

#### 4.1. Listar Jugadores de un Equipo (con estadísticas)
```
GET /jugadores-list
Query: ?id_equipo={id}
```

**Usado en**:
- `src/screens/home/TeamDetailScreen.tsx` (línea 65-67)
- `src/screens/admin/LoadResultsScreen.tsx` (línea 47-49, para obtener jugadores del equipo)

**Response esperado:**
```json
{
  "success": true,
  "data": [
    {
      "id_jugador": 1,
      "nombre_completo": "Carlos Alberto Mendoza",
      "dni": "12345678",
      "numero_camiseta": 10,
      "fecha_nacimiento": "2000-05-15",
      "estado": "activo",
      "foto": "https://...",
      "id_plantilla": 1,
      "es_refuerzo": false,
      "fecha_registro": "2025-01-15",
      "estadisticas": {
        "goles": 12,
        "asistencias": 8,
        "amarillas": 2,
        "rojas": 0,
        "partidos_jugados": 10
      }
    }
  ],
  "timestamp": "2025-12-23T03:11:26Z"
}
```

#### 4.2. Obtener Jugador por ID
```
GET /jugadores-get
Query: ?id={id}
```

**Usado en**: Vista detallada de jugadores (si se implementa)

**Response esperado:**
```json
{
  "success": true,
  "data": {
    "id_jugador": 1,
    "nombre_completo": "Carlos Alberto Mendoza",
    "dni": "12345678",
    "numero_camiseta": 10,
    "fecha_nacimiento": "2000-05-15",
    "estado": "activo",
    "foto": "https://...",
    "estadisticas": {
      "goles": 12,
      "asistencias": 8,
      "amarillas": 2,
      "rojas": 0,
      "partidos_jugados": 10
    }
  },
  "timestamp": "2025-12-23T03:11:26Z"
}
```

### 📍 Pantallas Admin para Jugadores:

#### 4.3. Crear Jugador (Admin) - `TeamsTab`
```
POST /jugadores-create
Authorization: Required
```

**Usado en**: `src/screens/admin/components/TeamsTab.tsx` (gestión de plantillas)

**Request Body:**
```json
{
  "nombre_completo": "Carlos Alberto Mendoza",
  "dni": "12345678",
  "numero_camiseta": 10,
  "fecha_nacimiento": "2000-05-15",
  "foto": "https://...",
  "id_equipo": 1,
  "es_refuerzo": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id_jugador": 1,
    "id_plantilla": 1,
    "nombre_completo": "Carlos Alberto Mendoza",
    "dni": "12345678",
    "numero_camiseta": 10,
    "fecha_nacimiento": "2000-05-15",
    "estado": "activo",
    "foto": "https://...",
    "es_refuerzo": false,
    "created_at": "2025-12-23T03:11:26Z"
  },
  "timestamp": "2025-12-23T03:11:26Z"
}
```

#### 4.4. Importar Jugadores desde CSV (Admin) - `TeamsTab`
```
POST /jugadores-create-bulk/:id_equipo
Authorization: Required
Content-Type: multipart/form-data
```

**Usado en**: `src/screens/admin/components/TeamsTab.tsx` (importación masiva de jugadores)

**Request Body:**
```
FormData {
  csv: File
}
```

**Formato CSV esperado:**
```
nombre_completo,dni,numero_camiseta,fecha_nacimiento,es_refuerzo
Carlos Alberto Mendoza,12345678,10,2000-05-15,false
Luis García Pérez,87654321,7,1999-08-20,true
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_processed": 15,
    "successful": 14,
    "failed": 1,
    "errors": ["Línea 5: DNI duplicado"],
    "created_jugadores": [
      {
        "id_jugador": 1,
        "nombre_completo": "Carlos Alberto Mendoza",
        "dni": "12345678",
        "numero_camiseta": 10
      }
    ]
  },
  "timestamp": "2025-12-23T03:11:26Z"
}
```

#### 4.5. Actualizar Jugador (Admin) - `TeamsTab`
```
PUT /jugadores-update/:id
Authorization: Required
```

**Usado en**: `src/screens/admin/components/TeamsTab.tsx`

**Request Body:**
```json
{
  "nombre_completo": "Carlos Alberto Mendoza Jr.",
  "numero_camiseta": 11,
  "estado": "activo"
}
```

#### 4.6. Eliminar Jugador de Plantilla (Admin) - `TeamsTab`
```
DELETE /jugadores-delete/:id
Authorization: Required
```

**Usado en**: `src/screens/admin/components/TeamsTab.tsx`

**Response:**
```json
{
  "success": true,
  "message": "Jugador eliminado de la plantilla exitosamente",
  "timestamp": "2025-12-23T03:11:26Z"
}
```

#### 4.7. Vaciar Plantilla de Equipo (Admin) - `TeamsTab`
```
DELETE /equipos-clear-roster/:id
Authorization: Required
```

**Usado en**: `src/screens/admin/components/TeamsTab.tsx` (eliminar todos los jugadores de un equipo)

**Response:**
```json
{
  "success": true,
  "message": "Plantilla del equipo vaciada exitosamente",
  "deleted_count": 18,
  "timestamp": "2025-12-23T03:11:26Z"
}
```

---

## 🏅 5. ESTADÍSTICAS (THE BEST)

### 📍 Componente: `TheBestEmbed`
**Ubicación**: `src/screens/admin/components/TheBestEmbed.tsx`
**Mock Data**: Líneas 66-89, 150-186

**Nota**: Estas estadísticas se calculan automáticamente basándose en los eventos de partidos registrados en [LoadResultsScreen](src/screens/admin/LoadResultsScreen.tsx)

### Endpoints Necesarios:

#### 5.1. Top Goleadores por Edición Categoría
```
GET /estadisticas-goleadores
Query: ?id_edicion_categoria={id}&limit={number}
```

**Usado en**: `src/screens/admin/components/TheBestEmbed.tsx` (línea 66-89)

**Response esperado:**
```json
{
  "success": true,
  "data": [
    {
      "id_jugador": 1,
      "nombre_completo": "Carlos Mendoza",
      "equipo": "FC Barcelona Lima",
      "id_equipo": 1,
      "goles": 12,
      "foto": "https://...",
      "partidos_jugados": 10
    }
  ],
  "timestamp": "2025-12-23T03:11:26Z"
}
```

#### 5.2. Top Asistencias por Edición Categoría
```
GET /estadisticas-asistencias
Query: ?id_edicion_categoria={id}&limit={number}
```

**Usado en**: `src/screens/admin/components/TheBestEmbed.tsx` (línea 66-89)

**Response esperado:**
```json
{
  "success": true,
  "data": [
    {
      "id_jugador": 2,
      "nombre_completo": "Luis García",
      "equipo": "FC Barcelona Lima",
      "id_equipo": 1,
      "asistencias": 8,
      "foto": "https://...",
      "partidos_jugados": 10
    }
  ],
  "timestamp": "2025-12-23T03:11:26Z"
}
```

#### 5.3. Valla Menos Vencida (Equipos con menos goles recibidos)
```
GET /estadisticas-valla-menos-vencida
Query: ?id_edicion_categoria={id}&limit={number}
```

**Usado en**: `src/screens/admin/components/TheBestEmbed.tsx` (línea 150-186)

**Response esperado:**
```json
{
  "success": true,
  "data": [
    {
      "id_equipo": 5,
      "nombre": "Bayern Munich",
      "goles_en_contra": 6,
      "logo": "https://...",
      "partidos_jugados": 10
    }
  ],
  "timestamp": "2025-12-23T03:11:26Z"
}
```

#### 5.4. Top Tarjetas Amarillas (Jugadores con más amarillas)
```
GET /estadisticas-amarillas
Query: ?id_edicion_categoria={id}&limit={number}
```

**Usado en**: `src/screens/admin/components/TheBestEmbed.tsx`

**Response esperado:**
```json
{
  "success": true,
  "data": [
    {
      "id_jugador": 5,
      "nombre_completo": "Roberto Pérez",
      "equipo": "Real Madrid FC",
      "id_equipo": 2,
      "amarillas": 5,
      "foto": "https://...",
      "partidos_jugados": 10
    }
  ],
  "timestamp": "2025-12-23T03:11:26Z"
}
```

#### 5.5. Top Tarjetas Rojas (Jugadores con más rojas)
```
GET /estadisticas-rojas
Query: ?id_edicion_categoria={id}&limit={number}
```

**Usado en**: `src/screens/admin/components/TheBestEmbed.tsx`

**Response esperado:**
```json
{
  "success": true,
  "data": [
    {
      "id_jugador": 8,
      "nombre_completo": "Diego Martínez",
      "equipo": "Juventus FC",
      "id_equipo": 3,
      "rojas": 2,
      "foto": "https://...",
      "partidos_jugados": 10
    }
  ],
  "timestamp": "2025-12-23T03:11:26Z"
}
```

#### 5.6. Fair Play (Equipos con mejor comportamiento)
```
GET /estadisticas-fair-play
Query: ?id_edicion_categoria={id}&limit={number}
```

**Usado en**: `src/screens/admin/components/TheBestEmbed.tsx`

**Response esperado:**
```json
{
  "success": true,
  "data": [
    {
      "id_equipo": 1,
      "nombre": "FC Barcelona Lima",
      "logo": "https://...",
      "amarillas": 8,
      "rojas": 0,
      "puntos_fair_play": 92,
      "partidos_jugados": 10
    }
  ],
  "timestamp": "2025-12-23T03:11:26Z"
}
```

**Cálculo de puntos Fair Play**:
- Partidos jugados sin tarjetas: +10 puntos
- Por cada amarilla: -2 puntos
- Por cada roja: -10 puntos

---

## 📅 6. PARTIDOS Y RONDAS (FIXTURE)

### 📍 Componente: `FixtureEmbedImproved`
**Ubicación**: `src/screens/admin/components/FixtureEmbedImproved.tsx`
**Mock Data**: Líneas 56-73 (mockRondas, mockPartidos)

### Endpoints Necesarios:

#### 6.1. Listar Rondas por Edición Categoría
```
GET /rondas-list
Query: ?id_edicion_categoria={id}
```

**Usado en**: `src/screens/admin/components/FixtureEmbedImproved.tsx`

**Response esperado:**
```json
{
  "success": true,
  "data": [
    {
      "id_ronda": 1,
      "nombre": "Jornada 1",
      "fecha_inicio": "2025-03-15",
      "fecha_fin": "2025-03-16",
      "id_fase": 1,
      "es_amistosa": false,
      "tipo": "fase_grupos",
      "aplicar_fecha_automatica": true,
      "orden": 1
    }
  ],
  "timestamp": "2025-12-23T03:11:26Z"
}
```

#### 6.2. Listar Partidos por Ronda
```
GET /partidos-list
Query: ?id_ronda={id}
```

**Usado en**:
- `src/screens/admin/components/FixtureEmbedImproved.tsx`
- `src/screens/admin/LoadResultsScreen.tsx` (línea 28)

**Response esperado:**
```json
{
  "success": true,
  "data": [
    {
      "id_partido": 1,
      "fecha": "2025-03-15",
      "hora": "15:00",
      "estado_partido": "Finalizado",
      "marcador_local": 3,
      "marcador_visitante": 1,
      "penales_local": null,
      "penales_visitante": null,
      "wo": false,
      "id_equipo_local": 1,
      "id_equipo_visitante": 2,
      "id_ronda": 1,
      "id_fase": 1,
      "id_cancha": 1,
      "equipo_local": {
        "id_equipo": 1,
        "nombre": "FC Barcelona Lima",
        "logo": "https://..."
      },
      "equipo_visitante": {
        "id_equipo": 2,
        "nombre": "Real Madrid FC",
        "logo": "https://..."
      },
      "cancha": {
        "id_cancha": 1,
        "nombre": "Cancha Principal A",
        "local": {
          "id_local": 1,
          "nombre": "Complejo Deportivo Villa El Salvador"
        }
      }
    }
  ],
  "timestamp": "2025-12-23T03:11:26Z"
}
```

### 📍 Pantallas Admin para Rondas:

#### 6.3. Crear Ronda (Admin) - `CreateRondaScreen`
```
POST /rondas-create
Authorization: Required
```

**Usado en**: `src/screens/admin/CreateRondaScreen.tsx` (línea 68-69)

**Request Body:**
```json
{
  "nombre": "Jornada 1",
  "fecha": "2025-03-15",
  "tipo": "fase_grupos",
  "subtipo_eliminatoria": null,
  "aplicar_fecha_automatica": true,
  "id_fase": 1,
  "id_edicion_categoria": 1,
  "es_amistosa": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id_ronda": 1,
    "nombre": "Jornada 1",
    "fecha_inicio": "2025-03-15",
    "id_fase": 1,
    "es_amistosa": false,
    "tipo": "fase_grupos",
    "aplicar_fecha_automatica": true,
    "orden": 1,
    "created_at": "2025-12-23T03:11:26Z"
  },
  "timestamp": "2025-12-23T03:11:26Z"
}
```

**Nota**: Para rondas de eliminatorias (`tipo: "eliminatorias"`), se debe incluir el campo `subtipo_eliminatoria` con valores: `"oro"`, `"plata"`, o `"bronce"`.

#### 6.4. Crear Ronda Amistosa (Admin) - `CreateRondaAmistosaScreen`
```
POST /rondas-create-amistosa
Authorization: Required
```

**Usado en**: `src/screens/admin/CreateRondaAmistosaScreen.tsx` (línea 228-229)

**Request Body:**
```json
{
  "nombre": "Amistosos - Fecha 1",
  "fecha_inicio": "2025-03-15",
  "id_fase": 1,
  "id_edicion_categoria": 1,
  "es_amistosa": true,
  "partidos": [
    {
      "id_equipo_local": 1,
      "id_equipo_visitante": 5,
      "fecha": "2025-03-15",
      "hora": "15:00"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id_ronda": 5,
    "nombre": "Amistosos - Fecha 1",
    "fecha_inicio": "2025-03-15",
    "es_amistosa": true,
    "partidos_creados": 8
  },
  "timestamp": "2025-12-23T03:11:26Z"
}
```

### 📍 Pantallas Admin para Partidos:

#### 6.5. Crear Partido (Admin) - `CreatePartidoScreen`
```
POST /partidos-create
Authorization: Required
```

**Usado en**: `src/screens/admin/CreatePartidoScreen.tsx` (línea 96-104)

**Request Body:**
```json
{
  "fecha": "2025-03-15",
  "hora": "15:00",
  "id_equipo_local": 1,
  "id_equipo_visitante": 2,
  "id_ronda": 1,
  "id_fase": 1,
  "id_cancha": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id_partido": 1,
    "fecha": "2025-03-15",
    "hora": "15:00",
    "estado_partido": "Pendiente",
    "id_equipo_local": 1,
    "id_equipo_visitante": 2,
    "id_ronda": 1,
    "id_fase": 1,
    "id_cancha": 1,
    "created_at": "2025-12-23T03:11:26Z"
  },
  "timestamp": "2025-12-23T03:11:26Z"
}
```

#### 6.6. Actualizar Partido (Admin) - `EditPartidoScreen`
```
PUT /partidos-update/:id
Authorization: Required
```

**Usado en**: `src/screens/admin/EditPartidoScreen.tsx` (línea 118)

**Request Body:**
```json
{
  "fecha": "2025-03-15",
  "hora": "16:00",
  "id_equipo_local": 1,
  "id_equipo_visitante": 2,
  "id_cancha": 2
}
```

#### 6.7. Eliminar Partido (Admin) - `EditPartidoScreen`
```
DELETE /partidos-delete/:id
Authorization: Required
```

**Usado en**: `src/screens/admin/EditPartidoScreen.tsx` (línea 153)

**Response:**
```json
{
  "success": true,
  "message": "Partido eliminado exitosamente",
  "timestamp": "2025-12-23T03:11:26Z"
}
```

### 📍 Cargar Resultados de Partidos:

#### 6.8. Actualizar Resultado de Partido (Admin) - `LoadResultsScreen`
```
PUT /partidos-update-resultado/:id
Authorization: Required
```

**Usado en**: `src/screens/admin/LoadResultsScreen.tsx` (línea 73-94)

**Request Body:**
```json
{
  "marcador_local": 3,
  "marcador_visitante": 1,
  "penales_local": null,
  "penales_visitante": null,
  "estado_partido": "Finalizado",
  "wo": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id_partido": 1,
    "marcador_local": 3,
    "marcador_visitante": 1,
    "estado_partido": "Finalizado",
    "updated_at": "2025-12-23T03:11:26Z"
  },
  "timestamp": "2025-12-23T03:11:26Z"
}
```

### 📍 Eventos de Partido (Goles, Tarjetas, etc.):

#### 6.9. Obtener Eventos de Partido
```
GET /eventos-list
Query: ?id_partido={id}
```

**Usado en**: `src/screens/admin/LoadResultsScreen.tsx` (para mostrar eventos existentes)

**Response esperado:**
```json
{
  "success": true,
  "data": [
    {
      "id_evento": 1,
      "minuto": 15,
      "tipo_evento": "gol",
      "id_partido": 1,
      "id_jugador": 1,
      "jugador": {
        "id_jugador": 1,
        "nombre_completo": "Carlos Mendoza",
        "numero_camiseta": 10
      }
    },
    {
      "id_evento": 2,
      "minuto": 45,
      "tipo_evento": "amarilla",
      "id_partido": 1,
      "id_jugador": 3,
      "jugador": {
        "id_jugador": 3,
        "nombre_completo": "Luis García",
        "numero_camiseta": 5
      }
    }
  ],
  "timestamp": "2025-12-23T03:11:26Z"
}
```

#### 6.10. Registrar Evento de Partido (Admin) - `LoadResultsScreen`
```
POST /eventos-create
Authorization: Required
```

**Usado en**: `src/screens/admin/LoadResultsScreen.tsx` (línea 46-71)

**Request Body:**
```json
{
  "id_partido": 1,
  "id_jugador": 1,
  "tipo_evento": "gol",
  "minuto": 15
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id_evento": 1,
    "minuto": 15,
    "tipo_evento": "gol",
    "id_partido": 1,
    "id_jugador": 1,
    "created_at": "2025-12-23T03:11:26Z"
  },
  "timestamp": "2025-12-23T03:11:26Z"
}
```

**Tipos de evento válidos**: `"gol"`, `"asistencia"`, `"amarilla"`, `"roja"`, `"cambio"`

#### 6.11. Eliminar Evento de Partido (Admin)
```
DELETE /eventos-delete/:id
Authorization: Required
```

**Usado en**: `src/screens/admin/LoadResultsScreen.tsx` (línea 256-260, botón eliminar evento)

---

## 🏆 7. ELIMINATORIAS (KNOCKOUT)

### 📍 Componente: `KnockoutEmbed`
**Ubicación**: `src/screens/admin/components/KnockoutEmbed.tsx`

### Endpoints Necesarios:

#### 7.1. Obtener Cuadro de Eliminatorias
```
GET /knockout-bracket
Query: ?id_edicion_categoria={id}&copa={oro|plata|bronce}
```

**Response esperado:**
```json
{
  "success": true,
  "data": {
    "copa": "oro",
    "rondas": [
      {
        "nombre": "Octavos",
        "partidos": [
          {
            "id_partido": 101,
            "equipo_local": {
              "id_equipo": 1,
              "nombre": "FC Barcelona Lima",
              "logo": "https://..."
            },
            "equipo_visitante": {
              "id_equipo": 8,
              "nombre": "AC Milan",
              "logo": "https://..."
            },
            "marcador_local": 2,
            "marcador_visitante": 1,
            "ganador": 1
          }
        ]
      },
      {
        "nombre": "Cuartos",
        "partidos": [...]
      },
      {
        "nombre": "Semifinal",
        "partidos": [...]
      },
      {
        "nombre": "Final",
        "partidos": [...]
      }
    ]
  },
  "timestamp": "2025-12-23T03:11:26Z"
}
```

---

## ❤️ 8. SEGUIMIENTO DE EQUIPOS (MI EQUIPO)

### 📍 Componente: `MyTeamEmbed`
**Ubicación**: `src/screens/admin/components/MyTeamEmbed.tsx`
**Mock Data**: Línea 171

### Endpoints Necesarios:

#### 8.1. Obtener Equipo Seguido por Usuario
```
GET /usuarios-equipo-seguido
Query: ?id_usuario={id}
Authorization: Required
```

**Response esperado:**
```json
{
  "success": true,
  "data": {
    "id_seguimiento": 1,
    "id_usuario": 4,
    "id_equipo": 1,
    "pago_fotos": false,
    "equipo": {
      "id_equipo": 1,
      "nombre": "FC Barcelona Lima",
      "logo": "https://...",
      "nombre_corto": "Barça",
      "color_primario": "#A50044",
      "color_secundario": "#004D98"
    },
    "estadisticas": {
      "pj": 10,
      "pg": 7,
      "pe": 2,
      "pp": 1,
      "gf": 28,
      "gc": 12,
      "dif": 16,
      "puntos": 23,
      "posicion": 1
    }
  },
  "timestamp": "2025-12-23T03:11:26Z"
}
```

#### 8.2. Seguir Equipo
```
POST /usuarios-seguir-equipo
Authorization: Required
```

**Request Body:**
```json
{
  "id_usuario": 4,
  "id_equipo": 1
}
```

#### 8.3. Dejar de Seguir Equipo
```
DELETE /usuarios-dejar-equipo/:id_usuario
Authorization: Required
```

#### 8.4. Registrar Pago de Fotos
```
POST /usuarios-pago-fotos
Authorization: Required
```

**Request Body:**
```json
{
  "id_usuario": 4,
  "id_equipo": 1,
  "comprobante": "https://...",
  "monto": 50.00
}
```

---

## 📸 9. FOTOS DE EQUIPOS

### Endpoints Necesarios:

#### 9.1. Obtener Fotos de Equipo
```
GET /fotos-get
Query: ?id_equipo={id}
```

**Response esperado:**
```json
{
  "success": true,
  "data": {
    "id_fotos": 1,
    "link_fotos_totales": "https://photos.google.com/album/xyz",
    "link_preview": "https://youtube.com/watch?v=xyz",
    "id_equipo": 1
  },
  "timestamp": "2025-12-23T03:11:26Z"
}
```

#### 9.2. Actualizar Links de Fotos (Admin)
```
PUT /fotos-update/:id_equipo
Authorization: Required
```

**Request Body:**
```json
{
  "link_fotos_totales": "https://photos.google.com/album/xyz",
  "link_preview": "https://youtube.com/watch?v=xyz"
}
```