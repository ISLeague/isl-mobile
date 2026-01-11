import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../../../components/common';
import { colors } from '../../../theme/colors';
import { useToast } from '../../../contexts/ToastContext';
import api from '../../../api';
import { GlobalStatsPlayer } from '../../../api/types/estadisticas.types';
import { getLogoUri } from '../../../utils/imageUtils';

interface LeagueStatsEmbedProps {
    navigation: any;
    idEdicionCategoria?: number;
}

export const LeagueStatsEmbed: React.FC<LeagueStatsEmbedProps> = ({ navigation, idEdicionCategoria }) => {
    const { showError } = useToast();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<{
        goleadores: GlobalStatsPlayer[];
        asistidores: GlobalStatsPlayer[];
        mvps: GlobalStatsPlayer[];
        tarjetas_rojas: GlobalStatsPlayer[];
        tarjetas_amarillas: GlobalStatsPlayer[];
    } | null>(null);

    const loadStats = useCallback(async (isRefreshing = false) => {
        if (!idEdicionCategoria) return;

        try {
            if (!isRefreshing) setLoading(true);

            const response = await api.estadisticas.global(idEdicionCategoria, 5);
            if (response.success && response.data) {
                setStats({
                    goleadores: response.data.goleadores,
                    asistidores: response.data.asistidores,
                    mvps: response.data.mvps,
                    tarjetas_rojas: response.data.tarjetas_rojas,
                    tarjetas_amarillas: response.data.tarjetas_amarillas,
                });
            }
        } catch (error) {
            showError('No se pudieron cargar las estadísticas de la liga');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [idEdicionCategoria, showError]);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    const onRefresh = () => {
        setRefreshing(true);
        loadStats(true);
    };

    const formatPlayerName = (nombreCompleto: string) => {
        const partes = nombreCompleto.trim().split(' ');
        if (partes.length === 1) return partes[0];
        const nombre = partes[0];
        const apellidoInicial = partes[partes.length - 1].charAt(0).toUpperCase();
        return `${nombre} ${apellidoInicial}.`;
    };

    const renderRankingSection = (title: string, icon: any, data: GlobalStatsPlayer[], color: string, statKey: keyof GlobalStatsPlayer['estadisticas']) => {
        if (!data || data.length === 0) return null;

        return (
            <Card style={styles.sectionCard}>
                <View style={[styles.sectionHeader, { borderLeftColor: color }]}>
                    <MaterialCommunityIcons name={icon} size={24} color={color} />
                    <Text style={styles.sectionTitle}>{title}</Text>
                </View>

                <View style={styles.rankingList}>
                    {data.map((player, index) => (
                        <TouchableOpacity
                            key={`${player.id_plantilla}-${index}`}
                            style={styles.playerRow}
                            onPress={() => navigation.navigate('PlayerDetail', { playerId: player.id_plantilla })}
                        >
                            <View style={styles.positionBadge}>
                                <Text style={[
                                    styles.positionText,
                                    index === 0 && styles.firstPos,
                                    index === 1 && styles.secondPos,
                                    index === 2 && styles.thirdPos
                                ]}>
                                    {index + 1}
                                </Text>
                            </View>

                            <Image
                                source={player.foto ? { uri: player.foto } : require('../../../assets/InterLOGO.png')}
                                style={styles.playerPhoto}
                            />

                            <View style={styles.playerInfo}>
                                <Text style={styles.playerName}>{formatPlayerName(player.nombre)}</Text>
                                <View style={styles.teamRow}>
                                    <Image
                                        source={getLogoUri(player.equipo.logo) || require('../../../assets/InterLOGO.png')}
                                        style={styles.teamLogo}
                                        resizeMode="contain"
                                    />
                                    <Text style={styles.teamName}>{player.equipo.nombre}</Text>
                                </View>
                            </View>

                            <View style={[styles.statBadge, { backgroundColor: color + '20' }]}>
                                <Text style={[styles.statText, { color: color }]}>{player.estadisticas[statKey]}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </Card>
        );
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Cargando estadísticas de la liga...</Text>
            </View>
        );
    }

    if (!stats) {
        return (
            <ScrollView
                contentContainerStyle={styles.emptyContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            >
                <MaterialCommunityIcons name="chart-bar" size={64} color={colors.textLight} />
                <Text style={styles.emptyText}>No hay estadísticas disponibles todavía</Text>
            </ScrollView>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
            <View style={styles.content}>
                {renderRankingSection('Máximos Goleadores', 'soccer', stats.goleadores, '#FF3B30', 'goles')}
                {renderRankingSection('Máximos Asistidores', 'handball', stats.asistidores, '#34C759', 'asistencias')}
                {renderRankingSection('Líderes MVP', 'star', stats.mvps, '#FFCC00', 'mvps')}
                {renderRankingSection('Tarjetas Rojas', 'card-outline', stats.tarjetas_rojas, '#FF3B30', 'tarjetas_rojas')}
                {renderRankingSection('Tarjetas Amarillas', 'card-outline', stats.tarjetas_amarillas, '#FFD60A', 'tarjetas_amarillas')}
            </View>
            <View style={styles.bottomSpacing} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.backgroundGray,
    },
    content: {
        padding: 16,
        gap: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: colors.textSecondary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        marginTop: 16,
        textAlign: 'center',
        color: colors.textSecondary,
        fontSize: 16,
    },
    sectionCard: {
        padding: 0,
        overflow: 'hidden',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: colors.white,
        borderLeftWidth: 4,
        gap: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    rankingList: {
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.white,
    },
    positionBadge: {
        width: 24,
        alignItems: 'center',
        marginRight: 8,
    },
    positionText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.textSecondary,
    },
    firstPos: { color: '#FFD700', fontSize: 18 },
    secondPos: { color: '#C0C0C0', fontSize: 16 },
    thirdPos: { color: '#CD7F32', fontSize: 15 },
    playerPhoto: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.backgroundGray,
        marginRight: 12,
    },
    playerInfo: {
        flex: 1,
    },
    playerName: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    teamRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
        gap: 4,
    },
    teamLogo: {
        width: 14,
        height: 14,
    },
    teamName: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    statBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        minWidth: 40,
        alignItems: 'center',
    },
    statText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    bottomSpacing: {
        height: 40,
    },
});
