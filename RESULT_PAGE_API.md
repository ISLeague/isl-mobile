# API Endpoints - ResultPage

Este documento describe los endpoints del backend necesarios para que la pantalla **ResultPage** funcione correctamente.

## Tabla de Contenidos
- [1. Obtener Información Completa del Partido](#1-obtener-información-completa-del-partido)
- [2. Obtener Jugadores por Equipo](#2-obtener-jugadores-por-equipo)
- [3. Registrar Resultado del Partido](#3-registrar-resultado-del-partido)

---

## 1. Obtener Información Completa del Partido

Obtiene toda la información de un partido incluyendo los datos completos de ambos equipos.

### Request

```
GET /partidos-get/{id}
```

**Path Parameters:**
- `id` (number, required): ID del partido

**Headers:**
```
Authorization: Bearer <token>
```

### Response Success (200)

```json
{
  "success": true,
  "data": {
    "id_partido": 1,
    "id_fixture": 11,
    "id_equipo_local": 5,
    "id_equipo_visitante": 9,
    "id_ronda": 5,
    "id_fase": 1,
    "id_cancha": 1,
    "tipo_partido": "clasificacion",
    "afecta_clasificacion": true,
    "fecha": "2025-01-15",
    "hora": "20:40",
    "estado_partido": "Pendiente",
    "marcador_local": null,
    "marcador_visitante": null,
    "penales_local": null,
    "penales_visitante": null,
    "fue_a_penales": false,
    "wo": false,
    "wo_equipo_ganador": null,
    "wo_motivo": null,
    "arbitro_principal": "Por definir",
    "observaciones": "Partido de clasificación - Grupo A",
    "motivo_amistoso": null,
    "created_at": "2025-12-30T11:50:32.076025",
    "updated_at": "2025-12-30T11:50:32.076025",
    "equipo_local": {
      "id_equipo": 5,
      "nombre": "Athletic Club",
      "nombre_corto": "Athletic",
      "logo": "https://logoeps.com/wp-content/uploads/2013/03/athletic-bilbao-vector-logo.png"
    },
    "equipo_visitante": {
      "id_equipo": 9,
      "nombre": "Villarreal CF",
      "nombre_corto": "Villarreal",
      "logo": "https://logoeps.com/wp-content/uploads/2013/03/villarreal-vector-logo.png"
    },
    "ronda": {
      "id_ronda": 5,
      "nombre": "Jornada 5 - Fase de Grupos"
    },
    "fase": {
      "id_fase": 1,
      "nombre": "Fase de Grupos"
    },
    "cancha": {
      "id_cancha": 1,
      "nombre": "Cancha de 3",
      "local": {
        "nombre": "Estadio Regional Norte"
      }
    }
  },
  "timestamp": "2025-12-30T13:42:40.627Z"
}
```

### Campos Importantes

- **equipo_local** y **equipo_visitante**: DEBEN incluir objetos completos con:
  - `id_equipo`: ID del equipo
  - `nombre`: Nombre completo del equipo
  - `nombre_corto`: Nombre corto (opcional)
  - `logo`: URL del logo del equipo

- **estado_partido**: Puede ser "Pendiente", "En Curso", "Finalizado"
- **marcador_local/marcador_visitante**: `null` si no hay resultado, número si ya tiene resultado

---

## 2. Obtener Jugadores por Equipo

Obtiene la lista de jugadores de un equipo específico.

### Request

```
GET /jugadores-list?id_equipo={id}
```

**Query Parameters:**
- `id_equipo` (number, required): ID del equipo

**Headers:**
```
Authorization: Bearer <token>
```

### Response Success (200)

```json
{
  "success": true,
  "data": {
    "jugadores": [
      {
        "id_jugador": 1,
        "nombre_completo": "Juan Pérez",
        "numero_camiseta": 10,
        "posicion": "Delantero",
        "dni": "12345678",
        "fecha_nacimiento": "2000-05-15",
        "id_equipo": 5
      },
      {
        "id_jugador": 2,
        "nombre_completo": "Carlos Gómez",
        "numero_camiseta": 7,
        "posicion": "Mediocampista",
        "dni": "87654321",
        "fecha_nacimiento": "1999-08-22",
        "id_equipo": 5
      }
    ]
  },
  "timestamp": "2025-12-30T13:42:40.627Z"
}
```

### Campos Importantes

- **data.jugadores**: DEBE ser un array de objetos de jugadores
- Cada jugador DEBE incluir:
  - `id_jugador`: ID único del jugador
  - `nombre_completo`: Nombre completo del jugador
  - `numero_camiseta`: Número de camiseta (opcional)
  - `id_equipo`: ID del equipo al que pertenece

### Notas

- Si el equipo no tiene jugadores, devolver un array vacío: `"jugadores": []`
- El endpoint DEBE filtrar por `id_equipo` y devolver solo los jugadores de ese equipo

---

## 3. Registrar Resultado del Partido

Registra el resultado completo de un partido incluyendo marcador y estadísticas de los jugadores.

### Request

```
POST /partidos-resultado
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**

```json
{
  "id_partido": 1,
  "goles_local": 3,
  "goles_visitante": 2,
  "penales_local": 0,
  "penales_visitante": 0,
  "fue_a_penales": false,
  "walkover": false,
  "walkover_ganador": null,
  "estado": "finalizado",
  "estadisticas_jugadores": [
    {
      "id_jugador": 1,
      "id_equipo": 5,
      "goles": 2,
      "asistencias": 1,
      "tarjetas_amarillas": 0,
      "tarjetas_rojas": 0,
      "es_mvp": true
    },
    {
      "id_jugador": 2,
      "id_equipo": 5,
      "goles": 1,
      "asistencias": 2,
      "tarjetas_amarillas": 1,
      "tarjetas_rojas": 0,
      "es_mvp": false
    },
    {
      "id_jugador": 10,
      "id_equipo": 9,
      "goles": 2,
      "asistencias": 0,
      "tarjetas_amarillas": 2,
      "tarjetas_rojas": 1,
      "es_mvp": false
    }
  ]
}
```

### Campos del Request

**Nivel superior:**
- `id_partido` (number, required): ID del partido
- `goles_local` (number, required): Goles del equipo local
- `goles_visitante` (number, required): Goles del equipo visitante
- `penales_local` (number, optional): Goles en penales del equipo local (solo si hubo penales)
- `penales_visitante` (number, optional): Goles en penales del equipo visitante (solo si hubo penales)
- `fue_a_penales` (boolean, optional): Indica si el partido se definió por penales. Default: false
- `walkover` (boolean, optional): Indica si fue walkover (W.O.). Default: false
- `walkover_ganador` (string, optional): Equipo ganador del walkover: `"local"` o `"visitante"`. Solo si `walkover` es `true`
- `estado` (string, required): Estado del partido (generalmente "finalizado")
- `estadisticas_jugadores` (array, required): Array de estadísticas por jugador

**Estadísticas por jugador:**
Cada objeto en el array debe tener:
- `id_jugador` (number, required): ID del jugador
- `id_equipo` (number, required): ID del equipo del jugador
- `goles` (number, required): Cantidad de goles anotados por el jugador
- `asistencias` (number, required): Cantidad de asistencias del jugador
- `tarjetas_amarillas` (number, required): Cantidad de tarjetas amarillas (0-2)
- `tarjetas_rojas` (number, required): Cantidad de tarjetas rojas (0-1)
- `es_mvp` (boolean, required): Indica si el jugador es el MVP del partido

### Response Success (200)

```json
{
  "success": true,
  "message": "Resultado registrado exitosamente",
  "data": {
    "id_partido": 1,
    "marcador_local": 3,
    "marcador_visitante": 2,
    "estado_partido": "Finalizado"
  },
  "timestamp": "2025-12-30T13:42:40.627Z"
}
```

### Casos Especiales

#### Walkover (W.O.)

Cuando se marca un walkover, el marcador se envía como 3-0 a favor del ganador y no se envían estadísticas de jugadores:

```json
{
  "id_partido": 1,
  "goles_local": 3,
  "goles_visitante": 0,
  "penales_local": 0,
  "penales_visitante": 0,
  "fue_a_penales": false,
  "walkover": true,
  "walkover_ganador": "local",
  "estado": "finalizado",
  "estadisticas_jugadores": []
}
```

#### Partido con Penales

Cuando hay penales, se incluyen los marcadores de penales además del resultado en tiempo regular:

```json
{
  "id_partido": 1,
  "goles_local": 2,
  "goles_visitante": 2,
  "penales_local": 4,
  "penales_visitante": 3,
  "fue_a_penales": true,
  "walkover": false,
  "walkover_ganador": null,
  "estado": "finalizado",
  "estadisticas_jugadores": [
    // ... estadísticas de jugadores
  ]
}
```

### Notas Importantes

- La app NO rastrea minutos de eventos - solo registra cantidades totales por jugador
- El backend DEBE validar que la suma de goles en `estadisticas_jugadores` coincida con `goles_local` y `goles_visitante`
- Si un jugador tiene 2 tarjetas amarillas, el frontend automáticamente marca también `tarjetas_rojas: 1`
- Solo puede haber UN MVP por partido (validar que solo un jugador tenga `es_mvp: true`)
- El estado del partido DEBE actualizarse a "Finalizado" después de registrar el resultado
- Si `walkover` es `true`, el `walkover_ganador` es obligatorio
- Si `fue_a_penales` es `true`, `penales_local` y `penales_visitante` deben ser mayores a 0

---

## Flujo de Uso en ResultPage

1. **Carga inicial:**
   - Se llama a `GET /partidos-get/{id}` para obtener información del partido
   - Se extraen los objetos `equipo_local` y `equipo_visitante`
   - Se extraen los IDs de ambos equipos

2. **Carga de jugadores:**
   - Se llama a `GET /jugadores-list?id_equipo={id_equipo_local}` para obtener jugadores locales
   - Se llama a `GET /jugadores-list?id_equipo={id_equipo_visitante}` para obtener jugadores visitantes

3. **Usuario ingresa datos:**
   - Selecciona marcador (goles local/visitante)
   - Opcionalmente activa penales y selecciona marcador de penales
   - Opcionalmente activa walkover y selecciona ganador
   - Para cada jugador, selecciona: goles, asistencias, tarjetas amarillas, tarjetas rojas, MVP

4. **Guardar resultado:**
   - Se llama a `POST /partidos-resultado` con todos los datos ingresados
   - Si es exitoso, se muestra mensaje de éxito y se regresa a la pantalla anterior

---

## Validaciones del Backend

El backend DEBE implementar las siguientes validaciones:

1. **Partido válido:**
   - El partido debe existir
   - El partido debe tener ambos equipos definidos
   - El partido no debe estar en estado "Cancelado"

2. **Jugadores válidos:**
   - Todos los `id_jugador` en `estadisticas_jugadores` deben existir
   - Cada jugador debe pertenecer al `id_equipo` especificado en su estadística
   - Cada `id_equipo` debe ser el equipo local o visitante del partido

3. **Estadísticas consistentes:**
   - La suma de `goles` en `estadisticas_jugadores` del equipo local debe coincidir con `goles_local`
   - La suma de `goles` en `estadisticas_jugadores` del equipo visitante debe coincidir con `goles_visitante`
   - `tarjetas_amarillas` debe ser 0, 1 o 2 por jugador
   - `tarjetas_rojas` debe ser 0 o 1 por jugador
   - Solo puede haber UN jugador con `es_mvp: true` en todo el partido

4. **Validaciones especiales:**
   - Si `walkover` es `true`:
     - `walkover_ganador` debe ser `"local"` o `"visitante"`
     - El marcador debe ser 3-0 a favor del ganador
     - `estadisticas_jugadores` puede estar vacío o tener valores en 0
   - Si `fue_a_penales` es `true`:
     - `penales_local` y `penales_visitante` deben ser números mayores a 0
     - Los marcadores local/visitante deben ser iguales (empate en tiempo regular)

5. **Permisos:**
   - El usuario debe tener permisos de administrador para registrar resultados
   - Debe estar autenticado con un token válido

---

## Códigos de Error

### 400 Bad Request
```json
{
  "success": false,
  "error": "Descripción del error de validación"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Token inválido o expirado"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "No tienes permisos para realizar esta acción"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Partido no encontrado"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Error interno del servidor"
}
```
