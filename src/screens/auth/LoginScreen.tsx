import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { colors } from '../../theme/colors';
import { useToast } from '../../contexts/ToastContext';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { safeAsync, getUserFriendlyMessage } from '../../utils/errorHandling';

export const LoginScreen = ({ navigation }: any) => {
  const { login, loginAsGuest, deviceToken } = useAuth();
  const { showError, showSuccess, showWarning } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = 'El email es requerido';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email inválido';

    if (!password) newErrors.password = 'La contraseña es requerida';
    else if (password.length < 6) newErrors.password = 'Debe tener al menos 6 caracteres';

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      showWarning('Por favor completa todos los campos correctamente', 'Validación');
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);

    const response = await safeAsync(
      async () => {
        console.log('🔑 Intentando login con device_token:', deviceToken);
        return await api.auth.login({
          email,
          password,
          device_token: deviceToken || undefined
        });
      },
      'login',
      {
        severity: 'high',
        fallbackValue: null,
        onError: (error) => {
          showError(getUserFriendlyMessage(error), 'Error');
        }
      }
    );

    setLoading(false);

    if (response) {
      // console.log('✅ Login exitoso:', 
    

      // Guardar en el contexto
      login(response.token, response.usuario);
      showSuccess(`¡Bienvenido!`, 'Sesión iniciada');

      // Verificar si debe cambiar contraseña (admins de torneo en primer login)
      if (response.usuario.debe_cambiar_password) {
        // console.log('🔄 Redirigiendo a ChangePassword');
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'ChangePassword' }],
          });
        }, 500);
        return;
      }

      // Navegación según el rol
      const rol = response.usuario.rol;
      // console.log('👤 Rol del usuario:', rol);

      setTimeout(() => {
        if (rol === 'superadmin') {
          // console.log('🔄 Navegando a ManageCountries (SuperAdmin)');
          navigation.reset({
            index: 0,
            routes: [{ name: 'ManageCountries' }],
          });
        } else if (rol === 'admin') {
          // console.log('🔄 Navegando a TournamentAdminDashboard (Admin)');
          // Admin de torneo → TournamentAdminDashboard (muestra lista de torneos)
          if (response.usuario.id_torneos && response.usuario.id_torneos.length > 0) {
            navigation.reset({
              index: 0,
              routes: [{ name: 'TournamentAdminDashboard' }],
            });
          } else {
            // Admin sin torneos asignados (no debería pasar)
            showError('Admin sin torneos asignados', 'Error');
          }
        } else if (rol === 'camarografo') {
          // console.log('🔄 Navegando a Camarografo');
          navigation.reset({
            index: 0,
            routes: [{ name: 'Camarografo' }],
          });
        } else {
          // console.log('🔄 Navegando a Main (Fan/Jugador)');
          // Fan o jugador → Main (tabs)
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        }
      }, 500);
    }
  };

  const handleGuestLogin = () => {
    loginAsGuest();
    showSuccess('Navegando como invitado', 'Bienvenido');
    setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    }, 500);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* fondo de círculos / gradiente en posición absoluta (detrás) */}
      <View style={styles.backgroundContainer} pointerEvents="none">
        {/* Círculo grande - opacidad 78% */}
        <LinearGradient
          colors={['#F13A21', '#BE0127']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.bigCircle, { opacity: 0.78 }]}
        />

        {/* Círculo pequeño - opacidad 100% */}
        <LinearGradient
          colors={['#F13A21', '#BE0127']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.smallCircle, { opacity: 1 }]}
        />
      </View>


      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo centrado sobre la curva */}
          <View style={styles.logoWrapper}>
            <Image
              source={require('../../assets/InterLOGO.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Texto welcome */}
          <View style={styles.headerText}>
            <Text style={styles.title}>Bienvenido a ISL</Text>
            <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
          </View>

          {/* Formulario (sobre fondo blanco) */}
          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="tu@email.com"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setErrors((s) => ({ ...s, email: undefined }));
              }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              leftIcon={<MaterialCommunityIcons name="email-outline" size={20} color="#666" />}
            />

            <Input
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setErrors((s) => ({ ...s, password: undefined }));
              }}
              error={errors.password}
              isPassword
              autoComplete="password"
              textContentType="password"
              leftIcon={<MaterialCommunityIcons name="lock-outline" size={20} color="#666" />}
            />

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => Alert.alert('Info', 'Próximamente: Recuperar contraseña')}
            >
              <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <Button title="Iniciar Sesión" onPress={handleLogin} loading={loading} style={styles.loginButton} />

            {/* Botón Ingresar como Invitado */}
            <TouchableOpacity
              style={styles.guestButton}
              onPress={handleGuestLogin}
              disabled={loading}
            >
              <MaterialCommunityIcons name="account-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.guestButtonText}>Ingresar como Invitado</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>¿No tienes cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Regístrate</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320, // alto que contiene las circunferencias
    zIndex: -1,
  },
  bigCircle: {
    position: 'absolute',
    width: 700, // anchura grande para que cree curva
    height: 700,
    borderRadius: 350,
    top: -520,
    right: -150,
  },
  smallCircle: {
    position: 'absolute',
    width: 480,
    height: 480,
    borderRadius: 240,
    top: -300,
    right: -60,
    opacity: 0.95,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 40,
  },
  logoWrapper: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 6,
    zIndex: 1, // por encima del fondo
  },
  logo: {
    width: 110,
    height: 110,
  },
  headerText: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 6,
  },
  form: {
    marginTop: 6,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    // añade sombra / elevación si quieres
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    marginTop: 2,
  },
  forgotPasswordText: {
    color: '#E53935',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    marginTop: 4,
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundGray,
    marginTop: 12,
    gap: 8,
  },
  guestButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  footer: {
    marginTop: 22,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  footerLink: {
    fontSize: 14,
    color: '#E53935',
    fontWeight: '700',
  },
});