import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import {
  Eliminatoria,
  Partido,
  Equipo,
  TipoCopa,
  RondaEliminatoria
} from '../../../api/types';
import { FAB, SearchBar } from '../../../components/common';
import { useToast } from '../../../contexts/ToastContext';
import { safeAsync, getUserFriendlyMessage } from '../../../utils/errorHandling';
import api from '../../../api';

interface KnockoutEmbedProps {
  navigation: any;
  isAdmin?: boolean;
  idEdicionCategoria?: number;
}

const getSubtipoGradient = (copa: TipoCopa) => {
  switch (copa) {
    case 'oro':
      return ['#FFD700', '#FFA500', '#FF8C00'];
    case 'plata':
      return ['#C0C0C0', '#A8A8A8', '#909090'];
    case 'bronce':
      return ['#CD7F32', '#B8733C', '#A86832'];
    default:
      return [colors.primary, colors.primary, colors.primary];
  }
};

export const KnockoutEmbed: React.FC<KnockoutEmbedProps> = ({
  navigation,
  isAdmin = false,
  idEdicionCategoria,
}) => {
  const { showError } = useToast();
  const [llaves, setLlaves] = useState<Eliminatoria[]>([]);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [expandedRondas, setExpandedRondas] = useState<{ [key: string]: boolean }>({});
  const [selectedCopa, setSelectedCopa] = useState<TipoCopa>('oro');
  const [knockoutActivo, setKnockoutActivo] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [fasesKnockout, setFasesKnockout] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [selectedCopa]);

  const loadData = async () => {
    setLoading(true);
    const result = await safeAsync(
      async () => {
        // Cargar fases knockout de esta edición categoría
        const fasesResponse = await api.fases.list(idEdicionCategoria || 1);
        const fases = fasesResponse.success && fasesResponse.data ? fasesResponse.data : [];
        const fasesKO = fases.filter((f: any) => f.tipo === 'knockout');

        // Buscar fase de la copa seleccionada
        const faseActual = fasesKO.find((f: any) => f.copa === selectedCopa);

        if (!faseActual) {
          return { llaves: [], partidos: [], equipos: [], fases: fasesKO };
        }

        // Cargar llaves de esta fase
        const llavesResponse = await api.eliminatorias.list({ id_fase: faseActual.id_fase });
        const llavesData = llavesResponse.success && llavesResponse.data?.todas_las_llaves
          ? llavesResponse.data.todas_las_llaves
          : [];

        // Cargar partidos de esta edición categoría
        const partidosResponse = await api.partidos.list({ id_edicion_categoria: idEdicionCategoria });
        const allPartidos = partidosResponse.success && partidosResponse.data ? partidosResponse.data : [];

        // Cargar equipos
        const equiposResponse = await api.equipos.list(idEdicionCategoria || 1);
        const allEquipos = equiposResponse.success && equiposResponse.data ? equiposResponse.data : [];

        return { llaves: llavesData, partidos: allPartidos, equipos: allEquipos, fases: fasesKO };
      },
      'loadKnockoutData',
      {
        severity: 'high',
        fallbackValue: { llaves: [], partidos: [], equipos: [], fases: [] },
        onError: (error) => {
          showError(getUserFriendlyMessage(error), 'Error al cargar eliminatorias');
        }
      }
    );

    if (result) {
      setLlaves(result.llaves);
      setPartidos(result.partidos);
      setEquipos(result.equipos);
      setFasesKnockout(result.fases);
    }
    setLoading(false);
  };

  const toggleRonda = (ronda: RondaEliminatoria) => {
    setExpandedRondas(prev => ({
      ...prev,
      [ronda]: !prev[ronda],
    }));
  };

  const getLlavesByRonda = (ronda: RondaEliminatoria): Eliminatoria[] => {
    return llaves.filter(l => l.ronda === ronda);
  };

  const getPartidoByLlave = (llave: Eliminatoria): Partido | null => {
    // Buscar partido que corresponda a esta llave
    // Asumimos que el partido tiene alguna referencia a la llave (puede ser por equipos o metadata)
    return partidos.find(p =>
      p.id_equipo_local === llave.id_equipo_a && p.id_equipo_visitante === llave.id_equipo_b
    ) || null;
  };

  const handleEditPartido = (partido: Partido) => {
    navigation.navigate('EditPartido', {
      partido,
      idEdicionCategoria
    });
  };

  const handleLoadResult = (partido: Partido) => {
    navigation.navigate('LoadResults', { partido });
  };

  const handleCreateLlave = (ronda: RondaEliminatoria) => {
    // Navegar a pantalla de crear llave
    const faseActual = fasesKnockout.find(f => f.copa === selectedCopa);
    if (!faseActual) {
      showError('Primero debes crear una fase de knockout para esta copa');
      return;
    }

    navigation.navigate('CreateLlave', {
      idFase: faseActual.id_fase,
      ronda,
      copa: selectedCopa,
      idEdicionCategoria,
    });
  };

  const handleCreatePartidoForLlave = (llave: Eliminatoria) => {
    // Navegar a crear partido para esta llave
    const faseActual = fasesKnockout.find(f => f.copa === selectedCopa);
    navigation.navigate('CreatePartido', {
      idFase: faseActual?.id_fase,
      idEdicionCategoria,
      llave, // Pasar la llave para prellenar equipos
    });
  };

  // Verificar si hay llaves para cada copa
  const hasLlavesInCopa = (copa: TipoCopa) => {
    const fase = fasesKnockout.find(f => f.copa === copa);
    if (!fase) return false;
    return llaves.length > 0; // Si hay fase, verificar si tiene llaves
  };

  // Filtrar copas disponibles
  const availableCopas: TipoCopa[] = isAdmin
    ? ['oro', 'plata', 'bronce']
    : (['oro', 'plata', 'bronce'].filter(c =>
        hasLlavesInCopa(c as TipoCopa)
      ) as TipoCopa[]);

  // Si no hay ninguna copa con llaves para fans, mostrar mensaje vacío
  if (availableCopas.length === 0 && !isAdmin) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="trophy-outline" size={64} color={colors.textLight} />
        <Text style={styles.emptyTitle}>No hay eliminatorias disponibles</Text>
        <Text style={styles.emptyText}>
          Las fases eliminatorias aparecerán cuando se creen las llaves correspondientes.
        </Text>
      </View>
    );
  }

  const renderLlave = (llave: Eliminatoria) => {
    const equipoA = equipos.find(e => e.id_equipo === llave.id_equipo_a);
    const equipoB = equipos.find(e => e.id_equipo === llave.id_equipo_b);
    const equipoGanador = equipos.find(e => e.id_equipo === llave.id_equipo_ganador);
    const partido = getPartidoByLlave(llave);

    return (
      <View key={llave.id_eliminatoria} style={styles.llaveCard}>
        <View style={styles.llaveHeader}>
          <Text style={styles.llaveNumero}>Llave {llave.numero_llave}</Text>
          <View style={[
            styles.estadoBadge,
            llave.estado === 'finalizado' && styles.estadoBadgeFinalizado,
            llave.estado === 'en_curso' && styles.estadoBadgeEnCurso,
          ]}>
            <Text style={[
              styles.estadoText,
              llave.estado === 'finalizado' && styles.estadoTextFinalizado,
              llave.estado === 'en_curso' && styles.estadoTextEnCurso,
            ]}>
              {llave.estado}
            </Text>
          </View>
        </View>

        <View style={styles.equiposContainer}>
          {/* Equipo A */}
          <View style={styles.equipoRow}>
            {equipoA ? (
              <>
                <Image
                  source={equipoA.logo ? { uri: equipoA.logo } : require('../../../assets/InterLOGO.png')}
                  style={styles.equipoLogo}
                />
                <Text style={[
                  styles.equipoNombre,
                  llave.id_equipo_ganador === equipoA.id_equipo && styles.equipoNombreGanador
                ]} numberOfLines={1}>
                  {equipoA.nombre}
                </Text>
              </>
            ) : (
              <>
                <View style={styles.equipoPorDefinir}>
                  <MaterialCommunityIcons name="help-circle" size={20} color={colors.textLight} />
                </View>
                <Text style={styles.equipoPorDefinirText}>
                  {llave.origen_a || 'Por definir'}
                </Text>
              </>
            )}
            {llave.id_equipo_ganador === llave.id_equipo_a && (
              <MaterialCommunityIcons name="trophy" size={16} color={colors.warning} />
            )}
          </View>

          <Text style={styles.vsText}>vs</Text>

          {/* Equipo B */}
          <View style={styles.equipoRow}>
            {equipoB ? (
              <>
                <Image
                  source={equipoB.logo ? { uri: equipoB.logo } : require('../../../assets/InterLOGO.png')}
                  style={styles.equipoLogo}
                />
                <Text style={[
                  styles.equipoNombre,
                  llave.id_equipo_ganador === equipoB.id_equipo && styles.equipoNombreGanador
                ]} numberOfLines={1}>
                  {equipoB.nombre}
                </Text>
              </>
            ) : (
              <>
                <View style={styles.equipoPorDefinir}>
                  <MaterialCommunityIcons name="help-circle" size={20} color={colors.textLight} />
                </View>
                <Text style={styles.equipoPorDefinirText}>
                  {llave.origen_b || 'Por definir'}
                </Text>
              </>
            )}
            {llave.id_equipo_ganador === llave.id_equipo_b && (
              <MaterialCommunityIcons name="trophy" size={16} color={colors.warning} />
            )}
          </View>
        </View>

        {equipoGanador && (
          <View style={styles.ganadorContainer}>
            <MaterialCommunityIcons name="trophy" size={16} color={colors.success} />
            <Text style={styles.ganadorText}>
              Ganador: {equipoGanador.nombre}
            </Text>
          </View>
        )}

        {/* Botones de acción para admin */}
        {isAdmin && (
          <View style={styles.llaveActions}>
            {partido ? (
              <>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEditPartido(partido)}
                >
                  <MaterialCommunityIcons name="pencil" size={16} color={colors.primary} />
                  <Text style={styles.actionButtonText}>Editar Partido</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleLoadResult(partido)}
                >
                  <MaterialCommunityIcons name="scoreboard" size={16} color={colors.success} />
                  <Text style={styles.actionButtonText}>Cargar Resultado</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleCreatePartidoForLlave(llave)}
              >
                <MaterialCommunityIcons name="plus-circle" size={16} color={colors.success} />
                <Text style={styles.actionButtonText}>Crear Partido</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderRonda = (ronda: RondaEliminatoria, titulo: string) => {
    const llavesRonda = getLlavesByRonda(ronda);
    const isExpanded = expandedRondas[ronda];
    const gradientColors = getSubtipoGradient(selectedCopa) as [string, string, ...string[]];

    return (
      <View key={ronda} style={styles.rondaContainer}>
        <TouchableOpacity
          style={styles.rondaHeader}
          onPress={() => toggleRonda(ronda)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.rondaHeaderGradient}
          >
            <View style={styles.rondaInfo}>
              <Text style={styles.rondaNombre}>{titulo}</Text>
            </View>
            <View style={styles.rondaStatsActions}>
              <View style={styles.rondaStats}>
                <Text style={styles.llavesCount}>{llavesRonda.length}</Text>
                <Text style={styles.llavesLabel}>llaves</Text>
              </View>
              <MaterialCommunityIcons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={24}
                color={colors.white}
              />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {isExpanded && (
          <>
            {isAdmin && (
              <View style={styles.rondaActions}>
                <TouchableOpacity
                  style={styles.rondaActionButton}
                  onPress={() => handleCreateLlave(ronda)}
                >
                  <MaterialCommunityIcons name="plus-circle" size={16} color={colors.success} />
                  <Text style={styles.rondaActionText}>Crear Llave</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.llavesList}>
              {llavesRonda.length === 0 ? (
                <Text style={styles.emptyText}>No hay llaves en esta ronda</Text>
              ) : (
                llavesRonda.map((llave) => renderLlave(llave))
              )}
            </View>
          </>
        )}
      </View>
    );
  };

  const rondasConfig: { ronda: RondaEliminatoria; titulo: string }[] = [
    { ronda: 'final', titulo: 'Final' },
    { ronda: 'semifinal', titulo: 'Semifinales' },
    { ronda: 'cuartos', titulo: 'Cuartos de Final' },
    { ronda: 'octavos', titulo: 'Octavos de Final' },
  ];

  return (
    <View style={styles.container}>
      {/* Switch para activar/desactivar Knockout (solo admin) */}
      {isAdmin && (
        <View style={styles.switchContainer}>
          <View style={styles.switchInfo}>
            <MaterialCommunityIcons
              name={knockoutActivo ? "trophy" : "trophy-outline"}
              size={24}
              color={knockoutActivo ? colors.primary : colors.textSecondary}
            />
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchTitle}>
                {knockoutActivo ? 'Knockout Activo' : 'Knockout Inactivo'}
              </Text>
              <Text style={styles.switchSubtitle}>
                {knockoutActivo
                  ? 'Los fans pueden ver el knockout'
                  : 'El knockout está oculto para los fans'}
              </Text>
            </View>
          </View>
          <Switch
            value={knockoutActivo}
            onValueChange={setKnockoutActivo}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>
      )}

      {/* Mostrar contenido solo si el knockout está activo o si es admin */}
      {(knockoutActivo || isAdmin) ? (
        <>
          {/* Selector de Copa */}
          {availableCopas.length > 1 && (
            <View style={styles.copaSelector}>
              {availableCopas.map(copa => {
                const isSelected = selectedCopa === copa;
                const gradientColors = getSubtipoGradient(copa);

                return (
                  <TouchableOpacity
                    key={copa}
                    style={styles.copaButtonWrapper}
                    onPress={() => setSelectedCopa(copa)}
                    activeOpacity={0.8}
                  >
                    {isSelected ? (
                      <LinearGradient
                        colors={gradientColors as [string, string, ...string[]]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.copaButtonGradient}
                      >
                        <Text style={styles.copaTextSelected}>
                          {copa.toUpperCase()}
                        </Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.copaButton}>
                        <Text style={styles.copaText}>
                          {copa.toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Barra de búsqueda */}
          <View style={styles.searchSection}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar equipo en eliminatorias..."
              onClear={() => setSearchQuery('')}
            />
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {rondasConfig.map(({ ronda, titulo }) => renderRonda(ronda, titulo))}
          </ScrollView>

          {/* FAB para crear fase si no existe (solo admin) */}
          {isAdmin && !fasesKnockout.find(f => f.copa === selectedCopa) && (
            <FAB
              onPress={() => {
                navigation.navigate('CreateFase', {
                  idEdicionCategoria,
                  tipo: 'knockout',
                  copa: selectedCopa,
                });
              }}
              icon="add-circle"
              color={getSubtipoGradient(selectedCopa)[0]}
            />
          )}
        </>
      ) : (
        <View style={styles.inactiveContainer}>
          <MaterialCommunityIcons name="trophy-outline" size={64} color={colors.textLight} />
          <Text style={styles.inactiveTitle}>Knockout no disponible</Text>
          <Text style={styles.inactiveText}>
            La fase de knockout aún no está activa. Regresa más tarde para ver los partidos eliminatorios.
          </Text>
        </View>
      )}
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
  searchSection: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: colors.backgroundGray,
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
    padding: 20,
  },
  copaSelector: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginBottom: 16,
  },
  copaButtonWrapper: {
    flex: 1,
  },
  copaButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: colors.backgroundGray,
  },
  copaButtonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  copaText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  copaTextSelected: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  switchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  switchTextContainer: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  switchSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  rondaContainer: {
    marginBottom: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rondaHeader: {
    overflow: 'hidden',
  },
  rondaHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 60,
  },
  rondaInfo: {
    flex: 1,
  },
  rondaNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  rondaStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rondaStatsActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  llavesCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  llavesLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.white,
    opacity: 0.9,
  },
  rondaActions: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: colors.backgroundGray,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  rondaActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  rondaActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  llavesList: {
    padding: 12,
    gap: 12,
  },
  llaveCard: {
    backgroundColor: colors.backgroundGray,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  llaveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  llaveNumero: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.borderLight,
  },
  estadoBadgeFinalizado: {
    backgroundColor: '#e8f5e9',
  },
  estadoBadgeEnCurso: {
    backgroundColor: '#fff3e0',
  },
  estadoText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  estadoTextFinalizado: {
    color: colors.success,
  },
  estadoTextEnCurso: {
    color: colors.warning,
  },
  equiposContainer: {
    gap: 8,
  },
  equipoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  equipoLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  equipoPorDefinir: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  equipoNombre: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  equipoNombreGanador: {
    fontWeight: 'bold',
    color: colors.success,
  },
  equipoPorDefinirText: {
    flex: 1,
    fontSize: 13,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  vsText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: 4,
  },
  ganadorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ganadorText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
  },
  llaveActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  inactiveContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  inactiveTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  inactiveText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default KnockoutEmbed;
