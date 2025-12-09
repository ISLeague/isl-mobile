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
14. [Requerimientos de Backend](#-requerimientos-de-backend)
15. [Mejoras Futuras](#-mejoras-futuras)
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
- `jugador`: Rol de jugador (futuro)
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
  rol: 'superadmin' | 'admin' | 'jugador' | 'fan' | 'invitado';
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

## 📡 API Mock Actual

### Estructura de la API Mock

```typescript
const mockApi = {
  auth: mockAuthApi,      // Autenticación
  main: mockMainApi,      // Navegación principal
  competition: mockCompetitionApi,  // Competición
  teams: mockTeamsApi,    // Equipos
  knockout: mockKnockoutApi,  // Eliminatorias
  stats: mockStatsApi,    // Estadísticas
  profile: mockProfileApi,  // Perfil
};
```

### Endpoints Actuales

#### Autenticación
```typescript
mockAuthApi.login(credentials)      // POST /auth/login
mockAuthApi.register(data)          // POST /auth/register
mockAuthApi.logout()                // POST /auth/logout
mockAuthApi.getProfile(token)       // GET /profile
```

#### Navegación Principal
```typescript
mockMainApi.getBanners()                        // GET /banners
mockMainApi.getCountries()                      // GET /countries
mockMainApi.getTournamentsByCountry(idPais)     // GET /countries/{id}/tournaments
mockMainApi.getEditionsByTournament(idTorneo)   // GET /tournaments/{id}/editions
mockMainApi.getCategoriesByEdition(idEdicion)   // GET /editions/{id}/categories
```

#### Competición
```typescript
mockCompetitionApi.getPhases(idEdicionCategoria)       // GET /edition-categories/{id}/phases
mockCompetitionApi.getGroupsByPhase(idFase)            // GET /phases/{id}/groups
mockCompetitionApi.getStandingsByGroup(idGrupo)        // GET /groups/{id}/standings
mockCompetitionApi.getMatchesByPhase(idFase)           // GET /phases/{id}/matches
mockCompetitionApi.getMatchDetail(idPartido)           // GET /matches/{id}
mockCompetitionApi.searchMatches(teamName)             // GET /matches/search?team_name=...
```

#### Equipos
```typescript
mockTeamsApi.getTeamDetail(idEquipo)    // GET /teams/{id}
mockTeamsApi.getTeamStats(idEquipo)     // GET /teams/{id}/stats
mockTeamsApi.getNextMatch(idEquipo)     // GET /teams/{id}/next-match
mockTeamsApi.getRecentForm(idEquipo)    // GET /teams/{id}/recent-form
mockTeamsApi.getTeamPlayers(idEquipo)   // GET /teams/{id}/players
```

#### Estadísticas
```typescript
mockStatsApi.getTopScorers(idEdicionCategoria, limit)   // GET /stats/top-scorers
mockStatsApi.getTopAssists(idEdicionCategoria, limit)   // GET /stats/top-assists
mockStatsApi.getLeastConceded(idEdicionCategoria, limit) // GET /stats/least-conceded
mockStatsApi.getMostYellows(idEdicionCategoria, limit)  // GET /stats/most-yellows
mockStatsApi.getMostReds(idEdicionCategoria, limit)     // GET /stats/most-reds
```

---

## 🔌 Requerimientos de Backend

### Autenticación y Usuarios

#### Endpoints Requeridos

```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/logout
POST   /api/auth/refresh-token
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/change-password
GET    /api/auth/verify-token

GET    /api/users/me
PUT    /api/users/me
GET    /api/users/:id (Admin)
PUT    /api/users/:id (Admin)
DELETE /api/users/:id (SuperAdmin)
GET    /api/users (Admin - listado con filtros)
POST   /api/users/impersonate/:id (Admin - suplantación)
POST   /api/users/stop-impersonation
```

#### Modelo de Usuario (Backend)

```typescript
{
  id_usuario: number;
  email: string;
  password_hash: string;
  rol: 'superadmin' | 'admin' | 'jugador' | 'fan' | 'invitado';
  id_pais: number | null;
  id_torneos: number[];  // Para admins de torneo
  acepto_terminos: boolean;
  acepto_privacidad: boolean;
  fecha_aceptacion_terminos: Date | null;
  debe_cambiar_password: boolean;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
  last_login: Date | null;
}
```

#### Permisos por Rol

| Acción | SuperAdmin | Admin | Jugador | Fan | Invitado |
|--------|------------|-------|---------|-----|----------|
| Ver países | ✅ | ✅ | ✅ | ✅ | ✅ |
| Crear países | ✅ | ❌ | ❌ | ❌ | ❌ |
| Ver torneos | ✅ | ✅ (asignados) | ✅ | ✅ | ✅ |
| Crear torneos | ✅ | ❌ | ❌ | ❌ | ❌ |
| Editar torneos | ✅ | ✅ (asignados) | ❌ | ❌ | ❌ |
| Gestionar equipos | ✅ | ✅ (asignados) | ❌ | ❌ | ❌ |
| Cargar resultados | ✅ | ✅ (asignados) | ❌ | ❌ | ❌ |
| Seguir equipo | ✅ | ❌ | ✅ | ✅ | ❌ |
| Ver fotos completas | ✅ | ✅ | ✅ (pago) | ✅ (pago) | ❌ |
| Suplantar usuarios | ✅ | ❌ | ❌ | ❌ | ❌ |

---

### Países y Torneos

#### Endpoints

```
# Países
GET    /api/countries
POST   /api/countries (SuperAdmin)
PUT    /api/countries/:id (SuperAdmin)
DELETE /api/countries/:id (SuperAdmin)

# Torneos
GET    /api/countries/:id_pais/tournaments
POST   /api/tournaments (SuperAdmin)
PUT    /api/tournaments/:id (SuperAdmin/Admin asignado)
DELETE /api/tournaments/:id (SuperAdmin)
GET    /api/tournaments/:id
GET    /api/tournaments/:id/admins (SuperAdmin)
POST   /api/tournaments/:id/admins (SuperAdmin)
DELETE /api/tournaments/:id/admins/:id_admin (SuperAdmin)

# Ediciones
GET    /api/tournaments/:id/editions
POST   /api/editions (Admin)
PUT    /api/editions/:id (Admin)
DELETE /api/editions/:id (Admin)
PUT    /api/editions/:id/status (Admin) - Cambiar estado

# Categorías
GET    /api/categories
GET    /api/editions/:id/categories
POST   /api/editions/:id/categories (Admin)
PUT    /api/edition-categories/:id (Admin)
DELETE /api/edition-categories/:id (Admin)
```

---

### Equipos y Jugadores

#### Endpoints

```
# Equipos
GET    /api/edition-categories/:id/teams
POST   /api/teams (Admin)
PUT    /api/teams/:id (Admin)
DELETE /api/teams/:id (Admin)
GET    /api/teams/:id
GET    /api/teams/:id/stats
GET    /api/teams/:id/players
GET    /api/teams/:id/next-match
GET    /api/teams/:id/recent-form
GET    /api/teams/:id/photos
POST   /api/teams/:id/photos (Admin)
DELETE /api/teams/:id/photos/:id_foto (Admin)

# Jugadores
GET    /api/teams/:id/players
POST   /api/players (Admin)
PUT    /api/players/:id (Admin)
DELETE /api/players/:id (Admin)
GET    /api/players/:id
GET    /api/players/:id/stats
POST   /api/players/:id/transfer (Admin) - Transferir a otro equipo
PUT    /api/players/:id/status (Admin) - Activar/desactivar

# Plantillas
GET    /api/teams/:id/roster
POST   /api/teams/:id/roster (Admin) - Agregar jugador
DELETE /api/teams/:id/roster/:id_jugador (Admin) - Quitar jugador
PUT    /api/teams/:id/roster/:id_jugador (Admin) - Marcar refuerzo
```

---

### Competición

#### Endpoints

```
# Fases
GET    /api/edition-categories/:id/phases
POST   /api/phases (Admin)
PUT    /api/phases/:id (Admin)
DELETE /api/phases/:id (Admin)

# Grupos
GET    /api/phases/:id/groups
POST   /api/groups (Admin)
PUT    /api/groups/:id (Admin)
DELETE /api/groups/:id (Admin)
GET    /api/groups/:id/standings
POST   /api/groups/:id/teams (Admin) - Agregar equipo
DELETE /api/groups/:id/teams/:id_equipo (Admin) - Quitar equipo

# Rondas
GET    /api/phases/:id/rounds
POST   /api/rounds (Admin)
PUT    /api/rounds/:id (Admin)
DELETE /api/rounds/:id (Admin)

# Partidos
GET    /api/phases/:id/matches
GET    /api/rounds/:id/matches
POST   /api/matches (Admin)
PUT    /api/matches/:id (Admin)
DELETE /api/matches/:id (Admin)
GET    /api/matches/:id
GET    /api/matches/:id/events
POST   /api/matches/:id/events (Admin) - Agregar evento
DELETE /api/matches/:id/events/:id_evento (Admin)
PUT    /api/matches/:id/result (Admin) - Cargar resultado
GET    /api/matches/search?team_name=...

# Clasificación
GET    /api/groups/:id/standings
PUT    /api/classifications/:id (Admin) - Actualizar manual
POST   /api/groups/:id/recalculate (Admin) - Recalcular
```

---

### Estadísticas ("The Best")

#### Endpoints

```
GET /api/edition-categories/:id/stats/top-scorers?limit=10
GET /api/edition-categories/:id/stats/top-assists?limit=10
GET /api/edition-categories/:id/stats/least-conceded?limit=10
GET /api/edition-categories/:id/stats/most-goals?limit=10
GET /api/edition-categories/:id/stats/most-yellows?limit=10
GET /api/edition-categories/:id/stats/most-reds?limit=10
GET /api/edition-categories/:id/stats/goal-difference?limit=10
GET /api/edition-categories/:id/stats/avg-goals-scored?limit=10
GET /api/edition-categories/:id/stats/avg-goals-conceded?limit=10
GET /api/edition-categories/:id/stats/win-percentage?limit=10
GET /api/edition-categories/:id/stats/loss-percentage?limit=10
```

#### Cálculos Requeridos (Backend)

```typescript
// Goleadores: SUM(eventos WHERE tipo='gol') GROUP BY jugador
// Asistencias: SUM(eventos WHERE tipo='asistencia') GROUP BY jugador
// Menos recibidos: SUM(goles_en_contra) de clasificación GROUP BY equipo
// Más goles: SUM(goles_a_favor) GROUP BY equipo
// Tarjetas: SUM(eventos WHERE tipo='amarilla'|'roja') GROUP BY jugador
// Diferencia: goles_a_favor - goles_en_contra
// Promedios: total / partidos_jugados
// Porcentajes: (victorias|derrotas / total) * 100
```

---

### Seguimiento de Equipos

#### Endpoints

```
GET    /api/users/:id/followed-team
POST   /api/users/:id/follow-team/:id_equipo
DELETE /api/users/:id/unfollow-team
PUT    /api/users/:id/change-followed-team/:id_equipo
```

---

### Locales, Canchas y Sponsors

#### Endpoints

```
# Locales
GET    /api/edition-categories/:id/locals
POST   /api/locals (Admin)
PUT    /api/locals/:id (Admin)
DELETE /api/locals/:id (Admin)
GET    /api/locals/:id

# Canchas
GET    /api/locals/:id/courts
POST   /api/courts (Admin)
PUT    /api/courts/:id (Admin)
DELETE /api/courts/:id (Admin)

# Sponsors
GET    /api/edition-categories/:id/sponsors
POST   /api/sponsors (Admin)
PUT    /api/sponsors/:id (Admin)
DELETE /api/sponsors/:id (Admin)
```

---

### Notificaciones

#### Endpoints

```
GET    /api/users/:id/notifications
POST   /api/notifications (Admin) - Enviar notificación
PUT    /api/notifications/:id/read
DELETE /api/notifications/:id
POST   /api/notifications/broadcast (Admin) - A todos
POST   /api/notifications/team/:id (Admin) - A seguidores de equipo
```

#### Modelo de Notificación

```typescript
{
  id_notificacion: number;
  titulo: string;
  descripcion: string;
  fecha: Date;
  url?: string;
  id_usuario?: number;  // null = broadcast
  id_equipo?: number;   // Para notificaciones de equipo
  leida: boolean;
  tipo: 'partido' | 'resultado' | 'general' | 'equipo';
}
```

---

### Fotos

#### Endpoints

```
GET    /api/teams/:id/photos
POST   /api/teams/:id/photos (Admin)
DELETE /api/photos/:id (Admin)
GET    /api/teams/:id/photos/preview  // Gratis
GET    /api/teams/:id/photos/full     // Requiere pago

# Pagos de fotos
POST   /api/photos/purchase/:id_equipo
GET    /api/users/:id/purchased-photos
```

---

### Historial

#### Endpoints

```
GET /api/teams/:id/history
GET /api/players/:id/history
GET /api/editions/:id/standings/final
GET /api/editions/:id/champion
```

---

### Consideraciones Técnicas del Backend

#### Autenticación
- JWT con refresh tokens
- Expiración de access token: 15 min
- Expiración de refresh token: 7 días
- Rate limiting en endpoints de auth

#### Base de Datos (PostgreSQL recomendado)
- Índices en campos de búsqueda frecuente
- Triggers para actualizar clasificaciones automáticamente
- Vistas materializadas para estadísticas

#### Caché (Redis recomendado)
- Cachear estadísticas ("The Best"): 5 min
- Cachear clasificaciones: 1 min
- Invalidar caché al cargar resultados

#### Tiempo Real (Socket.io o similar)
- Actualizaciones de marcador en vivo
- Notificaciones push
- Eventos de partido en tiempo real

#### Almacenamiento de Archivos
- S3 o similar para logos, fotos
- CDN para servir imágenes
- Optimización y resize automático

#### Validaciones Backend
- Verificar restricciones de edad en categorías
- Verificar límites de refuerzos
- Verificar DNI únicos
- Validar fechas de partidos
- Verificar que equipos pertenecen a la categoría

---

## 🚀 Mejoras Futuras

### Frontend

#### Performance
- [ ] Implementar React.memo en componentes frecuentemente re-renderizados
- [ ] useMemo para cálculos pesados (rankings, estadísticas)
- [ ] useCallback para funciones pasadas como props
- [ ] Lazy loading de imágenes
- [ ] Virtualización de listas largas (FlashList)
- [ ] Code splitting

#### Componentes
- [ ] RankingCard (extraer de TheBestScreen)
- [ ] PlayerStatsCard
- [ ] NextMatchCard
- [ ] TeamStatsCard
- [ ] MatchEventTimeline
- [ ] LiveScoreCard

#### UX/UI
- [ ] Pull to refresh en todas las listas
- [ ] Skeleton loaders consistentes
- [ ] Animaciones de transición mejoradas
- [ ] Haptic feedback
- [ ] Swipe actions en listas
- [ ] Empty states mejorados

#### Features
- [ ] Galería de fotos completa
- [ ] Notificaciones push reales
- [ ] Compartir en redes sociales
- [ ] Modo offline con caché
- [ ] Deep linking
- [ ] Widget de próximo partido
- [ ] Calendario de partidos exportable
- [ ] Favoritos múltiples
- [ ] Historial de búsquedas

### Testing

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

### Ejecutar Tests

```bash
# Unit tests
pnpm test

# Con coverage
pnpm test --coverage

# E2E tests
pnpm e2e:build
pnpm e2e:test
```

---

## 👥 Contribución

### Convenciones de Código

1. **Nombres de archivos**: PascalCase para componentes, camelCase para utils/hooks
2. **Componentes**: Functional components con TypeScript
3. **Estilos**: StyleSheet.create() al final del archivo
4. **Imports**: Ordenar por externos → internos → relativos
5. **Types**: Interfaces en `/types`, props inline

### Estructura de Commits

```
feat: Agregar nueva funcionalidad
fix: Corregir bug
docs: Actualizar documentación
style: Cambios de formato
refactor: Refactorización de código
test: Agregar o modificar tests
chore: Tareas de mantenimiento
```

### Pull Requests

1. Crear rama desde `develop`
2. Nombrar rama: `feature/nombre` o `fix/nombre`
3. Hacer PR a `develop`
4. Requiere 1 aprobación mínima
5. Pasar todos los tests

---

## 📄 Licencia

Proyecto privado - Todos los derechos reservados.

---

## 📞 Contacto

Para consultas sobre el proyecto, contactar al equipo de desarrollo.

---

*Última actualización: Diciembre 2025*
