import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Sponsor } from '../../api/types';
import api from '../../api';
import { safeAsync } from '../../utils/errorHandling';

const { width } = Dimensions.get('window');

interface SponsorSliderProps {
  idEdicionCategoria?: number;
  autoScroll?: boolean;
  isAdmin?: boolean;
  navigation?: any;
}

export const SponsorSlider: React.FC<SponsorSliderProps> = ({
  idEdicionCategoria,
  autoScroll = false,
  isAdmin = false,
  navigation,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const currentIndex = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sponsorWidth = width - 40; // Ancho completo menos padding

  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSponsors();
  }, [idEdicionCategoria]);

  const loadSponsors = async () => {
    setLoading(true);
    const result = await safeAsync(
      async () => {
        const response = await api.sponsors.list(idEdicionCategoria);
        return response.success && response.data?.sponsors ? response.data.sponsors : [];
      },
      'loadSponsors',
      {
        severity: 'low',
        fallbackValue: [],
      }
    );

    setSponsors(result || []);
    setLoading(false);
  };

  useEffect(() => {
    if (autoScroll && sponsors.length > 0) {
      intervalRef.current = setInterval(() => {
        if (scrollViewRef.current) {
          // Avanzar al siguiente sponsor
          currentIndex.current = (currentIndex.current + 1) % sponsors.length;

          scrollViewRef.current.scrollTo({
            x: currentIndex.current * sponsorWidth,
            animated: true,
          });
        }
      }, 10000); // Cada 10 segundos
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoScroll, sponsorWidth, sponsors.length]);

  const handleSponsorPress = (link: string) => {
    Linking.openURL(link);
  };

  const handleCreateSponsor = () => {
    if (navigation) {
      navigation.navigate('CreateSponsor', { idEdicionCategoria });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!sponsors || !Array.isArray(sponsors) || sponsors.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="storefront-outline" size={32} color={colors.textLight} />
        <Text style={styles.emptyText}>No hay sponsors disponibles</Text>
        {isAdmin && navigation && (
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateSponsor}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="plus-circle" size={18} color={colors.primary} />
            <Text style={styles.createButtonText}>Crear Sponsor</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerStyle={styles.scrollContent}
      >
        {sponsors.map((sponsor) => (
          <TouchableOpacity
            key={sponsor.id_sponsor}
            style={[styles.sponsorItem, { width: width - 40 }]}
            onPress={() => handleSponsorPress(sponsor.link)}
            activeOpacity={0.7}
          >
            <Image
              source={{ uri: sponsor.logo }}
              style={styles.sponsorLogo}
              resizeMode="contain"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 80,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyContainer: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: colors.backgroundGray,
    marginHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    marginTop: 4,
  },
  createButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  scrollContent: {
    flexDirection: 'row',
  },
  sponsorItem: {
    height: 80,
    backgroundColor: colors.white,
    borderRadius: 8,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 5,
    paddingBottom: 20,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  sponsorLogo: {
    width: '100%',
    height: '100%',
  },
});
