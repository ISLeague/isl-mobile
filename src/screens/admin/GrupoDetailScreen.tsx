import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common';
import { Clasificacion, Equipo, Grupo } from '../../api/types';

interface GrupoDetailScreenProps {
  route: any;
  navigation: any;
}

// Helper para determinar el color de clasificación
const getClasificacionColor = (posicion: number, grupo: Grupo) => {
  const equiposOro = grupo.equipos_pasan_oro || 0;
  const equiposPlata = grupo.equipos_pasan_plata || 0;
  const equiposBronce = grupo.equipos_pasan_bronce || 0;

  if (posicion <= equiposOro) return '#FFD700'; // Oro
  if (posicion <= equiposOro + equiposPlata) return '#C0C0C0'; // Plata
  if (posicion <= equiposOro + equiposPlata + equiposBronce) return '#CD7F32'; // Bronce
  return '#F5F5F5'; // No clasifica
};

export const GrupoDetailScreen: React.FC<GrupoDetailScreenProps> = ({ route, navigation }) => {
  const { grupo, clasificaciones: clasificacionesParam, nombreGrupo } = route.params;
  const [clasificaciones, setClasificaciones] = useState<(Clasificacion & { equipo: Equipo })[]>(clasificacionesParam || []);

  useEffect(() => {
    navigation.setOptions({
      title: nombreGrupo || 'Detalle del Grupo',
    });
  }, [nombreGrupo, navigation]);

  useEffect(() => {
    // Actualizar clasificaciones si cambian los parámetros
    if (clasificacionesParam) {
      setClasificaciones(clasificacionesParam);
    }
  }, [clasificacionesParam]);

  const handleTeamPress = (idEquipo: number) => {
    navigation.navigate('TeamDetail', { idEquipo });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Nombre del Grupo */}
      <View style={styles.grupoHeader}>
        <Text style={styles.grupoNombre}>Grupo {nombreGrupo}</Text>
      </View>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Tabla de Posiciones</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View>
            {/* Header de la tabla */}
            <View style={styles.tableHeader}>
              <View style={styles.posCol}>
                <Text style={styles.headerText}>#</Text>
              </View>
              <View style={styles.equipoColFixed}>
                <Text style={styles.headerText}>Equipo</Text>
              </View>
              <View style={styles.statColSmall}>
                <Text style={styles.headerText}>PJ</Text>
              </View>
              <View style={styles.statColSmall}>
                <Text style={styles.headerText}>PG</Text>
              </View>
              <View style={styles.statColSmall}>
                <Text style={styles.headerText}>PE</Text>
              </View>
              <View style={styles.statColSmall}>
                <Text style={styles.headerText}>PP</Text>
              </View>
              <View style={styles.statColSmall}>
                <Text style={styles.headerText}>GF</Text>
              </View>
              <View style={styles.statColSmall}>
                <Text style={styles.headerText}>GC</Text>
              </View>
              <View style={styles.statColSmall}>
                <Text style={styles.headerText}>DIF</Text>
              </View>
              <View style={styles.statColSmall}>
                <Text style={styles.headerText}>PTS</Text>
              </View>
            </View>

            {/* Filas de equipos */}
            {clasificaciones.map((clasificacion) => {
              const posicion = clasificacion.posicion ?? 0;
              const clasificacionColor = grupo ? getClasificacionColor(posicion, grupo) : '#F5F5F5';

              return (
                <TouchableOpacity
                  key={`tabla-${clasificacion.id_equipo}`}
                  style={styles.tableRow}
                  onPress={() => handleTeamPress(clasificacion.id_equipo)}
                  activeOpacity={0.7}
                >
                  {/* Indicador de clasificación */}
                  <View style={styles.posCol}>
                    <View
                      style={[
                        styles.positionIndicator,
                        { backgroundColor: clasificacionColor },
                      ]}
                    >
                      <Text style={styles.positionText}>{posicion}</Text>
                    </View>
                  </View>

                  {/* Logo y nombre del equipo */}
                  <View style={styles.equipoColFixed}>
                    <Image
                      source={
                        clasificacion.equipo.logo
                          ? { uri: clasificacion.equipo.logo }
                          : require('../../assets/InterLOGO.png')
                      }
                      style={styles.equipoLogo}
                      resizeMode="cover"
                    />
                    <Text style={styles.equipoNombre} numberOfLines={1}>
                      {clasificacion.equipo.nombre}
                    </Text>
                  </View>

                  {/* Estadísticas */}
                  <View style={styles.statColSmall}>
                    <Text style={styles.statText}>{clasificacion.pj}</Text>
                  </View>
                  <View style={styles.statColSmall}>
                    <Text style={styles.statText}>{clasificacion.pg}</Text>
                  </View>
                  <View style={styles.statColSmall}>
                    <Text style={styles.statText}>{clasificacion.pe}</Text>
                  </View>
                  <View style={styles.statColSmall}>
                    <Text style={styles.statText}>{clasificacion.pp}</Text>
                  </View>
                  <View style={styles.statColSmall}>
                    <Text style={styles.statText}>{clasificacion.gf}</Text>
                  </View>
                  <View style={styles.statColSmall}>
                    <Text style={styles.statText}>{clasificacion.gc}</Text>
                  </View>
                  <View style={styles.statColSmall}>
                    <Text style={[styles.statText, clasificacion.dif > 0 && styles.statPositive]}>
                      {clasificacion.dif > 0 ? `+${clasificacion.dif}` : clasificacion.dif}
                    </Text>
                  </View>
                  <View style={styles.statColSmall}>
                    <Text style={[styles.statText, styles.statBold]}>{clasificacion.puntos}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </Card>

      {/* Tarjetas - Sección adicional */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Tarjetas</Text>

        <View style={styles.tableHeader}>
          <View style={styles.equipoColWide}>
            <Text style={styles.headerText}>Equipo</Text>
          </View>
          <View style={styles.statCol}>
            <MaterialCommunityIcons name="card" size={16} color="#FFD700" />
          </View>
          <View style={styles.statCol}>
            <MaterialCommunityIcons name="card" size={16} color="#FF4444" />
          </View>
        </View>

        {clasificaciones.map((clasificacion) => (
          <View key={`cards-${clasificacion.id_equipo}`} style={styles.tableRow}>
            <View style={styles.equipoColWide}>
              <Image
                source={
                  clasificacion.equipo.logo
                    ? { uri: clasificacion.equipo.logo }
                    : require('../../assets/InterLOGO.png')
                }
                style={styles.equipoLogoSmall}
                resizeMode="cover"
              />
              <Text style={styles.equipoNombre} numberOfLines={1}>
                {clasificacion.equipo.nombre_corto || clasificacion.equipo.nombre}
              </Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statText}>{clasificacion.tarjetas_amarillas || 0}</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statText}>{clasificacion.tarjetas_rojas || 0}</Text>
            </View>
          </View>
        ))}
      </Card>

      {/* Leyenda de clasificación */}
      {grupo && (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Leyenda</Text>

          {(grupo.equipos_pasan_oro || 0) > 0 && (
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FFD700' }]} />
              <Text style={styles.legendText}>
                Clasifican a Copa de Oro ({grupo.equipos_pasan_oro} equipos)
              </Text>
            </View>
          )}

          {(grupo.equipos_pasan_plata || 0) > 0 && (
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#C0C0C0' }]} />
              <Text style={styles.legendText}>
                Clasifican a Copa de Plata ({grupo.equipos_pasan_plata} equipos)
              </Text>
            </View>
          )}

          {(grupo.equipos_pasan_bronce || 0) > 0 && (
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#CD7F32' }]} />
              <Text style={styles.legendText}>
                Clasifican a Copa de Bronce ({grupo.equipos_pasan_bronce} equipos)
              </Text>
            </View>
          )}

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: colors.border }]} />
            <Text style={styles.legendText}>No clasifican</Text>
          </View>
        </Card>
      )}

      {/* Abreviaturas */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Abreviaturas</Text>
        <View style={styles.abreviaturasGrid}>
          <View style={styles.abreviaturaItem}>
            <Text style={styles.abreviaturaLabel}>PJ:</Text>
            <Text style={styles.abreviaturaText}>Partidos Jugados</Text>
          </View>
          <View style={styles.abreviaturaItem}>
            <Text style={styles.abreviaturaLabel}>PG:</Text>
            <Text style={styles.abreviaturaText}>Partidos Ganados</Text>
          </View>
          <View style={styles.abreviaturaItem}>
            <Text style={styles.abreviaturaLabel}>PE:</Text>
            <Text style={styles.abreviaturaText}>Partidos Empatados</Text>
          </View>
          <View style={styles.abreviaturaItem}>
            <Text style={styles.abreviaturaLabel}>PP:</Text>
            <Text style={styles.abreviaturaText}>Partidos Perdidos</Text>
          </View>
          <View style={styles.abreviaturaItem}>
            <Text style={styles.abreviaturaLabel}>GF:</Text>
            <Text style={styles.abreviaturaText}>Goles a Favor</Text>
          </View>
          <View style={styles.abreviaturaItem}>
            <Text style={styles.abreviaturaLabel}>GC:</Text>
            <Text style={styles.abreviaturaText}>Goles en Contra</Text>
          </View>
          <View style={styles.abreviaturaItem}>
            <Text style={styles.abreviaturaLabel}>DIF:</Text>
            <Text style={styles.abreviaturaText}>Diferencia de Goles</Text>
          </View>
          <View style={styles.abreviaturaItem}>
            <Text style={styles.abreviaturaLabel}>PTS:</Text>
            <Text style={styles.abreviaturaText}>Puntos</Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 24,
    paddingBottom: 32,
  },
  grupoHeader: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  grupoNombre: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  card: {
    marginBottom: 16,
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundGray,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  headerText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  posCol: {
    width: 40,
    alignItems: 'center',
    marginRight: 4,
  },
  positionIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  positionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  equipoCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  equipoColFixed: {
    width: 150,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  equipoColWide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  equipoLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  equipoLogoSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  equipoNombre: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  statColSmall: {
    width: 32,
    alignItems: 'center',
  },
  statCol: {
    width: 50,
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  statBold: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  statPositive: {
    color: colors.success,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  legendDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
  },
  legendText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  abreviaturasGrid: {
    gap: 12,
  },
  abreviaturaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  abreviaturaLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    width: 40,
  },
  abreviaturaText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
});
