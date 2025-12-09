# Componentes Comunes Reutilizables

Esta carpeta contiene componentes UI reutilizables que se pueden usar en toda la aplicación.

## Componentes Disponibles

### 1. GradientHeader
**Ubicación:** `src/components/common/GradientHeader.tsx`

Header con gradiente rojo que incluye navegación y acciones.

**Props:**
- `title` (string, requerido): Título principal del header
- `onBackPress` (function, opcional): Callback para el botón de volver
- `onProfilePress` (function, opcional): Callback para el botón de perfil
- `showNotification` (boolean, opcional): Muestra punto de notificación
- `leftElement` (ReactNode, opcional): Elemento personalizado para el lado izquierdo
- `rightElement` (ReactNode, opcional): Elemento personalizado para el lado derecho

**Ejemplo:**
```tsx
<GradientHeader
  title="Mi Pantalla"
  onBackPress={() => navigation.goBack()}
  onProfilePress={() => navigation.navigate('Profile')}
  showNotification={true}
/>
```

---

### 2. Card
**Ubicación:** `src/components/common/Card.tsx`

Contenedor con bordes redondeados y sombra opcional.

**Props:**
- `children` (ReactNode, requerido): Contenido de la tarjeta
- `onPress` (function, opcional): Si se proporciona, la tarjeta es clickeable
- `style` (ViewStyle, opcional): Estilos adicionales
- `elevated` (boolean, opcional, default: true): Muestra sombra

**Ejemplo:**
```tsx
<Card onPress={() => handlePress()} elevated={true}>
  <Text>Contenido de la tarjeta</Text>
</Card>
```

---

### 3. FAB (Floating Action Button)
**Ubicación:** `src/components/common/FAB.tsx`

Botón flotante para acciones primarias.

**Props:**
- `onPress` (function, requerido): Callback al presionar
- `icon` (string, opcional, default: 'add'): Nombre del icono de Ionicons
- `style` (ViewStyle, opcional): Estilos adicionales
- `color` (string, opcional, default: colors.primary): Color de fondo
- `iconColor` (string, opcional, default: colors.white): Color del icono
- `size` (number, opcional, default: 56): Tamaño del botón

**Ejemplo:**
```tsx
<FAB
  onPress={() => handleCreate()}
  icon="add"
  color={colors.primary}
/>
```

---

### 4. Modal
**Ubicación:** `src/components/common/Modal.tsx`

Modal deslizable desde abajo con header y scroll.

**Props:**
- `visible` (boolean, requerido): Controla la visibilidad
- `onClose` (function, requerido): Callback para cerrar
- `title` (string, opcional): Título del modal
- `children` (ReactNode, requerido): Contenido del modal
- `showCloseButton` (boolean, opcional, default: true): Muestra botón X
- `fullHeight` (boolean, opcional, default: false): Modal más alto (90%)

**Ejemplo:**
```tsx
<Modal
  visible={isVisible}
  onClose={() => setIsVisible(false)}
  title="Seleccionar Usuario"
  fullHeight={true}
>
  <Text>Contenido del modal</Text>
</Modal>
```

---

### 5. InfoCard
**Ubicación:** `src/components/common/InfoCard.tsx`

Tarjeta informativa con icono, título y valor.

**Props:**
- `title` (string, requerido): Título descriptivo (ej: "País")
- `value` (string, requerido): Valor a mostrar (ej: "Argentina 🇦🇷")
- `icon` (string, opcional): Nombre del icono
- `iconLibrary` ('material' | 'ionicons', opcional, default: 'material'): Librería de iconos
- `iconColor` (string, opcional, default: colors.primary): Color del icono
- `backgroundColor` (string, opcional, default: colors.backgroundGray): Color de fondo

**Ejemplo:**
```tsx
<InfoCard
  title="País"
  value="Argentina 🇦🇷"
  icon="flag"
  iconLibrary="material"
  iconColor={colors.primary}
/>
```

---

### 6. Button
**Ubicación:** `src/components/common/Button.tsx`

Botón estándar de la aplicación.

**Props:**
- `title` (string, requerido): Texto del botón
- `onPress` (function, requerido): Callback al presionar
- `variant` ('primary' | 'secondary' | 'outline' | 'danger', opcional): Estilo del botón
- `disabled` (boolean, opcional): Deshabilita el botón
- `loading` (boolean, opcional): Muestra indicador de carga

---

### 7. Input
**Ubicación:** `src/components/common/Input.tsx`

Campo de entrada de texto.

**Props:**
- `value` (string, requerido): Valor del input
- `onChangeText` (function, requerido): Callback al cambiar texto
- `placeholder` (string, opcional): Texto de placeholder
- `secureTextEntry` (boolean, opcional): Para contraseñas
- `keyboardType` (KeyboardType, opcional): Tipo de teclado
- `error` (string, opcional): Mensaje de error
- `label` (string, opcional): Etiqueta del campo

---

### 8. SuplantacionBanner
**Ubicación:** `src/components/common/SuplantacionBanner.tsx`

Banner rojo que indica cuando un admin está suplantando a otro usuario.

**Props:** Ninguna (usa el contexto de autenticación)

**Ejemplo:**
```tsx
<SuplantacionBanner />
```

---

### 8. SearchBar
**Ubicación:** `src/components/common/SearchBar.tsx`

Barra de búsqueda con ícono de lupa y botón para limpiar.

**Props:**
- `value` (string, requerido): Valor actual de la búsqueda
- `onChangeText` (function, requerido): Callback cuando cambia el texto
- `placeholder` (string, opcional, default: "Buscar..."): Texto del placeholder
- `onClear` (function, opcional): Callback personalizado para limpiar (por defecto limpia el campo)

**Ejemplo:**
```tsx
const [search, setSearch] = useState('');

<SearchBar
  value={search}
  onChangeText={setSearch}
  placeholder="Buscar equipo..."
  onClear={() => {
    setSearch('');
    // Lógica adicional
  }}
/>
```

---

## Uso General

Para importar los componentes, puedes usar el índice:

```tsx
import { 
  GradientHeader, 
  Card, 
  FAB, 
  Modal, 
  InfoCard,
  Button,
  Input,
  SearchBar
} from '../components/common';
```

O importar individualmente:

```tsx
import { GradientHeader } from '../components/common/GradientHeader';
import { Card } from '../components/common/Card';
```

## Mejores Prácticas

1. **Consistencia:** Usa estos componentes en lugar de crear nuevos elementos personalizados
2. **Personalización:** Usa las props `style` para ajustes específicos sin modificar el componente
3. **Theming:** Los componentes usan `colors` del theme, mantén la consistencia
4. **Accesibilidad:** Los componentes tienen activeOpacity y feedback táctil apropiado

## Futuras Mejoras

- [ ] Agregar tests unitarios para cada componente
- [ ] Documentar ejemplos más complejos
- [ ] Agregar más variantes de estilos
- [ ] Crear Storybook para visualización
