import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { Equipo, Grupo } from '../../../types';

interface Jugador {
  nombre: string;
  dni: string;
  fecha_nacimiento: string;
  dorsal?: number;
  es_refuerzo: boolean;
}

interface EquipoConJugadores extends Partial<Equipo> {
  jugadores?: Jugador[];
}

interface ImportTeamsModalProps {
  visible: boolean;
  onClose: () => void;
  onImport: (teams: EquipoConJugadores[], grupoId: number) => void;
  grupos: Grupo[];
  initialGrupoId?: number;
}

const ImportTeamsModal: React.FC<ImportTeamsModalProps> = ({
  visible,
  onClose,
  onImport,
  grupos,
  initialGrupoId,
}) => {
  const [csvText, setCsvText] = useState('');
  const [previewTeams, setPreviewTeams] = useState<EquipoConJugadores[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedGrupoId, setSelectedGrupoId] = useState(initialGrupoId || grupos[0]?.id_grupo);
  const [showGrupoPicker, setShowGrupoPicker] = useState(false);
  const [expandedTeam, setExpandedTeam] = useState<number | null>(null);

  const parseCSV = (text: string): EquipoConJugadores[] => {
    try {
      const lines = text.trim().split('\n');
      const teams: EquipoConJugadores[] = [];
      let currentTeam: EquipoConJugadores | null = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Si la línea empieza con "EQUIPO:", es un nuevo equipo
        if (line.toUpperCase().startsWith('EQUIPO:')) {
          // Guardar el equipo anterior si existe
          if (currentTeam) {
            teams.push(currentTeam);
          }
          
          // Crear nuevo equipo
          const equipoData = line.substring(7).trim().split(',').map(p => p.trim());
          currentTeam = {
            nombre: equipoData[0],
            logo: equipoData[1] || undefined,
            jugadores: [],
          };
        }
        // Si la línea empieza con "JUGADOR:", es un jugador del equipo actual
        else if (line.toUpperCase().startsWith('JUGADOR:')) {
          if (!currentTeam) {
            throw new Error(`Línea ${i + 1}: Se encontró un jugador antes de definir un equipo`);
          }
          
          const jugadorData = line.substring(8).trim().split(',').map(p => p.trim());
          
          // Formato: JUGADOR: nombre, dni, DD/MM/YYYY, [dorsal], refuerzo
          // Mínimo 4 campos (sin dorsal): nombre, dni, fecha, refuerzo
          // Máximo 5 campos (con dorsal): nombre, dni, fecha, dorsal, refuerzo
          
          if (jugadorData.length < 4 || jugadorData.length > 5) {
            throw new Error(
              `Línea ${i + 1}: Formato incorrecto. Debe ser: JUGADOR: nombre, dni, DD/MM/YYYY, [dorsal], refuerzo`
            );
          }

          const nombre = jugadorData[0];
          const dni = jugadorData[1];
          const fecha = jugadorData[2];
          
          let dorsal: number | undefined;
          let refuerzoStr: string;
          
          // Si tiene 5 campos, el 4to es dorsal y el 5to es refuerzo
          if (jugadorData.length === 5) {
            const dorsalNum = parseInt(jugadorData[3]);
            if (isNaN(dorsalNum) || dorsalNum < 1 || dorsalNum > 99) {
              throw new Error(`Línea ${i + 1}: Dorsal debe ser un número entre 1 y 99`);
            }
            dorsal = dorsalNum;
            refuerzoStr = jugadorData[4];
          } else {
            // Si tiene 4 campos, el 4to es refuerzo y no hay dorsal
            refuerzoStr = jugadorData[3];
          }

          // Validar formato de fecha DD/MM/YYYY
          const fechaRegex = /^\d{2}\/\d{2}\/\d{4}$/;
          if (!fechaRegex.test(fecha)) {
            throw new Error(`Línea ${i + 1}: Fecha debe estar en formato DD/MM/YYYY (ej: 15/05/2000)`);
          }

          // Validar DNI (7-10 dígitos)
          if (!/^\d{7,10}$/.test(dni)) {
            throw new Error(`Línea ${i + 1}: DNI debe tener entre 7 y 10 dígitos`);
          }

          // Validar refuerzo (0 o 1)
          if (refuerzoStr !== '0' && refuerzoStr !== '1') {
            throw new Error(`Línea ${i + 1}: Refuerzo debe ser 0 (no refuerzo) o 1 (refuerzo)`);
          }

          currentTeam.jugadores!.push({
            nombre,
            dni,
            fecha_nacimiento: fecha,
            dorsal,
            es_refuerzo: refuerzoStr === '1',
          });
        }
        // Si no tiene prefijo, asumimos que es formato simple de equipo
        else if (!currentTeam) {
          const parts = line.split(',').map(p => p.trim());
          if (parts.length < 1) {
            throw new Error(`Línea ${i + 1}: formato incorrecto`);
          }
          
          teams.push({
            nombre: parts[0],
            logo: parts[1] || undefined,
            jugadores: [],
          });
        }
      }

      // Agregar el último equipo si existe
      if (currentTeam) {
        teams.push(currentTeam);
      }

      return teams;
    } catch (error) {
      throw error;
    }
  };

  const handlePreview = () => {
    try {
      if (!csvText.trim()) {
        Alert.alert('Error', 'Por favor ingresa datos CSV');
        return;
      }

      const teams = parseCSV(csvText);
      
      if (teams.length === 0) {
        Alert.alert('Error', 'No se encontraron equipos válidos');
        return;
      }

      setPreviewTeams(teams);
      setShowPreview(true);
    } catch (error: any) {
      Alert.alert('Error al parsear CSV', error.message || 'Formato incorrecto');
    }
  };

  const handleImport = () => {
    if (previewTeams.length === 0) {
      Alert.alert('Error', 'No hay equipos para importar');
      return;
    }

    const selectedGrupo = grupos.find(g => g.id_grupo === selectedGrupoId);
    
    Alert.alert(
      'Confirmar Importación',
      `¿Deseas importar ${previewTeams.length} equipo(s) al grupo "${selectedGrupo?.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Importar',
          onPress: () => {
            onImport(previewTeams, selectedGrupoId);
            handleClose();
          },
        },
      ]
    );
  };

  const handleClose = () => {
    setCsvText('');
    setPreviewTeams([]);
    setShowPreview(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Importar Equipos (CSV)</Text>
            <TouchableOpacity onPress={handleClose}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.infoCard}>
              <MaterialCommunityIcons name="information" size={20} color={colors.info} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoText}>
                  <Text style={styles.infoBold}>Formato CSV:</Text>{'\n'}
                  {'\n'}
                  <Text style={styles.infoBold}>Opción 1 - Solo equipos:</Text>{'\n'}
                  nombre,logo_url{'\n'}
                  {'\n'}
                  <Text style={styles.infoBold}>Opción 2 - Equipos con jugadores:</Text>{'\n'}
                  EQUIPO: nombre, logo_url{'\n'}
                  JUGADOR: nombre, dni, DD/MM/YYYY, dorsal, refuerzo{'\n'}
                  JUGADOR: nombre, dni, DD/MM/YYYY, refuerzo{'\n'}
                  {'\n'}
                  <Text style={styles.infoBold}>Ejemplo:</Text>{'\n'}
                  EQUIPO: Real Madrid, https://...{'\n'}
                  JUGADOR: Lionel Messi, 12345678, 24/06/1987, 10, 0{'\n'}
                  JUGADOR: Cristiano Ronaldo, 87654321, 05/02/1985, 1{'\n'}
                  EQUIPO: Barcelona{'\n'}
                  JUGADOR: Neymar Jr, 11223344, 05/02/1992, 11, 0{'\n'}
                  {'\n'}
                  <Text style={styles.infoBold}>Campos obligatorios:</Text>{'\n'}
                  • DNI: 7-10 dígitos{'\n'}
                  • Fecha: DD/MM/YYYY{'\n'}
                  • Refuerzo: 0 (no) o 1 (sí){'\n'}
                  {'\n'}
                  <Text style={styles.infoBold}>Campos opcionales:</Text>{'\n'}
                  • Dorsal: 1-99 (si no se especifica, va sin dorsal)
                </Text>
              </View>
            </View>

            <Text style={styles.label}>Grupo destino:</Text>
            <TouchableOpacity 
              style={styles.grupoCard}
              onPress={() => setShowGrupoPicker(!showGrupoPicker)}
            >
              <Text style={styles.grupoNombre}>
                {grupos.find(g => g.id_grupo === selectedGrupoId)?.nombre || 'Seleccionar grupo'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={24} color={colors.textSecondary} />
            </TouchableOpacity>

            {showGrupoPicker && (
              <View style={styles.grupoPicker}>
                {grupos.map(g => (
                  <TouchableOpacity
                    key={g.id_grupo}
                    style={[
                      styles.grupoOption,
                      g.id_grupo === selectedGrupoId && styles.grupoOptionSelected
                    ]}
                    onPress={() => {
                      setSelectedGrupoId(g.id_grupo);
                      setShowGrupoPicker(false);
                    }}
                  >
                    <Text style={[
                      styles.grupoOptionText,
                      g.id_grupo === selectedGrupoId && styles.grupoOptionTextSelected
                    ]}>
                      {g.nombre}
                    </Text>
                    {g.id_grupo === selectedGrupoId && (
                      <MaterialCommunityIcons name="check" size={20} color={colors.success} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {!showPreview ? (
              <>
                <Text style={styles.label}>Datos CSV:</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Pega aquí los datos CSV..."
                  value={csvText}
                  onChangeText={setCsvText}
                  multiline
                  numberOfLines={10}
                  textAlignVertical="top"
                  placeholderTextColor={colors.textLight}
                />

                <TouchableOpacity style={styles.previewButton} onPress={handlePreview}>
                  <MaterialCommunityIcons name="eye" size={20} color={colors.white} />
                  <Text style={styles.previewButtonText}>Vista Previa</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.previewHeader}>
                  <Text style={styles.label}>Vista Previa ({previewTeams.length} equipos)</Text>
                  <TouchableOpacity onPress={() => setShowPreview(false)}>
                    <Text style={styles.editLink}>Editar</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.previewList}>
                  {previewTeams.map((team, index) => (
                    <View key={index} style={styles.previewTeamCard}>
                      <TouchableOpacity 
                        style={styles.previewTeamHeader}
                        onPress={() => setExpandedTeam(expandedTeam === index ? null : index)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="shield" size={24} color={colors.primary} />
                        <View style={styles.previewTeamInfo}>
                          <Text style={styles.previewTeamName}>{team.nombre}</Text>
                          {team.logo && (
                            <Text style={styles.previewTeamLogo} numberOfLines={1}>
                              Logo: {team.logo}
                            </Text>
                          )}
                          {team.jugadores && team.jugadores.length > 0 && (
                            <Text style={styles.previewTeamJugadores}>
                              {team.jugadores.length} jugador(es)
                            </Text>
                          )}
                        </View>
                        {team.jugadores && team.jugadores.length > 0 && (
                          <MaterialCommunityIcons 
                            name={expandedTeam === index ? "chevron-up" : "chevron-down"} 
                            size={24} 
                            color={colors.textSecondary} 
                          />
                        )}
                      </TouchableOpacity>
                      
                      {expandedTeam === index && team.jugadores && team.jugadores.length > 0 && (
                        <View style={styles.jugadoresList}>
                          {team.jugadores.map((jugador, jIndex) => (
                            <View key={jIndex} style={styles.jugadorItem}>
                              <View style={styles.jugadorNumber}>
                                <Text style={styles.jugadorNumberText}>
                                  {jugador.dorsal || '-'}
                                </Text>
                              </View>
                              <View style={styles.jugadorInfo}>
                                <Text style={styles.jugadorName}>
                                  {jugador.nombre}
                                  {jugador.es_refuerzo && (
                                    <Text style={styles.refuerzoBadge}> R</Text>
                                  )}
                                </Text>
                                <Text style={styles.jugadorDni}>DNI: {jugador.dni}</Text>
                                <Text style={styles.jugadorDate}>
                                  Nac: {jugador.fecha_nacimiento}
                                </Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </View>

                <TouchableOpacity style={styles.importButton} onPress={handleImport}>
                  <MaterialCommunityIcons name="upload" size={20} color={colors.white} />
                  <Text style={styles.importButtonText}>Importar Equipos</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  modalBody: {
    padding: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoText: {
    fontSize: 11,
    color: colors.info,
    lineHeight: 16,
  },
  infoBold: {
    fontWeight: '700',
    fontSize: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  grupoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.backgroundGray,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  grupoNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  grupoPicker: {
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    maxHeight: 200,
  },
  grupoOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  grupoOptionSelected: {
    backgroundColor: colors.backgroundGray,
  },
  grupoOptionText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  grupoOptionTextSelected: {
    fontWeight: '600',
    color: colors.success,
  },
  textArea: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 150,
    marginBottom: 16,
  },
  previewButton: {
    flexDirection: 'row',
    backgroundColor: colors.info,
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  previewButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  previewList: {
    marginBottom: 16,
  },
  previewTeamCard: {
    backgroundColor: colors.backgroundGray,
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  previewTeamHeader: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    alignItems: 'center',
  },
  previewTeamInfo: {
    flex: 1,
  },
  previewTeamName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  previewTeamLogo: {
    fontSize: 11,
    color: colors.textLight,
    marginBottom: 2,
  },
  previewTeamJugadores: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
  },
  jugadoresList: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 8,
  },
  jugadorItem: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: 8,
    borderRadius: 6,
    gap: 10,
    alignItems: 'center',
  },
  jugadorNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jugadorNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },
  jugadorInfo: {
    flex: 1,
  },
  jugadorName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  refuerzoBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.warning,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  jugadorDni: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  jugadorDate: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  importButton: {
    flexDirection: 'row',
    backgroundColor: colors.success,
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  importButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ImportTeamsModal;
