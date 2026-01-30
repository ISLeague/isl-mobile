# 🏆 ISL - InterLeague App

![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue)
![Expo](https://img.shields.io/badge/Expo-54.0.23-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue)
![License](https://img.shields.io/badge/License-Private-red)

Aplicación móvil para la gestión y visualización de torneos de fútbol amateur. Permite a fans seguir sus equipos favoritos, ver estadísticas, fixtures, y a administradores gestionar torneos completos.

---

## 📖 Tabla de Contenidos

1. [Características](#-características)
2. [Tecnologías](#-tecnologías)
3. [Estructura del Proyecto](#-estructura-del-proyecto)
4. [Instalación](#-instalación)
5. [Arquitectura Frontend](#-arquitectura-frontend)
6. [Pantallas y Navegación](#-pantallas-y-navegación)
7. [Componentes Reutilizables](#-componentes-reutilizables)
8. [Custom Hooks](#-custom-hooks)
9. [Utilidades](#-utilidades)
10. [Contextos Globales](#-contextos-globales)
11. [Sistema de Tipos](#-sistema-de-tipos)
12. [Theming y Estilos](#-theming-y-estilos)
13. [API Mock Actual](#-api-mock-actual)
14. [InterfacesForBackend](#-interfacesforbackend)
15. [Consideraciones Técnicas del Backend](#-consideraciones-técnicas-del-backend)
16. [Testing](#-testing)
17. [Contribución](#-contribución)

---

## ✨ Características

### Para Fans
- 🌍 Selección de país y torneo
- ⚽ Visualización de fase de grupos con tabla de posiciones
- 📅 Fixture completo de partidos
- 🏅 Rankings "The Best" (goleadores, asistencias, tarjetas, etc.)
- ❤️ Seguimiento de equipo favorito ("Mi Equipo")
- 👤 Detalle de jugadores con estadísticas
- 🏟️ Información de locales y canchas
- 🔔 Notificaciones de partidos
- 🎨 Personalización de tema (colores y modo oscuro)

### Para Administradores
- 🏆 Gestión de torneos, ediciones y categorías
- 👥 Administración de equipos y jugadores
- 📊 Creación y edición de grupos
- 📅 Gestión de fixture y rondas
- ⚽ Carga de resultados de partidos
- 💼 Administración de sponsors
- 🏟️ Gestión de locales y canchas
- 🌍 Gestión de países (SuperAdmin)
- 👁️ Suplantación de identidad para testing

### Para SuperAdmins
- 🌐 Gestión global de países
- 👤 Asignación de administradores a torneos
- 📊 Panel de administración completo

---

## 🛠️ Tecnologías

### Core
| Tecnología | Versión | Descripción |
|------------|---------|-------------|
| React Native | 0.81.5 | Framework móvil |
| Expo | 54.0.23 | Plataforma de desarrollo |
| TypeScript | 5.9.2 | Tipado estático |
| React | 19.1.0 | Librería UI |

### Navegación
| Paquete | Versión | Uso |
|---------|---------|-----|
| @react-navigation/native | 7.1.18 | Navegación base |
| @react-navigation/native-stack | 7.3.27 | Stack navigator |
| @react-navigation/bottom-tabs | 7.4.8 | Bottom tabs |

### UI/UX
| Paquete | Versión | Uso |
|---------|---------|-----|
| @expo/vector-icons | 15.0.3 | Iconos |
| expo-linear-gradient | 15.0.7 | Gradientes |
| react-native-reanimated | 4.1.3 | Animaciones |
| react-native-pager-view | 6.9.1 | Swipe entre vistas |

### Estado y Almacenamiento
| Paquete | Versión | Uso |
|---------|---------|-----|
| zustand | 5.0.8 | Estado global (preparado) |
| @react-native-async-storage/async-storage | 2.2.0 | Persistencia local |

### Utilidades
| Paquete | Versión | Uso |
|---------|---------|-----|
| axios | 1.12.2 | Cliente HTTP |
| expo-image-picker | 17.0.8 | Selección de imágenes |

---

## 📁 Estructura del Proyecto

```
ISL/
├── App.tsx                    # Punto de entrada, navegación raíz
├── index.ts                   # Registro de la app
├── app.json                   # Configuración Expo
├── package.json               # Dependencias
├── tsconfig.json              # Configuración TypeScript
├── babel.config.js            # Configuración Babel
│
├── InterfacesForBackend/      # Contratos de API para el backend
│   ├── index.ts               # Barrel export de todo
│   ├── entities/              # Modelos de base de datos
│   ├── dtos/                  # Data Transfer Objects
│   ├── responses/             # Tipos de respuesta API
│   └── endpoints/             # Contratos de endpoints REST
│
└── src/
    ├── api/
    │   └── mockApi.ts         # API simulada (a reemplazar)
    │
    ├── assets/
    │   ├── InterLOGO.png      # Logo rojo
    │   ├── InterLOGO2.png     # Logo azul
    │   └── InterLOGO3.png     # Logo rosa
    │
    ├── components/
    │   └── common/
    │       ├── index.ts       # Barrel export
    │       ├── Button.tsx     # Botón estándar
    │       ├── Card.tsx       # Tarjeta contenedora
    │       ├── ErrorBoundary.tsx  # Captura de errores
    │       ├── FAB.tsx        # Floating Action Button
    │       ├── GradientHeader.tsx # Header con gradiente
    │       ├── ImagePickerInput.tsx # Selector de imágenes
    │       ├── InfoCard.tsx   # Tarjeta informativa
    │       ├── Input.tsx      # Campo de entrada
    │       ├── Modal.tsx      # Modal deslizable
    │       ├── SearchBar.tsx  # Barra de búsqueda
    │       ├── Skeleton.tsx   # Loading skeleton
    │       ├── SponsorSlider.tsx  # Carrusel de sponsors
    │       └── SuplantacionBanner.tsx # Banner de suplantación
    │
    ├── contexts/
    │   ├── AuthContext.tsx    # Autenticación y roles
    │   ├── ThemeContext.tsx   # Tema y colores
    │   └── ToastContext.tsx   # Notificaciones toast
    │
    ├── data/
    │   └── mockData.ts        # Datos de prueba
    │
    ├── hooks/
    │   ├── index.ts           # Barrel export
    │   ├── useSearch.ts       # Hook genérico de búsqueda
    │   ├── useTeamFollow.ts   # Seguimiento de equipos
    │   └── useValidation.ts   # Validación de formularios
    │
    ├── navigation/
    │   └── MainNavigator.tsx  # Navegación principal (tabs)
    │
    ├── screens/
    │   ├── SplashScreen.tsx   # Pantalla de carga inicial
    │   │
    │   ├── auth/
    │   │   ├── LoginScreen.tsx
    │   │   ├── RegisterScreen.tsx
    │   │   └── ChangePasswordScreen.tsx
    │   │
    │   ├── home/
    │   │   ├── HomeScreen.tsx         # Selección de país
    │   │   ├── GroupStageScreen.tsx   # Fase de grupos
    │   │   ├── TheBestScreen.tsx      # Rankings
    │   │   ├── TeamDetailScreen.tsx   # Detalle de equipo
    │   │   ├── PlayerDetailScreen.tsx # Detalle de jugador
    │   │   ├── PlayerFormScreen.tsx   # Formulario jugador
    │   │   ├── MyTeamScreen.tsx       # Mi equipo favorito
    │   │   └── MatchDetailScreen.tsx  # Detalle de partido
    │   │
    │   ├── profile/
    │   │   ├── ProfileScreen.tsx      # Perfil de usuario
    │   │   └── PrivacySettingsScreen.tsx
    │   │
    │   ├── admin/
    │   │   ├── components/            # Componentes admin
    │   │   ├── AdminTournamentsScreen.tsx
    │   │   ├── CategoryManagementScreen.tsx
    │   │   ├── CountrySelectionScreen.tsx
    │   │   ├── CreateTournamentScreen.tsx
    │   │   ├── CreateTournamentAdminScreen.tsx
    │   │   ├── TournamentAdminDashboardScreen.tsx
    │   │   ├── TournamentCategoriesScreen.tsx
    │   │   ├── TournamentDetailScreen.tsx
    │   │   ├── ManageTeamsScreen.tsx
    │   │   ├── ManageFixtureScreen.tsx
    │   │   ├── ManageCountriesScreen.tsx
    │   │   ├── FixtureManagementScreen.tsx
    │   │   ├── LoadResultsScreen.tsx
    │   │   ├── ResultPage.tsx
    │   │   ├── CreateGroupScreen.tsx
    │   │   ├── EditGroupScreen.tsx
    │   │   ├── CreateRondaScreen.tsx
    │   │   ├── CreateRondaAmistosaScreen.tsx
    │   │   ├── EditRondaScreen.tsx
    │   │   ├── CreatePartidoScreen.tsx
    │   │   ├── EditPartidoScreen.tsx
    │   │   ├── EditTeamScreen.tsx
    │   │   ├── CreateLocalScreen.tsx
    │   │   ├── EditLocalScreen.tsx
    │   │   ├── CreateCanchaScreen.tsx
    │   │   ├── EditCanchaScreen.tsx
    │   │   ├── CreateSponsorScreen.tsx
    │   │   ├── EditSponsorScreen.tsx
    │   │   ├── EditCountryScreen.tsx
    │   │   └── SendNotificationsScreen.tsx
    │   │
    │   └── examples/
    │       └── ErrorHandlingExamples.tsx
    │
    ├── store/                 # (Preparado para Zustand)
    │
    ├── theme/
    │   ├── index.ts
    │   ├── colors.ts          # Paleta de colores y presets
    │   └── constants.ts       # Constantes de diseño
    │
    ├── types/
    │   ├── index.ts           # Interfaces principales
    │   └── auth.types.ts      # Tipos de autenticación
    │
    └── utils/
        ├── index.ts           # Barrel export
        ├── animations.tsx     # Utilidades de animación
        ├── calculations.ts    # Funciones de cálculo
        ├── errorHandling.ts   # Manejo de errores
        ├── fixtureGenerator.ts # Generador de fixtures
        └── formatters.ts      # Formateo de datos
```

---

## 🚀 Instalación

### Prerrequisitos
- Node.js >= 18.x
- pnpm (recomendado) o npm/yarn
- Expo CLI
- Dispositivo físico o emulador

### Pasos

```bash
# 1. Clonar el repositorio
git clone <repository-url>
cd ISL

# 2. Instalar dependencias
pnpm install

# 3. Iniciar el servidor de desarrollo
pnpm start

# 4. Ejecutar en plataforma específica
pnpm android   # Android
pnpm ios       # iOS (solo macOS)
pnpm web       # Web
```

### Usuarios de Prueba

| Email | Contraseña | Rol |
|-------|------------|-----|
| `superadmin@interleague.com` | password123 | SuperAdmin |
| `admin.torneo@interleague.com` | password123 | Admin de Torneo |
| `fan@gmail.com` | password123 | Fan |

---

## 🏗️ Arquitectura Frontend

### Patrón de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        App.tsx                               │
│  (Providers: Theme → Toast → Auth → Navigation)             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   MainNavigator.tsx                          │
│        (Bottom Tabs: Home | Profile)                         │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┴─────────────────────┐
        ▼                                           ▼
┌───────────────────┐                    ┌───────────────────┐
│   Stack Screens    │                    │   Stack Screens    │
│   (Home Flow)      │                    │   (Admin Flow)     │
└───────────────────┘                    └───────────────────┘
        │                                           │
        ▼                                           ▼
┌───────────────────┐                    ┌───────────────────┐
│   Components       │                    │   Components       │
│   + Hooks          │                    │   + Hooks          │
│   + Utils          │                    │   + Utils          │
└───────────────────┘                    └───────────────────┘
```

### Flujo de Datos

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ mockApi  │ ──▶ │ Context/ │ ──▶ │ Screen   │ ──▶ │Component │
│ (futuro: │     │ Hooks    │     │          │     │          │
│  API)    │     │          │     │          │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
```

---

## 📱 Pantallas y Navegación

### Flujo de Autenticación

```
SplashScreen ──▶ LoginScreen ──┬──▶ RegisterScreen
                               │
                               ├──▶ Main (Fans)
                               │
                               └──▶ Profile (Admins sin tabs)
```

### Flujo de Fans

```
HomeScreen (Países)
    │
    ▼
AdminTournamentsScreen (Torneos por país)
    │
    ▼
TournamentCategoriesScreen (Categorías)
    │
    ▼
CategoryManagementScreen (Tabs)
    ├── Mi Equipo
    ├── Grupos
    ├── Fixture
    ├── Knockout
    ├── The Best
    └── Local
```

### Flujo de Administradores

```
ProfileScreen
    │
    ├──▶ TournamentAdminDashboardScreen
    │        │
    │        ▼
    │    AdminTournamentsScreen ──▶ CategoryManagementScreen
    │        │
    │        ├── ManageTeams ──▶ EditTeam
    │        ├── ManageFixture ──▶ CreateRonda / EditRonda
    │        ├── ManageGroups ──▶ CreateGroup / EditGroup
    │        └── LoadResults ──▶ ResultPage
    │
    ├──▶ ManageCountriesScreen (SuperAdmin)
    │
    └──▶ Suplantación de Usuario
```

### Rutas de Navegación Principales

| Nombre | Componente | Descripción |
|--------|------------|-------------|
| `Splash` | SplashScreen | Pantalla de carga |
| `Login` | LoginScreen | Inicio de sesión |
| `Register` | RegisterScreen | Registro |
| `ChangePassword` | ChangePasswordScreen | Cambio de contraseña |
| `Main` | MainNavigator | Tabs principales |
| `GroupStage` | GroupStageScreen | Fase de grupos |
| `TheBest` | TheBestScreen | Rankings |
| `TeamDetail` | TeamDetailScreen | Detalle equipo |
| `PlayerDetail` | PlayerDetailScreen | Detalle jugador |
| `MyTeam` | MyTeamScreen | Equipo favorito |
| `MatchDetail` | MatchDetailScreen | Detalle partido |
| `CategoryManagement` | CategoryManagementScreen | Gestión categoría |

---

## 🧩 Componentes Reutilizables

### Importación

```tsx
import { 
  GradientHeader, 
  Card, 
  FAB, 
  Modal, 
  InfoCard,
  Button,
  Input,
  SearchBar,
  Skeleton,
  SponsorSlider,
  ErrorBoundary
} from '../components/common';
```

### Componentes Disponibles

#### 1. GradientHeader
Header con gradiente rojo, navegación y acciones.

```tsx
<GradientHeader
  title="Mi Pantalla"
  onBackPress={() => navigation.goBack()}
  onProfilePress={() => navigation.navigate('Profile')}
  showNotification={true}
  rightElement={<CustomButton />}
/>
```

#### 2. Card
Contenedor con sombra y bordes redondeados.

```tsx
<Card onPress={() => handlePress()} elevated={true} style={styles.custom}>
  <Text>Contenido</Text>
</Card>
```

#### 3. FAB (Floating Action Button)
Botón flotante para acciones primarias.

```tsx
<FAB
  onPress={() => handleCreate()}
  icon="add"
  color={colors.primary}
  size={56}
/>
```

#### 4. Modal
Modal deslizable desde abajo.

```tsx
<Modal
  visible={isVisible}
  onClose={() => setIsVisible(false)}
  title="Título"
  fullHeight={true}
>
  <ModalContent />
</Modal>
```

#### 5. SearchBar
Barra de búsqueda con botón de limpiar.

```tsx
<SearchBar
  value={searchQuery}
  onChangeText={setSearchQuery}
  placeholder="Buscar equipo..."
  onClear={handleClear}
/>
```

#### 6. InfoCard
Tarjeta informativa con icono.

```tsx
<InfoCard
  title="País"
  value="Argentina 🇦🇷"
  icon="flag"
  iconLibrary="material"
/>
```

#### 7. Button
Botón estándar con variantes.

```tsx
<Button
  title="Guardar"
  onPress={handleSave}
  variant="primary"  // primary | secondary | outline | danger
  loading={isLoading}
  disabled={isDisabled}
/>
```

#### 8. Input
Campo de entrada de texto.

```tsx
<Input
  label="Email"
  value={email}
  onChangeText={setEmail}
  placeholder="correo@ejemplo.com"
  keyboardType="email-address"
  error={emailError}
  secureTextEntry={false}
/>
```

#### 9. SponsorSlider
Carrusel automático de sponsors.

```tsx
<SponsorSlider sponsors={sponsorsList} />
```

#### 10. ErrorBoundary
Captura errores de componentes hijos.

```tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

---

## 🪝 Custom Hooks

### useSearch<T>
Hook genérico para búsqueda y filtrado.

```tsx
const {
  searchQuery,
  setSearchQuery,
  filteredData,
  clearSearch,
  hasResults
} = useSearch<Equipo>(equipos, 'nombre');
```

**Retorna:**
- `searchQuery`: string - Texto de búsqueda actual
- `setSearchQuery`: función - Actualizar búsqueda
- `filteredData`: T[] - Datos filtrados
- `clearSearch`: función - Limpiar búsqueda
- `hasResults`: boolean - Si hay resultados

### useTeamFollow
Manejo del sistema de seguimiento de equipos.

```tsx
const {
  followedTeam,
  isFollowing,
  followTeam,
  unfollowTeam,
  changeTeam,
  loading
} = useTeamFollow(userId);
```

**Retorna:**
- `followedTeam`: Equipo | null - Equipo seguido
- `isFollowing`: boolean - Si sigue a un equipo
- `followTeam`: (team: Equipo) => void - Seguir equipo
- `unfollowTeam`: () => void - Dejar de seguir
- `changeTeam`: (team: Equipo) => void - Cambiar equipo
- `loading`: boolean - Estado de carga

### useValidation
Validación de formularios.

```tsx
const { validate, errors, isValid } = useValidation(rules);
```

---

## 🔧 Utilidades

### calculations.ts

```tsx
import { 
  calculateAge, 
  calculateAverage, 
  calculatePercentage, 
  calculateGoalDifference, 
  calculatePoints 
} from '../utils';

// Ejemplos
calculateAge('2000-05-15');           // 24
calculateAverage(15, 5);              // 3.0
calculatePercentage(3, 10);           // 30
calculateGoalDifference(15, 8);       // 7
calculatePoints(5, 2);                // 17 (5*3 + 2*1)
```

### formatters.ts

```tsx
import { 
  formatDate, 
  formatDateLong, 
  formatTime, 
  formatNumber, 
  formatPercentage, 
  truncateText, 
  capitalize 
} from '../utils';

// Ejemplos
formatDate('2025-03-15');             // "15/03/2025"
formatDateLong('2025-03-15');         // "15 de marzo de 2025"
formatTime('15:30');                  // "15:30"
formatNumber(3.14159, 2);             // "3.14"
formatPercentage(85);                 // "85%"
truncateText('Texto muy largo', 10); // "Texto m..."
capitalize('hello');                  // "Hello"
```

### errorHandling.ts

```tsx
import { errorHandler, safeAsync } from '../utils';

// Loggear error
errorHandler.logError(error, 'ComponentName', 'high', { userId: 123 });

// Wrapper seguro para async
const result = await safeAsync(
  () => fetchData(),
  'fetchData',
  { 
    showAlert: true, 
    severity: 'medium',
    fallbackValue: []
  }
);
```

### fixtureGenerator.ts
Generador automático de fixtures (round-robin).

```tsx
import { generateFixture } from '../utils';

const partidos = generateFixture(equipos, faseId, canchas);
```

---

## 🌍 Contextos Globales

### AuthContext
Manejo de autenticación y roles.

```tsx
const {
  usuario,
  token,
  isAuthenticated,
  isAdmin,
  isSuperAdmin,
  isTournamentAdmin,
  isFan,
  isGuest,
  login,
  loginAsGuest,
  logout,
  updateUsuario,
  suplantarIdentidad,
  restaurarIdentidad,
  usuarioReal
} = useAuth();
```

**Roles soportados:**
- `superadmin`: Gestiona países y admins
- `admin`: Gestiona torneos asignados
- `fan`: Usuario normal
- `invitado`: Acceso limitado sin registro

### ThemeContext
Tema y personalización visual.

```tsx
const {
  mode,              // 'light' | 'dark'
  colors,            // Paleta actual
  colorPreset,       // 'red' | 'blue' | 'pink'
  gradient,          // Array de colores para gradiente
  splashGradient,
  logo,              // Logo según preset
  toggle,            // Cambiar modo claro/oscuro
  setMode,
  setColorPreset
} = useTheme();
```

### ToastContext
Notificaciones toast.

```tsx
const {
  showToast,
  showSuccess,
  showError,
  showWarning,
  showInfo,
  hideToast
} = useToast();

// Uso
showSuccess('Guardado correctamente', 'Éxito');
showError('Error al guardar', 'Error');
showToast({
  type: 'info',
  message: 'Mensaje personalizado',
  duration: 3000,
  action: {
    label: 'Deshacer',
    onPress: () => handleUndo()
  }
});
```

---

## 📝 Sistema de Tipos

### Entidades Principales

```typescript
// Usuario
interface Usuario {
  id_usuario: number;
  email: string;
  rol: 'superadmin' | 'admin' | 'fan' | 'invitado';
  id_pais: number;
  id_torneos?: number[];
  id_ediciones?: number[];
  id_admin_suplantando?: number;
  acepto_terminos?: boolean;
  acepto_privacidad?: boolean;
  fecha_aceptacion_terminos?: string;
  debe_cambiar_password?: boolean;
}

// Torneo y Edición
interface Torneo {
  id_torneo: number;
  nombre: string;
  id_pais: number;
}

interface Edicion {
  id_edicion: number;
  numero: number;
  estado: 'abierto' | 'cerrado' | 'en juego';
  id_torneo: number;
}

// Categoría
interface Categoria {
  id_categoria: number;
  nombre: string;
  tiene_restriccion_edad?: boolean;
  edad_maxima?: number;
  permite_refuerzos?: boolean;
  max_refuerzos?: number;
}

// Equipo
interface Equipo {
  id_equipo: number;
  nombre: string;
  logo?: string;
  id_edicion_categoria: number;
}

// Jugador
interface Jugador {
  id_jugador: number;
  nombre_completo: string;
  dni: string;
  numero_camiseta?: number;
  fecha_nacimiento: string;
  estado: 'activo' | 'inactivo';
  foto?: string;
  estadisticas?: {
    goles: number;
    asistencias: number;
    amarillas: number;
    rojas: number;
    partidos_jugados: number;
  };
}

// Partido
interface Partido {
  id_partido: number;
  fecha: string;
  hora?: string;
  estado_partido: 'Pendiente' | 'En curso' | 'Finalizado' | 'Suspendido';
  marcador_local?: number;
  marcador_visitante?: number;
  penales_local?: number;
  penales_visitante?: number;
  wo?: boolean;
  id_equipo_local: number;
  id_equipo_visitante: number;
  id_ronda?: number;
  id_fase: number;
  id_cancha?: number;
}

// Evento de Partido
interface EventoPartido {
  id_evento: number;
  minuto: number;
  tipo_evento: 'gol' | 'asistencia' | 'amarilla' | 'roja' | 'cambio';
  id_partido: number;
  id_jugador: number;
}

// Grupo y Clasificación
interface Grupo {
  id_grupo: number;
  nombre: string;
  id_fase: number;
  tipo_clasificacion?: 'pasa_copa_general' | 'pasa_copa_oro' | 'pasa_copa_plata' | 'pasa_copa_bronce' | 'eliminado';
  cantidad_equipos?: number;
  equipos_pasan_oro?: number;
  equipos_pasan_plata?: number;
}

interface Clasificacion {
  id_clasificacion: number;
  id_equipo: number;
  id_grupo: number;
  pj: number;
  gf: number;
  gc: number;
  dif: number;
  puntos: number;
  posicion: number;
}

// Ronda
interface Ronda {
  id_ronda: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin?: string;
  id_fase: number;
  es_amistosa: boolean;
  tipo: 'fase_grupos' | 'eliminatorias' | 'amistosa';
  subtipo_eliminatoria?: 'oro' | 'plata' | 'bronce';
  aplicar_fecha_automatica?: boolean;
  orden: number;
}
```

### Tipos Adicionales

```typescript
// Local y Cancha
interface Local {
  id_local: number;
  nombre: string;
  latitud: number;
  longitud: number;
}

interface Cancha {
  id_cancha: number;
  nombre: string;
  id_local: number;
}

// Sponsor
interface Sponsor {
  id_sponsor: number;
  nombre: string;
  logo: string;
  link: string;
  id_edicion_categoria?: number;
}

// Próximo Partido
interface ProximoPartido {
  id_partido: number;
  fecha: string;
  hora: string;
  rival: { nombre: string; logo?: string };
  cancha: { nombre: string; direccion?: string };
  local: boolean;
}

// Notificación
interface Notificacion {
  id_notificacion: number;
  titulo: string;
  descripcion: string;
  fecha: string;
  url?: string;
  id_usuario?: number;
}
```

---

## 🎨 Theming y Estilos

### Paleta de Colores

```typescript
const colors = {
  // Principales
  primary: '#E31E24',
  primaryDark: '#C01A1F',
  primaryLight: '#FF4C52',
  
  // Fondos
  background: '#FFFFFF',
  backgroundGray: '#F5F5F5',
  
  // Textos
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  textLight: '#999999',
  white: '#FFFFFF',
  
  // Estados
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',
  
  // Bordes
  border: '#E0E0E0',
  borderLight: '#F0F0F0',
  
  // Otros
  disabled: '#CCCCCC',
  overlay: 'rgba(0, 0, 0, 0.5)',
};
```

### Presets de Color

| Preset | Primary | Uso |
|--------|---------|-----|
| `red` | #E31E24 | Default |
| `blue` | #1E88E5 | Alternativo |
| `pink` | #E91E63 | Alternativo |

### Modo Oscuro

```typescript
const darkColors = {
  background: '#0B0B0F',
  backgroundGray: '#121217',
  textPrimary: '#E6E6E6',
  textSecondary: '#BDBDBD',
  textLight: '#9E9E9E',
  white: '#0B0B0F',
  border: '#1F1F23',
  borderLight: '#2A2A2F',
};
```

---


#### Estadísticas
```typescript
mockStatsApi.getTopScorers(idEdicionCategoria, limit)   // GET /stats/top-scorers
mockStatsApi.getTopAssists(idEdicionCategoria, limit)   // GET /stats/top-assists
mockStatsApi.getLeastConceded(idEdicionCategoria, limit) // GET /stats/least-conceded
mockStatsApi.getMostYellows(idEdicionCategoria, limit)  // GET /stats/most-yellows
mockStatsApi.getMostReds(idEdicionCategoria, limit)     // GET /stats/most-reds
```

---

## 📦 InterfacesForBackend

Esta carpeta contiene todos los **contratos de API** tipados en TypeScript para implementar el backend. Está diseñada para compartirse entre frontend y backend, garantizando consistencia de tipos.

### Estructura

```
InterfacesForBackend/
├── index.ts                 # Barrel export de todo el módulo
├── entities/                # Modelos de base de datos (25 entidades)
├── dtos/                    # Data Transfer Objects (13 DTOs)
├── responses/               # Tipos de respuesta API genéricos
└── endpoints/               # Contratos REST (20 archivos)
```

### Entidades Disponibles

| Entidad | Descripción |
|---------|-------------|
| `Usuario` | Usuarios del sistema con roles |
| `Pais` | Países donde hay torneos |
| `Torneo` | Torneos de fútbol |
| `Edicion` | Ediciones anuales de torneos |
| `Categoria` | Categorías globales (Libre, Senior, etc.) |
| `EdicionCategoria` | Categoría específica de una edición |
| `Equipo` | Equipos participantes |
| `Jugador` | Jugadores registrados |
| `PlantillaEquipo` | Relación jugador-equipo por edición |
| `Fase` | Fases de competición (grupos, eliminatorias) |
| `Grupo` | Grupos dentro de una fase |
| `Ronda` | Rondas/fechas de partidos |
| `Partido` | Partidos individuales |
| `EventoPartido` | Eventos (goles, tarjetas, etc.) |
| `Clasificacion` | Tabla de posiciones |
| `Local` | Locaciones/sedes |
| `Cancha` | Canchas dentro de un local |
| `Sponsor` | Patrocinadores |
| `Banner` | Banners publicitarios |
| `Notificacion` | Notificaciones push |
| `Fotos` | Galería de fotos |
| `SeguimientoEquipo` | Equipos seguidos por fans |
| `HistorialEquipoEdicion` | Historial de equipos |
| `HistorialJugadorEdicion` | Historial de jugadores |
| `ReglaAvance` | Reglas de avance entre fases |

### Endpoints REST

Todos los endpoints siguen el patrón `/api/v1/...` y están documentados con JSDoc.

| Archivo | Base URL | Descripción |
|---------|----------|-------------|
| `auth.endpoints.ts` | `/api/v1/auth` | Login, registro, tokens, contraseñas |
| `usuarios.endpoints.ts` | `/api/v1/usuarios` | CRUD usuarios, roles, perfil |
| `paises.endpoints.ts` | `/api/v1/paises` | CRUD países |
| `torneos.endpoints.ts` | `/api/v1/torneos` | CRUD torneos, logos |
| `ediciones.endpoints.ts` | `/api/v1/ediciones` | CRUD ediciones, estados |
| `categorias.endpoints.ts` | `/api/v1/categorias` | Categorías y edición-categorías |
| `equipos.endpoints.ts` | `/api/v1/equipos` | CRUD equipos, estadísticas |
| `jugadores.endpoints.ts` | `/api/v1/jugadores` | CRUD jugadores, plantillas |
| `fases.endpoints.ts` | `/api/v1/fases` | CRUD fases, reglas avance |
| `grupos.endpoints.ts` | `/api/v1/grupos` | CRUD grupos, clasificación |
| `rondas.endpoints.ts` | `/api/v1/rondas` | CRUD rondas, fixture |
| `partidos.endpoints.ts` | `/api/v1/partidos` | CRUD partidos, eventos, resultados |
| `clasificacion.endpoints.ts` | `/api/v1/clasificacion` | Tablas, bracket, mejores terceros |
| `estadisticas.endpoints.ts` | `/api/v1/estadisticas` | Goleadores, asistencias, tarjetas |
| `locales.endpoints.ts` | `/api/v1/locales` | CRUD locales, geolocalización |
| `canchas.endpoints.ts` | `/api/v1/canchas` | CRUD canchas, disponibilidad |
| `sponsors.endpoints.ts` | `/api/v1/sponsors` | CRUD sponsors y banners |
| `notificaciones.endpoints.ts` | `/api/v1/notificaciones` | Push notifications |
| `fotos.endpoints.ts` | `/api/v1/fotos` | Galerías y compras |
| `seguimiento.endpoints.ts` | `/api/v1/seguimiento` | Seguir equipos |

### Respuestas API

```typescript
// Respuesta exitosa
interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

// Respuesta paginada
interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  timestamp: string;
}

// Respuesta de error
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  timestamp: string;
}
```

### Roles del Sistema

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| `superadmin` | Administrador global | Todo el sistema |
| `admin` | Admin de torneo | Torneos asignados |
| `fan` | Usuario registrado | Ver + seguir equipos |
| `invitado` | Sin registro | Solo lectura básica |

### Uso en el Backend

```typescript
// Importar todo
import { 
  Usuario, 
  LoginRequestDTO, 
  ApiResponse,
  LoginEndpoint 
} from 'InterfacesForBackend';

// O importar específico
import { LoginRequestDTO } from 'InterfacesForBackend/dtos/auth.dto';
```

---

## 🔌 Consideraciones Técnicas del Backend

### Autenticación
- JWT con refresh tokens
- Expiración de access token: 15 min
- Refresh token no expira por tiempo, se invalida al:
  - Logout
  - Cambio de contraseña
  - Revocación de dispositivo
- Rate limiting en endpoints de auth

### Base de Datos (PostgreSQL recomendado)
- Índices en campos de búsqueda frecuente
- Triggers para actualizar clasificaciones automáticamente
- Vistas materializadas para estadísticas

### Caché (Redis recomendado)
- Cachear estadísticas ("The Best"): 5 min
- Cachear clasificaciones: 1 min
- Invalidar caché al cargar resultados

### Almacenamiento de Archivos
- S3 o similar para logos, fotos
- CDN para servir imágenes
- Optimización y resize automático

### Permisos por Rol

| Acción | SuperAdmin | Admin | Fan | Invitado |
|--------|------------|-------|-----|----------|
| Ver países | ✅ | ✅ | ✅ | ✅ |
| Crear países | ✅ | ❌ | ❌ | ❌ |
| Ver torneos | ✅ | ✅ (asignados) | ✅ | ✅ |
| Crear torneos | ✅ | ❌ | ❌ | ❌ |
| Editar torneos | ✅ | ✅ (asignados) | ❌ | ❌ |
| Gestionar equipos | ✅ | ✅ (asignados) | ❌ | ❌ |
| Cargar resultados | ✅ | ✅ (asignados) | ❌ | ❌ |
| Seguir equipo | ✅ | ❌ | ✅ | ❌ |
| Ver fotos completas | ✅ | ✅ | ✅ (pago) | ❌ |
| Suplantar usuarios | ✅ | ❌ | ❌ | ❌ |

### Validaciones Backend
- Verificar restricciones de edad en categorías
- Verificar límites de refuerzos
- Verificar DNI únicos
- Validar fechas de partidos
- Verificar que equipos pertenecen a la categoría

---

## 🧪 Testing

### Estructura de Tests (Propuesta)

```
__tests__/
├── utils/
│   ├── calculations.test.ts
│   └── formatters.test.ts
├── hooks/
│   ├── useSearch.test.ts
│   └── useTeamFollow.test.ts
├── components/
│   ├── Button.test.tsx
│   ├── Card.test.tsx
│   └── SearchBar.test.tsx
└── screens/
    ├── HomeScreen.test.tsx
    └── GroupStageScreen.test.tsx
```

### Pendientes
- [ ] Unit tests para utils (calculations, formatters)
- [ ] Unit tests para custom hooks
- [ ] Integration tests para pantallas
- [ ] E2E tests con Detox
- [ ] Storybook para componentes

### Infraestructura
- [ ] CI/CD con GitHub Actions
- [ ] Releases automáticos
- [ ] Sentry para error tracking
- [ ] Analytics (Firebase/Mixpanel)
- [ ] Feature flags

---

## 🐛 Problemas Conocidos y Mejoras Pendientes

Esta sección lista los bugs conocidos y mejoras necesarias, indicando dónde encontrar y cómo resolver cada issue.

### 🔴 Críticos (Funcionalidad Rota)

#### 1. Crear Torneo No Funciona
**Ubicación:** `src/screens/admin/CreateTournamentScreen.tsx`
**Problema:** El formulario de creación de torneo no envía datos correctamente al API
**Solución sugerida:**
- Verificar el método `handleSubmit` en línea ~150
- Revisar que `api.torneos.create()` en `src/api/services/torneos.service.ts` esté correctamente implementado
- Validar que el payload coincida con lo que espera el backend
- Agregar logs de debugging para ver qué se está enviando

#### 2. Actualizar Torneo No Funciona
**Ubicación:** `src/screens/admin/EditTournamentScreen.tsx`
**Problema:** No se guardan los cambios al editar un torneo
**Solución sugerida:**
- Revisar el método `handleSave`
- Verificar que `api.torneos.update()` en `src/api/services/torneos.service.ts` reciba el `id_torneo` correctamente
- Confirmar que los campos del formulario estén vinculados al estado
- Verificar que el endpoint PUT esté funcionando en el backend

#### 3. Editar Categoría No Funciona
**Ubicación:** `src/screens/admin/CategoryManagementScreen.tsx`
**Problema:** Los cambios en categorías no se persisten
**Solución sugerida:**
- Localizar la función de edición de categoría (probablemente en un modal)
- Revisar `api.categorias.update()` o `api.edicionCategorias.update()` en los servicios correspondientes
- Verificar que el `id_categoria` o `id_edicion_categoria` se esté pasando correctamente

#### 4. Crear Cancha No Funciona
**Ubicación:** `src/screens/admin/CreateCanchaScreen.tsx`
**Problema:** No se crean nuevas canchas
**Solución sugerida:**
- Revisar el método `handleSubmit`
- Verificar `api.locales.createCancha()` en `src/api/services/locales.service.ts`
- Asegurar que `id_local` se esté pasando correctamente al crear la cancha
- Validar campos requeridos

#### 5. Eliminar Jornada No Funciona
**Ubicación:** `src/screens/admin/RondasListScreen.tsx` o `RondaDetailScreen.tsx`
**Problema:** El botón de eliminar no funciona
**Solución sugerida:**
- Buscar el método `handleDelete` o similar
- Implementar `api.rondas.delete(id_ronda)` en `src/api/services/rondas.service.ts`
- Agregar confirmación antes de eliminar
- Actualizar la lista después de eliminar exitosamente

#### 6. Crear Múltiples Grupos No Funciona
**Ubicación:** `src/screens/admin/CreateGroupsFlowScreen.tsx`
**Problema:** Solo crea un grupo o falla al crear varios
**Solución sugerida:**
- Revisar el loop de creación de grupos
- Verificar que cada llamada a `api.grupos.create()` se esté esperando correctamente (await en loop)
- Considerar usar `Promise.all()` para crear grupos en paralelo
- Agregar manejo de errores individual para cada grupo

#### 7. Mover Equipo de Grupo No Funciona
**Ubicación:** `src/screens/admin/components/MoveTeamToGroupModal.tsx`
**Problema:** No se puede reasignar un equipo a otro grupo
**Solución sugerida:**
- Revisar el método de submit del modal
- Implementar `api.grupos.moverEquipo()` o actualizar la asignación
- Verificar que se esté enviando el `id_equipo` y el nuevo `id_grupo`
- Refrescar la lista de grupos después del cambio

#### 8. Entrar a Información de Jugador No Carga
**Ubicación:** `src/screens/home/PlayerDetailScreen.tsx`
**Problema:** La pantalla se queda en loading o no muestra datos
**Solución sugerida:**
- Revisar el `useEffect` que carga los datos del jugador (línea ~50-80)
- Verificar que `api.jugadores.get(id_jugador)` en `src/api/services/jugadores.service.ts` esté implementado
- Asegurar que el `id_jugador` se pase correctamente desde la navegación
- Revisar el manejo de errores y estados de loading

#### 9. Ver Resultado de Partido No Funciona
**Ubicación:** `src/screens/admin/ResultPage.tsx` o `src/screens/home/MatchDetailScreen.tsx`
**Problema:** No carga la información del resultado
**Solución sugerida:**
- En ResultPage: Revisar el método `loadData` (línea ~69-164)
- Verificar que `api.partidos.getResultado(id_partido)` devuelva la estructura correcta
- En MatchDetailScreen: Implementar la carga de eventos del partido
- Validar que el partido tenga resultados registrados

#### 10. Sponsors No Funciona (Aspecto Completo)
**Ubicación:**
- `src/screens/admin/CreateSponsorScreen.tsx`
- `src/screens/admin/EditSponsorScreen.tsx`
- `src/screens/admin/components/SponsorTab.tsx`

**Problema:** Crear, editar y visualizar sponsors está roto
**Solución sugerida:**
- **CreateSponsorScreen**: Revisar método `handleSubmit`, verificar `api.sponsors.create()`
- **EditSponsorScreen**: Revisar carga inicial de datos y método `handleSave`
- **SponsorTab**: Verificar que `api.sponsors.list()` devuelva datos
- Implementar todos los métodos en `src/api/services/sponsors.service.ts` si no existen
- Validar upload de imágenes de logos

#### 11. Editar Perfil No Funciona Bien
**Ubicación:** `src/screens/profile/ProfileScreen.tsx`
**Problema:** Los cambios no se guardan o la UI no responde bien
**Solución sugerida:**
- Buscar el método de guardar cambios (probablemente `handleSaveProfile`)
- Verificar `api.usuarios.update()` en `src/api/services/usuarios.service.ts`
- Asegurar que los campos editables estén vinculados al estado
- Actualizar el contexto de autenticación después de guardar cambios
- Revisar validaciones de formulario

---

### 🟡 Importantes (UX/UI)

#### 12. Teclado Tapa Campos en Configurar Categorías
**Ubicación:** `src/screens/admin/CategoryManagementScreen.tsx`
**Problema:** El teclado cubre los campos inferiores del formulario
**Solución sugerida:**
- Envolver el formulario en `<KeyboardAvoidingView>` de React Native
- Usar `behavior="padding"` en iOS y `behavior="height"` en Android
- Alternativamente, usar `react-native-keyboard-aware-scroll-view`
- Ejemplo:
```tsx
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={{flex: 1}}
>
  <ScrollView>
    {/* Formulario aquí */}
  </ScrollView>
</KeyboardAvoidingView>
```

#### 13. Primera Fila de Estadísticas Detalladas Repite Datos
**Ubicación:** `src/screens/home/TheBestScreen.tsx` o componente de estadísticas
**Problema:** Los datos se duplican en la primera fila
**Solución sugerida:**
- Revisar el método `renderItem` o el componente que muestra las estadísticas
- Verificar que no haya un header row duplicado
- Revisar la lógica de mapeo de datos (probablemente línea ~100-150)
- Asegurar que `data.slice()` o `data.map()` no esté incluyendo elementos duplicados

#### 14. Logos de Equipos No Cargan
**Ubicación:** Múltiples pantallas (principalmente `TeamDetailScreen.tsx`, `GroupStageScreen.tsx`)
**Problema:** Las imágenes de logos no se muestran
**Solución sugerida:**
- Verificar que las URLs de logos sean válidas y accesibles
- Revisar componente `<Image source={{ uri: equipo.logo }}>`
- Agregar placeholder cuando logo sea null/undefined
- Verificar CORS si las imágenes están en servidor externo
- Usar `onError` para detectar errores de carga
- Ejemplo:
```tsx
<Image
  source={equipo.logo ? { uri: equipo.logo } : require('../../assets/default-team.png')}
  onError={(error) => // //console.log('Logo failed to load:', error)}
/>
```

#### 15. Debería Decir "Grupo C" en vez de Solo "C"
**Ubicación:** `src/screens/home/GroupStageScreen.tsx` o componente de tabs de grupos
**Problema:** Solo muestra "C" en lugar de "Grupo C"
**Solución sugerida:**
- Buscar el render de tabs o el título del grupo (probablemente línea ~200-250)
- Cambiar de `{grupo.nombre}` a `Grupo ${grupo.nombre}`
- Si está en tabs, actualizar el label:
```tsx
<Tab label={`Grupo ${grupo.nombre}`} />
```

#### 16. Necesidad de Salir y Entrar para Ver Nuevo Grupo
**Ubicación:** `src/screens/admin/CreateGroupScreen.tsx` y pantalla padre
**Problema:** La lista no se refresca automáticamente
**Solución sugerida:**
- Después de crear grupo exitosamente, llamar al callback de refresh
- Usar `navigation.goBack()` con parámetro de refresh:
```tsx
navigation.navigate('GruposList', { refresh: true });
```
- En la pantalla de lista, escuchar cambios con `useFocusEffect`:
```tsx
import { useFocusEffect } from '@react-navigation/native';

useFocusEffect(
  useCallback(() => {
    loadGrupos();
  }, [])
);
```

#### 17. Circulitos de Clasificación Deberían Ser Oro/Plata/Bronce
**Ubicación:** `src/screens/home/GroupStageScreen.tsx` o componente de tabla de posiciones
**Problema:** Todos los indicadores son del mismo color (oro)
**Solución sugerida:**
- Buscar el componente que renderiza los círculos de posición (probablemente línea ~300-400)
- Implementar lógica basada en la posición y configuración del grupo:
```tsx
const getPositionColor = (posicion: number, grupo: Grupo) => {
  if (posicion <= grupo.equipos_pasan_oro) return '#FFD700'; // Oro
  if (posicion <= grupo.equipos_pasan_oro + grupo.equipos_pasan_plata) return '#C0C0C0'; // Plata
  if (posicion <= grupo.equipos_pasan_oro + grupo.equipos_pasan_plata + 1) return '#CD7F32'; // Bronce
  return '#E0E0E0'; // Gris claro (no clasifica)
};
```

#### 18. En Jornada 5 Se Importa Dos Veces el Mismo Partido
**Ubicación:** `src/screens/admin/RondaDetailScreen.tsx` o `FixtureEmbedImproved.tsx`
**Problema:** Los partidos aparecen duplicados en el listado
**Solución sugerida:**
- Revisar el componente que renderiza la lista de partidos
- Verificar que no haya múltiples llamadas a la API
- Usar `Set` o filtrar duplicados por `id_partido`:
```tsx
const partidosUnicos = partidos.filter((partido, index, self) =>
  index === self.findIndex((p) => p.id_partido === partido.id_partido)
);
```
- Revisar si el componente se está montando dos veces

---

### 🟢 Mejoras Opcionales

#### 19. Borrar Campo "Posición del Jugador"
**Ubicación:** `src/screens/home/PlayerFormScreen.tsx` o `PlayerDetailScreen.tsx`
**Problema:** Campo innecesario o no usado
**Solución sugerida:**
- Eliminar el input de posición del formulario
- Comentar o eliminar la validación relacionada
- Actualizar la interfaz `Jugador` en `src/types/index.ts` si ya no es necesario

#### 20. Eliminar Peso y Altura
**Ubicación:** `src/screens/home/PlayerFormScreen.tsx`
**Problema:** Campos que no se usan en la aplicación
**Solución sugerida:**
- Remover inputs de peso y altura del formulario
- Limpiar la lógica de submit que incluye estos campos
- Mantener en el backend por si se necesitan después

#### 21. Información de Delegado Solo para Admins
**Ubicación:** `src/screens/home/TeamDetailScreen.tsx`
**Problema:** Los fans pueden ver información privada del delegado
**Solución sugerida:**
- Usar el contexto de autenticación para verificar el rol:
```tsx
const { isAdmin, isSuperAdmin } = useAuth();

{(isAdmin || isSuperAdmin) && (
  <View>
    <Text>Delegado: {equipo.delegado_nombre}</Text>
    <Text>Teléfono: {equipo.delegado_telefono}</Text>
  </View>
)}
```

#### 22. ¿Son Necesarios los Colores del Equipo?
**Ubicación:** `src/screens/admin/CreateTeamScreen.tsx` y `EditTeamScreen.tsx`
**Problema:** Funcionalidad que quizás no se use
**Solución sugerida:**
- Si no se usan, hacer los campos opcionales o eliminarlos
- Si se deciden usar, implementar selector de color con:
  - `react-native-color-picker` o similar
  - Mostrar preview del color seleccionado
  - Usar en las tarjetas de equipo para personalización

---

## 📋 Checklist de Corrección de Bugs

Para cada bug, seguir estos pasos:

1. **Localizar el archivo** indicado arriba
2. **Reproducir el bug** en ambiente de desarrollo
3. **Agregar logs** de debugging:
```tsx
// //console.log('📊 [ComponentName] Estado actual:', state);
// //console.log('✅ [ComponentName] Datos enviados:', payload);
// //console.log('❌ [ComponentName] Error:', error);
```
4. **Verificar el servicio de API** correspondiente en `src/api/services/`
5. **Probar la solución** en dispositivo real o emulador
6. **Actualizar tests** si existen
7. **Documentar el cambio** en el commit

---

## 🛠️ Herramientas de Debugging Recomendadas

### Para React Native
```bash
# Ver logs en tiempo real
npx react-native log-android
npx react-native log-ios

# Debugger con Flipper
npx react-native doctor
# Instalar Flipper: https://fbflipper.com/
```

### Para API
```bash
# Instalar axios interceptors para logging
# Ver src/api/apiClient.ts y agregar:
apiClient.interceptors.request.use(request => {
  // //console.log('🚀 Request:', request.method?.toUpperCase(), request.url);
  return request;
});

apiClient.interceptors.response.use(
  response => {
    // //console.log('✅ Response:', response.config.url, response.status);
    return response;
  },
  error => {
    // //console.log('❌ Error:', error.config?.url, error.response?.status);
    return Promise.reject(error);
  }
);
```

### Chrome DevTools
- Abrir en navegador: `chrome://inspect`
- Remote devices → Inspect
- // //console para ver todos los logs