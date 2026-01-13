import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Button } from '../../components/common/Button';
import { useToast } from '../../contexts/ToastContext';
import api from '../../api';
import { JugadorAsistencia, EquipoAsistencia } from '../../api/types/asistencia.types';

interface PreMatchValidationScreenProps {
  navigation: any;
  route: any;
}

export const PreMatchValidationScreen: React.FC<PreMatchValidationScreenProps> = ({ navigation, route }) => {
  const { partido, ronda } = route.params;
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [equipoLocal, setEquipoLocal] = useState<EquipoAsistencia | null>(null);
  const [equipoVisitante, setEquipoVisitante] = useState<EquipoAsistencia | null>(null);
  const [tieneAsistenciaRegistrada, setTieneAsistenciaRegistrada] = useState(false);

  // Estado local para tracking de presentes
  const [presentesLocal, setPresentesLocal] = useState<Set<number>>(new Set());
  const [presentesVisitante, setPresentesVisitante] = useState<Set<number>>(new Set());
  
  // Restricciones de la categoría
  const [restricciones, setRestricciones] = useState<{
    tiene_restriccion_edad: boolean;
    edad_minima: number | null;
    edad_maxima: number | null;
    max_refuerzos: number | null;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, [partido.id_partido]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await api.asistencia.list(partido.id_partido);

      if (response.success && response.data) {
        setEquipoLocal(response.data.equipo_local);
        setEquipoVisitante(response.data.equipo_visitante);
        setTieneAsistenciaRegistrada(response.data.tiene_asistencia_registrada);
        setRestricciones(response.data.restricciones || null);

        // Inicializar sets de presentes si ya hay datos
        const presentesLocalSet = new Set<number>();
        const presentesVisitanteSet = new Set<number>();

        response.data.equipo_local.jugadores.forEach((j) => {
          if (j.presente === true) {
            presentesLocalSet.add(j.id_plantilla);
          }
        });

        response.data.equipo_visitante.jugadores.forEach((j) => {
          if (j.presente === true) {
            presentesVisitanteSet.add(j.id_plantilla);
          }
        });

        setPresentesLocal(presentesLocalSet);
        setPresentesVisitante(presentesVisitanteSet);
      } else {
        showError(response.error || 'Error al cargar datos');
      }
    } catch (error: any) {
      showError(error.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Calcular edad del jugador
  const calcularEdad = (fechaNacimiento: string | null): number | null => {
    if (!fechaNacimiento) return null;
    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  // Obtener año de nacimiento
  const obtenerAñoNacimiento = (fechaNacimiento: string | null): string | null => {
    if (!fechaNacimiento) return null;
    const nacimiento = new Date(fechaNacimiento);
    const dia = String(nacimiento.getDate()).padStart(2, '0');
    const mes = String(nacimiento.getMonth() + 1).padStart(2, '0');
    const año = nacimiento.getFullYear();
    return `${dia}/${mes}/${año}`;
  };

  const togglePresente = (jugador: JugadorAsistencia, isLocal: boolean) => {
    const id_plantilla = jugador.id_plantilla;
    const presentes = isLocal ? presentesLocal : presentesVisitante;
    const equipo = isLocal ? equipoLocal : equipoVisitante;
    
    // Si está marcado, simplemente desmarcamos
    if (presentes.has(id_plantilla)) {
      if (isLocal) {
        setPresentesLocal((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id_plantilla);
          return newSet;
        });
      } else {
        setPresentesVisitante((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id_plantilla);
          return newSet;
        });
      }
      return;
    }

    // Validaciones al marcar como presente
    const alertas: string[] = [];

    // 1. Validar restricción de edad
    if (restricciones?.tiene_restriccion_edad && jugador.fecha_nacimiento) {
      const edad = calcularEdad(jugador.fecha_nacimiento);
      if (edad !== null) {
        if (restricciones.edad_maxima !== null && edad > restricciones.edad_maxima) {
          alertas.push(`⚠️ El jugador tiene ${edad} años y supera la edad máxima permitida (${restricciones.edad_maxima} años)`);
        }
        if (restricciones.edad_minima !== null && edad < restricciones.edad_minima) {
          alertas.push(`⚠️ El jugador tiene ${edad} años y es menor a la edad mínima permitida (${restricciones.edad_minima} años)`);
        }
      }
    }

    // 2. Validar restricción de refuerzos
    if (restricciones && restricciones.max_refuerzos !== null && jugador.es_refuerzo) {
      // Contar cuántos refuerzos ya están marcados como presentes
      const refuerzosPresentesActuales = equipo?.jugadores.filter(
        (j) => j.es_refuerzo && presentes.has(j.id_plantilla)
      ).length || 0;

      if (refuerzosPresentesActuales >= restricciones.max_refuerzos) {
        alertas.push(`⚠️ Ya hay ${refuerzosPresentesActuales} refuerzos presentes. Máximo permitido: ${restricciones.max_refuerzos}`);
      }
    }

    // Si hay alertas, mostrar confirmación
    if (alertas.length > 0) {
      Alert.alert(
        'Atención - Restricciones',
        alertas.join('\n\n') + '\n\n¿Deseas marcar al jugador como presente de todas formas?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Marcar presente',
            onPress: () => marcarPresente(id_plantilla, isLocal),
          },
        ]
      );
    } else {
      marcarPresente(id_plantilla, isLocal);
    }
  };

  const marcarPresente = (id_plantilla: number, isLocal: boolean) => {
    if (isLocal) {
      setPresentesLocal((prev) => new Set(prev).add(id_plantilla));
    } else {
      setPresentesVisitante((prev) => new Set(prev).add(id_plantilla));
    }
  };

  const selectAll = (isLocal: boolean) => {
    if (isLocal && equipoLocal) {
      setPresentesLocal(new Set(equipoLocal.jugadores.map((j) => j.id_plantilla)));
    } else if (!isLocal && equipoVisitante) {
      setPresentesVisitante(new Set(equipoVisitante.jugadores.map((j) => j.id_plantilla)));
    }
  };

  const deselectAll = (isLocal: boolean) => {
    if (isLocal) {
      setPresentesLocal(new Set());
    } else {
      setPresentesVisitante(new Set());
    }
  };

  const handleSave = async () => {
    if (!equipoLocal || !equipoVisitante) return;

    // Validar que al menos hay algunos jugadores presentes en cada equipo
    if (presentesLocal.size === 0) {
      Alert.alert('Error', 'Debe haber al menos un jugador presente del equipo local');
      return;
    }

    if (presentesVisitante.size === 0) {
      Alert.alert('Error', 'Debe haber al menos un jugador presente del equipo visitante');
      return;
    }

    // Mostrar alerta de confirmación
    Alert.alert(
      'Confirmar lista',
      `¿Guardar lista de asistencia?\n\n${equipoLocal.nombre}: ${presentesLocal.size} jugadores\n${equipoVisitante.nombre}: ${presentesVisitante.size} jugadores`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Guardar', onPress: () => confirmSave() },
      ]
    );
  };

  const confirmSave = async () => {
    if (!equipoLocal || !equipoVisitante) return;

    setSaving(true);

    try {
      // Preparar datos de asistencia
      const asistencias: { id_plantilla: number; id_equipo: number; presente: boolean }[] = [];

      // Equipo local
      equipoLocal.jugadores.forEach((j) => {
        asistencias.push({
          id_plantilla: j.id_plantilla,
          id_equipo: equipoLocal.id_equipo,
          presente: presentesLocal.has(j.id_plantilla),
        });
      });

      // Equipo visitante
      equipoVisitante.jugadores.forEach((j) => {
        asistencias.push({
          id_plantilla: j.id_plantilla,
          id_equipo: equipoVisitante.id_equipo,
          presente: presentesVisitante.has(j.id_plantilla),
        });
      });

      const response = await api.asistencia.registrar({
        id_partido: partido.id_partido,
        asistencias,
      });

      if (response.success) {
        showSuccess(`Lista guardada: ${response.data?.presentes || 0} jugadores presentes`);
        setTieneAsistenciaRegistrada(true);
      } else {
        showError(response.error || 'Error al guardar la lista');
      }
    } catch (error: any) {
      showError(error.message || 'Error al guardar la lista');
    } finally {
      setSaving(false);
    }
  };

  const handleGoToSubstitutions = () => {
    if (!tieneAsistenciaRegistrada && presentesLocal.size === 0 && presentesVisitante.size === 0) {
      Alert.alert(
        'Lista no guardada',
        'Debes guardar la lista de presentes antes de registrar cambios.',
        [{ text: 'OK' }]
      );
      return;
    }

    navigation.navigate('MatchSubstitutions', {
      partido,
      ronda,
      equipoLocal,
      equipoVisitante,
    });
  };

  const handleGoToResults = () => {
    if (!tieneAsistenciaRegistrada && presentesLocal.size === 0 && presentesVisitante.size === 0) {
      Alert.alert(
        'Lista no guardada',
        '¿Deseas ir a cargar resultados sin guardar la lista de presentes?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Continuar',
            onPress: () => navigation.navigate('ResultPage', { partido, ronda }),
          },
        ]
      );
      return;
    }

    navigation.navigate('ResultPage', { partido, ronda });
  };

  const renderJugador = (jugador: JugadorAsistencia, isLocal: boolean) => {
    const isPresente = isLocal
      ? presentesLocal.has(jugador.id_plantilla)
      : presentesVisitante.has(jugador.id_plantilla);

    const edad = calcularEdad(jugador.fecha_nacimiento);

    // Verificar si hay alertas de restricciones
    const tieneAlertaEdad = restricciones?.tiene_restriccion_edad && edad !== null && (
      (restricciones.edad_maxima !== null && edad > restricciones.edad_maxima) ||
      (restricciones.edad_minima !== null && edad < restricciones.edad_minima)
    );

    return (
      <TouchableOpacity
        key={jugador.id_plantilla}
        style={[styles.jugadorCard, isPresente && styles.jugadorCardPresente]}
        onPress={() => togglePresente(jugador, isLocal)}
        activeOpacity={0.7}
      >
        <View style={styles.jugadorInfo}>
          <View style={styles.numeroBadge}>
            <Text style={styles.numeroText}>
              {jugador.numero_camiseta != null ? jugador.numero_camiseta : 'X'}
            </Text>
          </View>
          <View style={styles.jugadorNombreContainer}>
            <Text style={styles.jugadorNombre} numberOfLines={1}>
              {jugador.nombre_completo}
            </Text>
            <View style={styles.jugadorSubInfo}>
              {jugador.dni && (
                <Text style={styles.jugadorDni}>DNI: {jugador.dni}</Text>
              )}
              {jugador.fecha_nacimiento && (
                <Text style={[styles.jugadorEdad, tieneAlertaEdad && styles.jugadorEdadAlerta]}>
                  Nac: {obtenerAñoNacimiento(jugador.fecha_nacimiento)} {tieneAlertaEdad ? '⚠️' : ''}
                </Text>
              )}
            </View>
            <View style={styles.badges}>
              {jugador.es_capitan && (
                <View style={styles.capitanBadge}>
                  <Text style={styles.capitanText}>C</Text>
                </View>
              )}
              {jugador.es_refuerzo && (
                <View style={styles.refuerzoBadge}>
                  <Text style={styles.refuerzoText}>R</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={[styles.checkbox, isPresente && styles.checkboxChecked]}>
          {isPresente && (
            <MaterialCommunityIcons name="check" size={18} color={colors.white} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEquipo = (equipo: EquipoAsistencia | null, isLocal: boolean) => {
    if (!equipo) return null;

    const presentes = isLocal ? presentesLocal.size : presentesVisitante.size;

    return (
      <View style={styles.equipoSection}>
        <View style={styles.equipoHeader}>
          <Text style={styles.equipoNombre}>{equipo.nombre}</Text>
          <View style={styles.contadorContainer}>
            <Text style={styles.contadorText}>
              {presentes}/{equipo.total}
            </Text>
            <Text style={styles.contadorLabel}>presentes</Text>
          </View>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => selectAll(isLocal)}
          >
            <MaterialCommunityIcons name="check-all" size={16} color={colors.primary} />
            <Text style={styles.quickButtonText}>Todos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => deselectAll(isLocal)}
          >
            <MaterialCommunityIcons name="close" size={16} color={colors.error} />
            <Text style={styles.quickButtonText}>Ninguno</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.jugadoresList}>
          {equipo.jugadores.map((j) => renderJugador(j, isLocal))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando jugadores...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Validación Pre-Partido</Text>
          <Text style={styles.headerSubtitle}>Registrar jugadores presentes</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Partido Info */}
      <View style={styles.partidoInfo}>
        <Text style={styles.equipoVs}>
          {equipoLocal?.nombre || 'Local'} vs {equipoVisitante?.nombre || 'Visitante'}
        </Text>
        {tieneAsistenciaRegistrada && (
          <View style={styles.registradoBadge}>
            <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
            <Text style={styles.registradoText}>Lista registrada</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {renderEquipo(equipoLocal, true)}
        <View style={styles.separator} />
        {renderEquipo(equipoVisitante, false)}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <Button
          title={saving ? 'Guardando...' : 'Guardar Lista'}
          onPress={handleSave}
          disabled={saving}
          style={styles.saveButton}
        />

        <View style={styles.navigationButtons}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={handleGoToSubstitutions}
          >
            <MaterialCommunityIcons name="swap-horizontal" size={20} color={colors.primary} />
            <Text style={styles.navButtonText}>Cambios</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, styles.navButtonPrimary]}
            onPress={handleGoToResults}
          >
            <MaterialCommunityIcons name="scoreboard" size={20} color={colors.white} />
            <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>Cargar Resultado</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textLight,
  },
  partidoInfo: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  equipoVs: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  registradoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: colors.success + '20',
    borderRadius: 12,
  },
  registradoText: {
    marginLeft: 4,
    fontSize: 12,
    color: colors.success,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  equipoSection: {
    padding: 16,
  },
  equipoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  equipoNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  contadorContainer: {
    alignItems: 'flex-end',
  },
  contadorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  contadorLabel: {
    fontSize: 11,
    color: colors.textLight,
  },
  quickActions: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  quickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickButtonText: {
    marginLeft: 4,
    fontSize: 12,
    color: colors.textPrimary,
  },
  jugadoresList: {
    gap: 8,
  },
  jugadorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  jugadorCardPresente: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
  },
  jugadorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  numeroBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  numeroText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  jugadorNombreContainer: {
    flex: 1,
  },
  jugadorNombre: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  jugadorSubInfo: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  jugadorDni: {
    fontSize: 11,
    color: colors.textLight,
  },
  jugadorEdad: {
    fontSize: 11,
    color: colors.textLight,
  },
  jugadorEdadAlerta: {
    color: colors.warning,
    fontWeight: 'bold',
  },
  badges: {
    flexDirection: 'row',
    marginTop: 2,
    gap: 4,
  },
  capitanBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  capitanText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.white,
  },
  refuerzoBadge: {
    backgroundColor: colors.info,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  refuerzoText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.white,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  separator: {
    height: 8,
    backgroundColor: colors.background,
  },
  bottomSpacing: {
    height: 100,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  saveButton: {
    marginBottom: 12,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  navButtonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  navButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  navButtonTextPrimary: {
    color: colors.white,
  },
});

export default PreMatchValidationScreen;
