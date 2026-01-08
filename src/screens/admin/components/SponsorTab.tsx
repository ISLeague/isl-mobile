import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { Sponsor } from '../../../api/types';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../api';

interface SponsorTabProps {
  idEdicionCategoria: number;
  onCreateSponsor?: () => void;
  onEditSponsor?: (sponsor: Sponsor) => void;
  onDeleteSponsor?: (idSponsor: number) => void;
}

export const SponsorTab: React.FC<SponsorTabProps> = ({
  idEdicionCategoria,
  onCreateSponsor,
  onEditSponsor,
  onDeleteSponsor,
}) => {
  const { isAdmin } = useAuth();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSponsors();
  }, []);

  const loadSponsors = async () => {
    setLoading(true);
    try {
      const response = await api.sponsors.list(idEdicionCategoria);
      if (response.success && response.data?.sponsors) {
        setSponsors(response.data.sponsors);
      } else {
        setSponsors([]);
      }
    } catch (error) {
      // console.error('Error cargando sponsors:', error);
      setSponsors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'No se puede abrir este enlace');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al abrir el enlace');
    }
  };

  const handleDelete = (sponsor: Sponsor) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que quieres eliminar a ${sponsor.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => onDeleteSponsor?.(sponsor.id_sponsor),
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Cargando sponsors...</Text>
      </View>
    );
  }

  if (!sponsors || !Array.isArray(sponsors) || sponsors.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="handshake-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No hay sponsors registrados</Text>
          {isAdmin && (
            <TouchableOpacity style={styles.addButton} onPress={onCreateSponsor}>
              <MaterialCommunityIcons name="plus" size={24} color={colors.white} />
              <Text style={styles.addButtonText}>Agregar Sponsor</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header con botón agregar */}
        {isAdmin && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={onCreateSponsor}
          >
            <MaterialCommunityIcons name="plus" size={24} color={colors.white} />
            <Text style={styles.addButtonText}>Agregar Sponsor</Text>
          </TouchableOpacity>
        )}

        {/* Lista de sponsors */}
        <View style={styles.sponsorsList}>
          {sponsors.map((sponsor) => (
            <View key={sponsor.id_sponsor} style={styles.sponsorCard}>
              {/* Logo del sponsor */}
              <View style={styles.logoContainer}>
                <Image
                  source={{ uri: sponsor.logo }}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              {/* Info del sponsor */}
              <View style={styles.sponsorInfo}>
                <Text style={styles.sponsorName}>{sponsor.nombre}</Text>
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => handleOpenLink(sponsor.link)}
                >
                  <MaterialCommunityIcons name="web" size={16} color={colors.primary} />
                  <Text style={styles.linkText} numberOfLines={1}>
                    {sponsor.link}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Acciones (solo admin) */}
              {isAdmin && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => onEditSponsor?.(sponsor)}
                  >
                    <MaterialCommunityIcons name="pencil" size={20} color={colors.error} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDelete(sponsor)}
                  >
                    <MaterialCommunityIcons name="delete" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Padding bottom */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundGray,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  sponsorsList: {
    gap: 12,
  },
  sponsorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: colors.backgroundGray,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  logo: {
    width: 70,
    height: 70,
  },
  sponsorInfo: {
    flex: 1,
    marginRight: 8,
  },
  sponsorName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  linkText: {
    fontSize: 13,
    color: colors.primary,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomPadding: {
    height: 20,
  },
});
