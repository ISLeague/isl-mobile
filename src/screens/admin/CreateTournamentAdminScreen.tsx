import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GradientHeader, Input, Button, Card } from '../../components/common';
import { colors } from '../../theme/colors';
import { useToast } from '../../contexts/ToastContext';
import { mockUsuarios } from '../../data/mockData';
import { Usuario } from '../../types';

interface CreateTournamentAdminScreenProps {
  navigation: any;
  route: any;
}

export const CreateTournamentAdminScreen: React.FC<CreateTournamentAdminScreenProps> = ({
  navigation,
  route,
}) => {
  const { torneo, edicion, pais } = route.params;
  const { showSuccess, showError } = useToast();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<{
    nombre?: string;
    email?: string;
  }>({});

  // Función para generar contraseña aleatoria segura
  const generatePassword = (): string => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  };

  const validateForm = () => {
    const newErrors: any = {};

    // Validar nombre
    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (nombre.trim().length < 3) {
      newErrors.nombre = 'El nombre debe tener al menos 3 caracteres';
    }

    // Validar email
    if (!email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateAdmin = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Buscar si el admin ya existe
      const existingAdmin = mockUsuarios.find(u => u.email === email);
      
      if (existingAdmin) {
        // Admin existe - IGNORAR contraseña ingresada y solo agregar torneo
        
        // Verificar si ya tiene este torneo asignado
        if (existingAdmin.id_torneos?.includes(torneo.id_torneo) && 
            existingAdmin.id_ediciones?.includes(edicion.id_edicion)) {
          showError(
            `Este admin ya tiene asignado el torneo "${torneo.nombre}" - Edición ${edicion.numero}`,
            'Torneo ya asignado'
          );
          setLoading(false);
          return;
        }

        // Agregar torneo a las listas del admin existente
        if (!existingAdmin.id_torneos) {
          existingAdmin.id_torneos = [];
        }
        if (!existingAdmin.id_ediciones) {
          existingAdmin.id_ediciones = [];
        }

        existingAdmin.id_torneos.push(torneo.id_torneo);
        existingAdmin.id_ediciones.push(edicion.id_edicion);

        showSuccess(
          `Torneo "${torneo.nombre}" agregado exitosamente al admin\nEmail: ${email}`,
          'Torneo Agregado'
        );
        
        navigation.goBack();
      } else {
        // Admin no existe - crear nueva cuenta con contraseña generada automáticamente
        const passwordGenerada = generatePassword();
        
        // TODO: Llamar a la API para:
        // 1. Hashear la contraseña generada (bcrypt)
        // 2. Crear el admin en la BD con el hash
        // 3. Enviar email al admin con las credenciales temporales
        
        // Simulación: En producción, aquí se guardará el hash, no la contraseña plana
        const nuevoAdmin: Usuario = {
          id_usuario: mockUsuarios.length + 1,
          email: email,
          rol: 'admin',
          id_pais: pais.id_pais,
          id_torneos: [torneo.id_torneo],
          id_ediciones: [edicion.id_edicion],
          acepto_terminos: true,
          acepto_privacidad: true,
          fecha_aceptacion_terminos: new Date().toISOString(),
          debe_cambiar_password: true, // Marcar que debe cambiar la contraseña en el primer login
        };

        mockUsuarios.push(nuevoAdmin);

        // En desarrollo mostramos la contraseña, en producción solo se envía por email
        console.log('🔐 Contraseña generada para', email, ':', passwordGenerada);
        console.log('📧 En producción se enviaría por email al admin');

        showSuccess(
          `Admin "${nombre}" creado exitosamente\nEmail: ${email}\nTorneo: ${torneo.nombre}\n\n✉️ Se ha enviado un correo con la contraseña temporal\n🔒 Deberá cambiarla en el primer inicio de sesión`,
          'Admin Creado'
        );
        
        navigation.goBack();
      }
    } catch (error) {
      showError('No se pudo completar la operación', 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <GradientHeader
        title="Crear Admin de Torneo"
        onBackPress={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Info del Torneo */}
          <Card style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <MaterialCommunityIcons name="information" size={24} color={colors.info} />
              <Text style={styles.infoTitle}>Asignación del Admin</Text>
            </View>
            <View style={styles.infoContent}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>País:</Text>
                <Text style={styles.infoValue}>{pais.emoji} {pais.nombre}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Torneo:</Text>
                <Text style={styles.infoValue}>{torneo.nombre}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Edición:</Text>
                <Text style={styles.infoValue}>Edición {edicion.numero}</Text>
              </View>
            </View>
            <Text style={styles.infoNote}>
              • Si el email ya existe, se agregará el torneo a su cuenta{"\n"}
              • Si el email no existe, se creará una nueva cuenta de admin{"\n"}
              • Se generará una contraseña automática y se enviará por correo{"\n"}
              • Los nuevos admins deberán cambiar su contraseña en el primer inicio de sesión{"\n"}
              • El admin solo podrá gestionar las categorías de esta edición específica
            </Text>
          </Card>

          {/* Formulario */}
          <View style={styles.form}>
            <Input
              label="Nombre del Admin"
              placeholder="Juan Pérez"
              value={nombre}
              onChangeText={(text) => {
                setNombre(text);
                setErrors({ ...errors, nombre: undefined });
              }}
              error={errors.nombre}
              autoCapitalize="words"
              leftIcon={
                <MaterialCommunityIcons
                  name="account"
                  size={22}
                  color={colors.textSecondary}
                />
              }
            />

            <Input
              label="Email"
              placeholder="admin@email.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrors({ ...errors, email: undefined });
              }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon={
                <MaterialCommunityIcons
                  name="email-outline"
                  size={22}
                  color={colors.textSecondary}
                />
              }
            />

            <Card style={styles.passwordInfoCard}>
              <View style={styles.passwordInfoContent}>
                <MaterialCommunityIcons name="lock-alert" size={20} color={colors.info} />
                <Text style={styles.passwordInfoText}>
                  La contraseña se generará automáticamente y se enviará por correo al admin
                </Text>
              </View>
            </Card>

            <Button
              title="Asignar Admin al Torneo"
              onPress={handleCreateAdmin}
              loading={loading}
              style={styles.createButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  infoCard: {
    marginBottom: 24,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  infoContent: {
    gap: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  infoNote: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    fontStyle: 'italic',
    backgroundColor: colors.backgroundGray,
    padding: 12,
    borderRadius: 8,
  },
  form: {
    gap: 16,
  },
  passwordInfoCard: {
    marginTop: 8,
    backgroundColor: colors.infoBackground,
    borderColor: colors.info,
    borderWidth: 1,
  },
  passwordInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  passwordInfoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  createButton: {
    marginTop: 8,
  },
});
