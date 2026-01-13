import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GradientHeader, Card } from '../../components/common';
import { colors } from '../../theme/colors';
import { useAuth } from '../../contexts/AuthContext';

interface TheBestScreenProps {
  navigation: any;
}

interface RankingItem {
  id: number;
  nombre: string;
  equipo: string;
  valor: number;
  foto?: string;
  logo?: string;
}

// Mock data para rankings
const mockGoleadores: RankingItem[] = [
  { id: 1, nombre: 'Carlos Mendoza', equipo: 'FC Barcelona', valor: 15, foto: 'https://1000marcas.net/wp-content/uploads/2020/03/Logo-Barcelona.png' },
  { id: 2, nombre: 'Luis García', equipo: 'Real Madrid', valor: 12, foto: 'https://1000marcas.net/wp-content/uploads/2020/03/Logo-Barcelona.png' },
  { id: 3, nombre: 'Diego Fernández', equipo: 'Juventus', valor: 11, foto: 'https://1000marcas.net/wp-content/uploads/2020/03/Logo-Barcelona.png' },
];

const mockGolesMarcados: RankingItem[] = [
  { id: 1, nombre: 'FC Barcelona', equipo: '', valor: 45, logo: 'https://1000marcas.net/wp-content/uploads/2020/03/Logo-Barcelona.png' },
  { id: 2, nombre: 'Real Madrid', equipo: '', valor: 42, logo: 'https://1000marcas.net/wp-content/uploads/2020/03/Logo-Barcelona.png' },
  { id: 3, nombre: 'Juventus', equipo: '', valor: 38, logo: 'https://1000marcas.net/wp-content/uploads/2020/03/Logo-Barcelona.png' },
];

const mockGolesRecibidos: RankingItem[] = [
  { id: 1, nombre: 'Bayern Munich', equipo: '', valor: 8, logo: 'https://1000marcas.net/wp-content/uploads/2020/03/Logo-Barcelona.png' },
  { id: 2, nombre: 'Manchester City', equipo: '', valor: 10, logo: 'https://1000marcas.net/wp-content/uploads/2020/03/Logo-Barcelona.png' },
  { id: 3, nombre: 'PSG', equipo: '', valor: 12, logo: 'https://1000marcas.net/wp-content/uploads/2020/03/Logo-Barcelona.png' },
];

const mockAmarillas: RankingItem[] = [
  { id: 1, nombre: 'Roberto Silva', equipo: 'Inter Milan', valor: 8, foto: 'https://1000marcas.net/wp-content/uploads/2020/03/Logo-Barcelona.png' },
  { id: 2, nombre: 'Fernando Castro', equipo: 'Atletico', valor: 7, foto: 'https://1000marcas.net/wp-content/uploads/2020/03/Logo-Barcelona.png' },
  { id: 3, nombre: 'Javier Morales', equipo: 'Sevilla', valor: 6, foto: 'https://1000marcas.net/wp-content/uploads/2020/03/Logo-Barcelona.png' },
];

const mockRojas: RankingItem[] = [
  { id: 1, nombre: 'Pablo Hernández', equipo: 'Napoli', valor: 3, foto: 'https://1000marcas.net/wp-content/uploads/2020/03/Logo-Barcelona.png' },
  { id: 2, nombre: 'Ricardo Vargas', equipo: 'Roma', valor: 2, foto: 'https://1000marcas.net/wp-content/uploads/2020/03/Logo-Barcelona.png' },
  { id: 3, nombre: 'Jorge Ramírez', equipo: 'Lazio', valor: 2, foto: 'https://1000marcas.net/wp-content/uploads/2020/03/Logo-Barcelona.png' },
];

const mockDiferenciaGol: RankingItem[] = [
  { id: 1, nombre: 'FC Barcelona', equipo: '', valor: 32, logo: 'https://1000marcas.net/wp-content/uploads/2020/03/Logo-Barcelona.png' },
  { id: 2, nombre: 'Real Madrid', equipo: '', valor: 28, logo: 'https://1000marcas.net/wp-content/uploads/2020/03/Logo-Barcelona.png' },
  { id: 3, nombre: 'Bayern Munich', equipo: '', valor: 25, logo: 'https://1000marcas.net/wp-content/uploads/2020/03/Logo-Barcelona.png' },
];

const mockPromedioGoles: RankingItem[] = [
  { id: 1, nombre: 'FC Barcelona', equipo: '', valor: 3.5, logo: 'https://1000marcas.net/wp-content/uploads/2020/03/Logo-Barcelona.png' },
  { id: 2, nombre: 'Real Madrid', equipo: '', valor: 3.2, logo: 'https://1000marcas.net/wp-content/uploads/2020/03/Logo-Barcelona.png' },
  { id: 3, nombre: 'Juventus', equipo: '', valor: 2.9, logo: 'https://1000marcas.net/wp-content/uploads/2020/03/Logo-Barcelona.png' },
];

const mockPromedioGolesRecibidos: RankingItem[] = [
  { id: 1, nombre: 'Bayern Munich', equipo: '', valor: 0.6, logo: 'https://1000marcas.net/wp-content/uploads/2020/03/Logo-Barcelona.png' },
  { id: 2, nombre: 'Manchester City', equipo: '', valor: 0.8, logo: 'https://1000marcas.net/wp-content/uploads/2020/03/Logo-Barcelona.png' },
  { id: 3, nombre: 'PSG', equipo: '', valor: 1.0, logo: 'https://1000marcas.net/wp-content/uploads/2020/03/Logo-Barcelona.png' },
];

const mockPorcentajeVictorias: RankingItem[] = [
  { id: 1, nombre: 'FC Barcelona', equipo: '', valor: 85, logo: 'https://1000marcas.net/wp-content/uploads/2020/03/Logo-Barcelona.png' },
  { id: 2, nombre: 'Bayern Munich', equipo: '', valor: 82, logo: 'https://1000marcas.net/wp-content/uploads/2020/03/Logo-Barcelona.png' },
  { id: 3, nombre: 'Real Madrid', equipo: '', valor: 78, logo: 'https://1000marcas.net/wp-content/uploads/2020/03/Logo-Barcelona.png' },
];

const mockPorcentajeDerrotas: RankingItem[] = [
  { id: 1, nombre: 'Sevilla', equipo: '', valor: 5, logo: 'https://1000marcas.net/wp-content/uploads/2020/03/Logo-Barcelona.png' },
  { id: 2, nombre: 'Atletico', equipo: '', valor: 8, logo: 'https://1000marcas.net/wp-content/uploads/2020/03/Logo-Barcelona.png' },
  { id: 3, nombre: 'Valencia', equipo: '', valor: 12, logo: 'https://1000marcas.net/wp-content/uploads/2020/03/Logo-Barcelona.png' },
];

export const TheBestScreen: React.FC<TheBestScreenProps> = ({ navigation }) => {
  const { isGuest } = useAuth();

  // Check if user is logged out
  if (isGuest) {
    return (
      <View style={styles.container}>
        <GradientHeader title="The Best" onBackPress={() => navigation.goBack()} />
        <View style={styles.guestContainer}>
          <MaterialCommunityIcons name="star-off-outline" size={80} color={colors.primary} />
          <Text style={styles.guestTitle}>Contenido no disponible</Text>
          <Text style={styles.guestText}>
            Debes iniciar sesión para ver las estadísticas y rankings
          </Text>
          <TouchableOpacity
            style={styles.guestButton}
            onPress={() => {
              Alert.alert(
                'Iniciar Sesión',
                '¿Deseas ir a la pantalla de inicio de sesión?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Iniciar Sesión', onPress: () => navigation.navigate('Login') },
                ]
              );
            }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="login" size={24} color={colors.white} />
            <Text style={styles.guestButtonText}>Iniciar Sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  // Formatear nombre: mostrar "Nombre A." (primera letra del apellido)
  const formatPlayerName = (nombreCompleto: string) => {
    const partes = nombreCompleto.trim().split(' ');
    if (partes.length === 1) {
      return partes[0]; // Si solo hay una palabra, mostrarla completa
    }
    
    const nombre = partes[0];
    const apellidoInicial = partes[partes.length - 1].charAt(0).toUpperCase();
    return `${nombre} ${apellidoInicial}.`;
  };

  const renderRankingCard = (
    title: string,
    icon: string,
    iconColor: string,
    data: RankingItem[],
    isTeam: boolean,
    navigateTo: string,
    showPercentage: boolean = false,
    showDecimal: boolean = false
  ) => {
    return (
      <Card style={styles.rankingCard}>
        <View style={styles.rankingHeader}>
          <View style={styles.rankingTitleContainer}>
            <MaterialCommunityIcons name={icon as any} size={24} color={iconColor} />
            <Text style={styles.rankingTitle}>{title}</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate(navigateTo)}
            style={styles.verTodoButton}
          >
            <Text style={styles.verTodoText}>Ver todo</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {data.map((item, index) => (
          <View key={item.id} style={styles.rankingItem}>
            {/* Posición */}
            <View style={[
              styles.positionBadge,
              index === 0 && styles.goldBadge,
              index === 1 && styles.silverBadge,
              index === 2 && styles.bronzeBadge,
            ]}>
              <Text style={styles.positionText}>{index + 1}</Text>
            </View>

            {/* Foto/Logo */}
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: item.foto || item.logo }}
                style={styles.itemImage}
                resizeMode="cover"
              />
            </View>

            {/* Nombre y Equipo */}
            <View style={styles.itemInfo}>
              <Text style={styles.itemNombre} numberOfLines={1}>
                {isTeam ? item.nombre : formatPlayerName(item.nombre)}
              </Text>
              {!isTeam && item.equipo && (
                <Text style={styles.itemEquipo} numberOfLines={1}>
                  {item.equipo}
                </Text>
              )}
            </View>

            {/* Valor */}
            <Text style={styles.itemValor}>
              {showDecimal ? item.valor.toFixed(1) : item.valor}
              {showPercentage && '%'}
            </Text>
          </View>
        ))}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <GradientHeader
        title="The Best"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Goleadores */}
        {renderRankingCard(
          'Goleadores',
          'soccer',
          colors.primary,
          mockGoleadores,
          false,
          'TopScorers'
        )}

        {/* Goles Marcados */}
        {renderRankingCard(
          'Goles Marcados',
          'target',
          colors.success,
          mockGolesMarcados,
          true,
          'TopGoals'
        )}

        {/* Menores Goles Recibidos */}
        {renderRankingCard(
          'Menores Goles Recibidos',
          'shield-check',
          colors.info,
          mockGolesRecibidos,
          true,
          'LeastConceded'
        )}

        {/* Tarjetas Amarillas */}
        {renderRankingCard(
          'Tarjetas Amarillas',
          'card',
          '#FFC107',
          mockAmarillas,
          false,
          'YellowCards'
        )}

        {/* Tarjetas Rojas */}
        {renderRankingCard(
          'Tarjetas Rojas',
          'card',
          colors.error,
          mockRojas,
          false,
          'RedCards'
        )}

        {/* Mejor Diferencia de Gol */}
        {renderRankingCard(
          'Mejor Diferencia de Gol',
          'chart-line',
          '#9C27B0',
          mockDiferenciaGol,
          true,
          'GoalDifference'
        )}

        {/* Promedio de Goles */}
        {renderRankingCard(
          'Mejor Promedio de Goles',
          'calculator',
          '#00BCD4',
          mockPromedioGoles,
          true,
          'AverageGoals',
          false,
          true
        )}

        {/* Promedio Goles Recibidos */}
        {renderRankingCard(
          'Menor Promedio Goles Recibidos',
          'shield-check',
          '#4CAF50',
          mockPromedioGolesRecibidos,
          true,
          'AverageConceded',
          false,
          true
        )}

        {/* % Victorias */}
        {renderRankingCard(
          '% Partidos Ganados',
          'trophy',
          '#FFD700',
          mockPorcentajeVictorias,
          true,
          'WinPercentage',
          true
        )}

        {/* % Derrotas */}
        {renderRankingCard(
          '% Partidos Perdidos',
          'close-circle',
          '#FF5722',
          mockPorcentajeDerrotas,
          true,
          'LossPercentage',
          true
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  rankingCard: {
    marginBottom: 20,
    padding: 16,
  },
  rankingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rankingTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rankingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  verTodoButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verTodoText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  positionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goldBadge: {
    backgroundColor: '#FFD700',
  },
  silverBadge: {
    backgroundColor: '#C0C0C0',
  },
  bronzeBadge: {
    backgroundColor: '#CD7F32',
  },
  positionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },
  imageContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: colors.backgroundGray,
  },
  itemImage: {
    width: 48,
    height: 48,
  },
  itemInfo: {
    flex: 1,
  },
  itemNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  itemEquipo: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  itemValor: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 20,
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  guestText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  guestButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
});
