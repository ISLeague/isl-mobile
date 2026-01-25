import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { TipoCopa, TipoFase, Fase } from '../../../api/types';
import { useToast } from '../../../contexts/ToastContext';
import { safeAsync, getUserFriendlyMessage } from '../../../utils/errorHandling';
import api from '../../../api';

interface KnockoutEmbedProps {
  navigation: any;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  idEdicionCategoria?: number;
}

type CopaInfo = {
  tipo: TipoCopa;
  nombre: string;
  icono: string;
  gradiente: [string, string, string];
  descripcion: string;
};

const COPAS: CopaInfo[] = [
  {
    tipo: 'oro',
    nombre: 'Copa Oro',
    icono: 'trophy',
    gradiente: ['#FFD700', '#FFA500', '#FF8C00'],
    descripcion: 'Equipos clasificados en primeros lugares',
  },
  {
    tipo: 'plata',
    nombre: 'Copa Plata',
    icono: 'trophy-variant',
    gradiente: ['#C0C0C0', '#A8A8A8', '#909090'],
    descripcion: 'Equipos clasificados en lugares intermedios',
  },
  {
    tipo: 'bronce',
    nombre: 'Copa Bronce',
    icono: 'trophy-outline',
    gradiente: ['#CD7F32', '#B8733C', '#A86832'],
    descripcion: 'Equipos en fase de desarrollo',
  },
];

export const KnockoutEmbed: React.FC<KnockoutEmbedProps> = ({
  navigation,
  isAdmin = false,
  isSuperAdmin = false,
  idEdicionCategoria,
}) => {
  const { showError, showSuccess } = useToast();
  const [fasesKnockout, setFasesKnockout] = useState<Fase[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingFase, setCreatingFase] = useState<TipoCopa | null>(null);

  useEffect(() => {
    loadFases();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadFases();
    }, [])
  );

  const loadFases = async () => {
    console.log('🔄 [KnockoutEmbed] Cargando fases knockout...');
    setLoading(true);

    const result = await safeAsync(
      async () => {
        const fasesResponse = await api.fases.list(idEdicionCategoria || 1);
        const fases = fasesResponse.success && fasesResponse.data ? fasesResponse.data : [];
        const fasesKO = fases.filter((f: Fase) => f.tipo === 'knockout');
        console.log(`📂 [KnockoutEmbed] Fases knockout encontradas: ${fasesKO.length}`);
        fasesKO.forEach((f: Fase) => {
          console.log(`   - ${f.nombre} | Copa: ${f.copa} | ID: ${f.id_fase}`);
        });
        return fasesKO;
      },
      'loadFasesKnockout',
      {
        severity: 'medium',
        fallbackValue: [],
        onError: (error) => {
          console.error('❌ [KnockoutEmbed] Error al cargar fases:', error);
          showError(getUserFriendlyMessage(error), 'Error al cargar fases');
        },
      }
    );

    setFasesKnockout(result || []);
    setLoading(false);
  };

  const getFaseForCopa = (copa: TipoCopa): Fase | undefined => {
    return fasesKnockout.find((f) => f.copa === copa);
  };

  const handleCopaPress = async (copaInfo: CopaInfo) => {
    const faseExistente = getFaseForCopa(copaInfo.tipo);

    if (faseExistente) {
      // Ya existe la fase, navegar a la pantalla de rondas
      console.log(`✅ [KnockoutEmbed] Fase ${copaInfo.tipo} existe, navegando...`);
      navigation.navigate('KnockoutRondas', {
        fase: faseExistente,
        copa: copaInfo.tipo,
        idEdicionCategoria,
      });
    } else {
      // No existe, crear la fase automáticamente
      console.log(`🆕 [KnockoutEmbed] Creando fase para ${copaInfo.tipo}...`);
      setCreatingFase(copaInfo.tipo);

      const result = await safeAsync(
        async () => {
          const requestData = {
            nombre: `Fase Eliminatoria - ${copaInfo.nombre}`,
            tipo: 'knockout' as TipoFase,
            copa: copaInfo.tipo,
            orden: copaInfo.tipo === 'oro' ? 1 : copaInfo.tipo === 'plata' ? 2 : 3,
            id_edicion_categoria: idEdicionCategoria || 1,
            partidos_ida_vuelta: false,
            permite_empate: false,
            permite_penales: true,
          };

          console.log('📤 [KnockoutEmbed] Enviando request:', requestData);
          const response = await api.fases.create(requestData);
          console.log('📥 [KnockoutEmbed] Respuesta:', response);

          return response;
        },
        'createFaseKnockout',
        {
          severity: 'high',
          fallbackValue: null,
          onError: (error) => {
            console.error('❌ [KnockoutEmbed] Error al crear fase:', error);
            showError(getUserFriendlyMessage(error), 'Error al crear fase');
          },
        }
      );

      setCreatingFase(null);

      if (result && result.success && result.data) {
        showSuccess(`Fase ${copaInfo.nombre} creada exitosamente`);
        // Recargar fases y navegar
        await loadFases();
        navigation.navigate('KnockoutRondas', {
          fase: result.data,
          copa: copaInfo.tipo,
          idEdicionCategoria,
        });
      }
    }
  };

  const renderCopaCard = (copaInfo: CopaInfo) => {
    const faseExistente = getFaseForCopa(copaInfo.tipo);
    const isCreating = creatingFase === copaInfo.tipo;
    const rondasCount = faseExistente?.rondas_count || 0;

    return (
      <TouchableOpacity
        key={copaInfo.tipo}
        style={styles.copaCard}
        onPress={() => handleCopaPress(copaInfo)}
        activeOpacity={0.8}
        disabled={isCreating}
      >
        <LinearGradient
          colors={copaInfo.gradiente as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.copaCardGradient}
        >
          {isCreating ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.white} />
              <Text style={styles.loadingText}>Creando fase...</Text>
            </View>
          ) : (
            <>
              <View style={styles.copaIconContainer}>
                <MaterialCommunityIcons
                  name={copaInfo.icono as any}
                  size={48}
                  color={colors.white}
                />
              </View>

              <View style={styles.copaInfo}>
                <Text style={styles.copaNombre}>{copaInfo.nombre}</Text>
                <Text style={styles.copaDescripcion}>{copaInfo.descripcion}</Text>
              </View>

              <View style={styles.copaStatus}>
                {faseExistente ? (
                  <>
                    <View style={styles.statusBadge}>
                      <MaterialCommunityIcons name="check-circle" size={16} color={colors.white} />
                      <Text style={styles.statusText}>Configurada</Text>
                    </View>
                    {rondasCount > 0 && (
                      <Text style={styles.rondasCount}>
                        {rondasCount} {rondasCount === 1 ? 'ronda' : 'rondas'}
                      </Text>
                    )}
                  </>
                ) : (
                  <View style={[styles.statusBadge, styles.statusBadgePending]}>
                    <MaterialCommunityIcons name="plus-circle" size={16} color={colors.white} />
                    <Text style={styles.statusText}>Crear fase</Text>
                  </View>
                )}
              </View>

              <MaterialCommunityIcons
                name="chevron-right"
                size={28}
                color={colors.white}
                style={styles.chevron}
              />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingFullContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingFullText}>Cargando fases eliminatorias...</Text>
      </View>
    );
  }

  // Para fans: solo mostrar si hay al menos una fase configurada
  if (!isAdmin && !isSuperAdmin && fasesKnockout.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="trophy-outline" size={64} color={colors.textLight} />
        <Text style={styles.emptyTitle}>No hay eliminatorias disponibles</Text>
        <Text style={styles.emptyText}>
          Las fases eliminatorias aparecerán cuando se configuren las copas correspondientes.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header informativo */}
        <View style={styles.header}>
          <MaterialCommunityIcons name="tournament" size={24} color={colors.primary} />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Fases Eliminatorias</Text>
            <Text style={styles.headerSubtitle}>
              Selecciona una copa para gestionar sus rondas
            </Text>
          </View>
        </View>

        {/* Cards de las 3 copas */}
        <View style={styles.copasContainer}>
          {COPAS.map((copa) => renderCopaCard(copa))}
        </View>

        {/* Info adicional para admin */}
        {isSuperAdmin && (
          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="information" size={20} color={colors.info} />
            <Text style={styles.infoText}>
              Al seleccionar una copa, se creará automáticamente la fase si no existe.
              Luego podrás crear rondas de forma manual o automática.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  loadingFullContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingFullText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  copasContainer: {
    gap: 16,
  },
  copaCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  copaCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    minHeight: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '500',
  },
  copaIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  copaInfo: {
    flex: 1,
    marginLeft: 16,
  },
  copaNombre: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  copaDescripcion: {
    fontSize: 13,
    color: colors.white,
    opacity: 0.9,
    lineHeight: 18,
  },
  copaStatus: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgePending: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  rondasCount: {
    fontSize: 11,
    color: colors.white,
    opacity: 0.8,
  },
  chevron: {
    marginLeft: 8,
    opacity: 0.8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#E3F2FD',
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1976D2',
    lineHeight: 18,
  },
});

export default KnockoutEmbed;
