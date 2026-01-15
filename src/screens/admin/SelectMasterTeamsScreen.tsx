import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    ActivityIndicator,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import api from '../../api';
import { MJEquipo } from '../../api/services/mj-equipos.service';
import { MJPais } from '../../api/services/mj-paises.service';
import { useToast } from '../../contexts/ToastContext';

type SelectionType = 'equipos' | 'paises';

export const SelectMasterTeamsScreen = ({ navigation, route }: any) => {
    const { idEdicionCategoria, onTeamsAdded } = route.params;
    const { showSuccess, showError } = useToast();

    const [selectionType, setSelectionType] = useState<SelectionType>('equipos');
    const [searchQuery, setSearchQuery] = useState('');
    const [items, setItems] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        loadData();
    }, [selectionType]);

    const loadData = async (query = '') => {
        setLoading(true);
        // Clear selection when switching types is optional, but usually safer
        // setSelectedIds([]); 
        try {
            let response;
            if (selectionType === 'equipos') {
                response = await api.mjEquipos.list(query || undefined);
            } else {
                response = await api.mjPaises.list(query || undefined);
            }

            if (response.success) {
                setItems(response.data);
            }
        } catch (error) {
            showError(`Error al cargar ${selectionType === 'equipos' ? 'equipos' : 'países'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (text: string) => {
        setSearchQuery(text);
        const timer = setTimeout(() => {
            loadData(text);
        }, 500);
        return () => clearTimeout(timer);
    };

    const toggleSelection = (item: any) => {
        const id = item.id_mj_equipo || item.id_mj_pais || item.id;
        if (!id) return;

        setSelectedIds((prev) =>
            prev.includes(id)
                ? prev.filter((i) => i !== id)
                : [...prev, id]
        );
    };

    const handleAddItems = async () => {
        if (selectedIds.length === 0) return;

        setIsAdding(true);
        try {
            const selectedItems = items.filter((item) => {
                const id = item.id_mj_equipo || item.id_mj_pais || item.id;
                return id && selectedIds.includes(id);
            });

            const promises = selectedItems.map((item) =>
                api.equipos.create({
                    nombre: item.nombre,
                    nombre_corto: item.nombre_corto || item.codigo_iso || undefined,
                    logo: selectionType === 'equipos' ? (item.escudo_url || undefined) : (item.bandera_url || undefined),
                    id_edicion_categoria: idEdicionCategoria,
                })
            );

            await Promise.all(promises);

            showSuccess(`${selectedIds.length} ${selectionType === 'equipos' ? 'equipos' : 'países'} agregados correctamente`);
            if (onTeamsAdded) onTeamsAdded();
            navigation.goBack();
        } catch (error) {
            showError('Error al agregar algunos elementos');
        } finally {
            setIsAdding(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const id = item.id_mj_equipo || item.id_mj_pais || item.id;
        const isSelected = id ? selectedIds.includes(id) : false;
        const imageUrl = selectionType === 'equipos' ? item.escudo_url : item.bandera_url;

        return (
            <TouchableOpacity
                style={[styles.teamItem, isSelected && styles.teamItemSelected]}
                onPress={() => toggleSelection(item)}
                activeOpacity={0.7}
            >
                <View style={styles.teamInfo}>
                    <View style={styles.logoContainer}>
                        {imageUrl ? (
                            <Image source={{ uri: imageUrl }} style={styles.logo} />
                        ) : (
                            <MaterialCommunityIcons
                                name={selectionType === 'equipos' ? "shield-outline" : "flag-outline"}
                                size={24}
                                color={colors.textLight}
                            />
                        )}
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.teamName}>{item.nombre}</Text>
                        {selectionType === 'equipos' ? (
                            item.nombre_corto && <Text style={styles.teamShortName}>{item.nombre_corto}</Text>
                        ) : (
                            item.codigo_iso && <Text style={styles.teamShortName}>{item.codigo_iso}</Text>
                        )}
                    </View>
                </View>
                <MaterialCommunityIcons
                    name={isSelected ? 'check-circle' : 'circle-outline'}
                    size={24}
                    color={isSelected ? colors.primary : colors.textLight}
                />
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Seleccionar Existente</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Type Selector (Segmented Control) */}
            <View style={styles.typeSelectorContainer}>
                <TouchableOpacity
                    style={[styles.typeButton, selectionType === 'equipos' && styles.typeButtonActive]}
                    onPress={() => { setSelectionType('equipos'); setSelectedIds([]); }}
                >
                    <Text style={[styles.typeButtonText, selectionType === 'equipos' && styles.typeButtonTextActive]}>
                        Equipos
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.typeButton, selectionType === 'paises' && styles.typeButtonActive]}
                    onPress={() => { setSelectionType('paises'); setSelectedIds([]); }}
                >
                    <Text style={[styles.typeButtonText, selectionType === 'paises' && styles.typeButtonTextActive]}>
                        Países
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchBar}>
                <MaterialCommunityIcons name="magnify" size={20} color={colors.textLight} />
                <TextInput
                    style={styles.searchInput}
                    placeholder={`Buscar en lista maestra de ${selectionType === 'equipos' ? 'equipos' : 'países'}...`}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={() => loadData(searchQuery)}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => { setSearchQuery(''); loadData(''); }}>
                        <MaterialCommunityIcons name="close" size={20} color={colors.textLight} />
                    </TouchableOpacity>
                )}
            </View>

            {/* List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Cargando lista maestra...</Text>
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item) => (item.id_mj_equipo || item.id_mj_pais || item.id || Math.random()).toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons
                                name={selectionType === 'equipos' ? "shield-off-outline" : "flag-off-outline"}
                                size={64}
                                color={colors.textLight}
                            />
                            <Text style={styles.emptyText}>No se encontraron resultados</Text>
                        </View>
                    }
                />
            )}

            {/* Footer Button */}
            {selectedIds.length > 0 && (
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.addButton, isAdding && styles.addButtonDisabled]}
                        onPress={handleAddItems}
                        disabled={isAdding}
                    >
                        {isAdding ? (
                            <ActivityIndicator color={colors.white} />
                        ) : (
                            <Text style={styles.addButtonText}>
                                Agregar {selectedIds.length} {selectedIds.length === 1 ? 'elemento' : 'elementos'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.backgroundGray,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    backButton: {
        padding: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    placeholder: {
        width: 32,
    },
    typeSelectorContainer: {
        flexDirection: 'row',
        backgroundColor: colors.white,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 12,
        padding: 4,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    typeButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    typeButtonActive: {
        backgroundColor: colors.primary,
    },
    typeButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    typeButtonTextActive: {
        color: colors.white,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        margin: 16,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        height: 48,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: colors.textPrimary,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    teamItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    teamItemSelected: {
        borderColor: colors.primary,
        backgroundColor: '#f0f7ff',
    },
    teamInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.backgroundGray,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        overflow: 'hidden',
    },
    logo: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    textContainer: {
        flex: 1,
    },
    teamName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    teamShortName: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: colors.textLight,
    },
    emptyState: {
        marginTop: 60,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: colors.textLight,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: colors.white,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
        paddingBottom: 32,
    },
    addButton: {
        backgroundColor: colors.primary,
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    addButtonDisabled: {
        opacity: 0.7,
    },
    addButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default SelectMasterTeamsScreen;
