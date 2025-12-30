import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider } from './src/contexts/AuthContext';
import { ToastProvider } from './src/contexts/ToastContext';
import { ErrorBoundary } from './src/components/common';
import { ThemeProvider } from './src/contexts/ThemeContext';
import SplashScreen from './src/screens/SplashScreen';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { RegisterScreen } from './src/screens/auth/RegisterScreen';
import { ChangePasswordScreen } from './src/screens/auth/ChangePasswordScreen';
import { MainNavigator } from './src/navigation/MainNavigator';
import CountrySelectionScreen from './src/screens/admin/CountrySelectionScreen';
import AdminTournamentsScreen from './src/screens/admin/AdminTournamentsScreen';
import CreateTournamentScreen from './src/screens/admin/CreateTournamentScreen';
import { TournamentDetailsScreen } from './src/screens/admin/TournamentDetailsScreen';
import { EditTournamentScreen } from './src/screens/admin/EditTournamentScreen';
import { EditEditionScreen } from './src/screens/admin/EditEditionScreen';
import { ManageCategoriesScreen } from './src/screens/admin/ManageCategoriesScreen';
import { CreateEditionScreen } from './src/screens/admin/CreateEditionScreen';
import { TournamentCategoriesScreen } from './src/screens/admin/TournamentCategoriesScreen';
import { CategoryManagementScreen } from './src/screens/admin/CategoryManagementScreen';
import { ManageTeamsScreen } from './src/screens/admin/ManageTeamsScreen';
import { ManageFixtureScreen } from './src/screens/admin/ManageFixtureScreen';
import { LoadResultsScreen } from './src/screens/admin/LoadResultsScreen';
import { CreateLocalScreen } from './src/screens/admin/CreateLocalScreen';
import { CreateCanchaScreen } from './src/screens/admin/CreateCanchaScreen';
import { EditLocalScreen } from './src/screens/admin/EditLocalScreen';
import { EditCanchaScreen } from './src/screens/admin/EditCanchaScreen';
import { LocalDetailScreen } from './src/screens/admin/LocalDetailScreen';
import { ManageCountriesScreen } from './src/screens/admin/ManageCountriesScreen';
import { EditCountryScreen } from './src/screens/admin/EditCountryScreen';
import { GroupStageScreen } from './src/screens/home/GroupStageScreen';
import { TheBestScreen } from './src/screens/home/TheBestScreen';
import { TeamDetailScreen } from './src/screens/home/TeamDetailScreen';
import { PlayerFormScreen } from './src/screens/home/PlayerFormScreen';
import { PlayerDetailScreen } from './src/screens/home/PlayerDetailScreen';
import { MyTeamScreen } from './src/screens/home/MyTeamScreen';
import { MatchDetailScreen } from './src/screens/home/MatchDetailScreen';
import { PrivacySettingsScreen } from './src/screens/profile/PrivacySettingsScreen';
import { CreateGroupScreen } from './src/screens/admin/CreateGroupScreen';
import { CreateGroupsFlowScreen } from './src/screens/admin/CreateGroupsFlowScreen';
import { EditGroupScreen } from './src/screens/admin/EditGroupScreen';
import { FixtureManagementScreen } from './src/screens/admin/FixtureManagementScreen';
import { CreateRondaScreen } from './src/screens/admin/CreateRondaScreen';
import { CreateRondaFlowScreen } from './src/screens/admin/CreateRondaFlowScreen';
import { CreateRondaAmistosaScreen } from './src/screens/admin/CreateRondaAmistosaScreen';
import { RondasListScreen } from './src/screens/admin/RondasListScreen';
import { RondaDetailScreen } from './src/screens/admin/RondaDetailScreen';
import { EditPartidoScreen } from './src/screens/admin/EditPartidoScreen';
import { EditTeamScreen } from './src/screens/admin/EditTeamScreen';
import { EditRondaScreen } from './src/screens/admin/EditRondaScreen';
import { CreatePartidoScreen } from './src/screens/admin/CreatePartidoScreen';
import { CreateSponsorScreen } from './src/screens/admin/CreateSponsorScreen';
import { EditSponsorScreen } from './src/screens/admin/EditSponsorScreen';
import { TournamentAdminDashboardScreen } from './src/screens/admin/TournamentAdminDashboardScreen';
import { CreateTournamentAdminScreen } from './src/screens/admin/CreateTournamentAdminScreen';
import ResultPage from './src/screens/admin/ResultPage';
import { CreateTeamScreen } from './src/screens/admin/CreateTeamScreen';
import { BulkCreateTeamsScreen } from './src/screens/admin/BulkCreateTeamsScreen';
import { GrupoDetailScreen } from './src/screens/admin/GrupoDetailScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
          <NavigationContainer>
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
                animation: 'fade',
              }}
              initialRouteName="Splash"
            >
              {/* Splash */}
              <Stack.Screen name="Splash" component={SplashScreen} />
          
          {/* Auth Stack */}
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
          
          {/* Main App (Fans) */}
          <Stack.Screen name="Main" component={MainNavigator} />
          <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
          
          {/* Admin Flow - BASADO EN FLUJO.DOCX */}
          <Stack.Screen name="ManageCountries" component={ManageCountriesScreen} />
          <Stack.Screen name="EditCountry" component={EditCountryScreen} />
          <Stack.Screen name="TournamentAdminDashboard" component={TournamentAdminDashboardScreen} />
          <Stack.Screen name="CreateTournamentAdmin" component={CreateTournamentAdminScreen} />
          <Stack.Screen name="CountrySelection" component={CountrySelectionScreen} />
          <Stack.Screen name="AdminTournaments" component={AdminTournamentsScreen} />
          <Stack.Screen name="CreateTournament" component={CreateTournamentScreen} />
          <Stack.Screen name="TournamentDetails" component={TournamentDetailsScreen} />
          <Stack.Screen name="EditTournament" component={EditTournamentScreen} />
          <Stack.Screen name="EditEdition" component={EditEditionScreen} />
          <Stack.Screen name="ManageCategories" component={ManageCategoriesScreen} />
          <Stack.Screen name="CreateEdition" component={CreateEditionScreen} />
          <Stack.Screen name="TournamentCategories" component={TournamentCategoriesScreen} />
          <Stack.Screen name="CategoryManagement" component={CategoryManagementScreen} />
          
          {/* Category Management Options */}
          <Stack.Screen name="ManageTeams" component={ManageTeamsScreen} />
          <Stack.Screen name="ManageFixture" component={ManageFixtureScreen} />
          <Stack.Screen name="LoadResults" component={ResultPage} />
          
          {/* Group Management */}
          <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
          <Stack.Screen name="CreateGroupsFlow" component={CreateGroupsFlowScreen} />
          <Stack.Screen name="EditGroup" component={EditGroupScreen} />
          <Stack.Screen name="GrupoDetail" component={GrupoDetailScreen} />
          
          {/* Fixture Management */}
          <Stack.Screen name="FixtureManagement" component={FixtureManagementScreen} />
          <Stack.Screen name="RondasList" component={RondasListScreen} />
          <Stack.Screen name="RondaDetail" component={RondaDetailScreen} />
          <Stack.Screen name="CreateRondaFlow" component={CreateRondaFlowScreen} />
          <Stack.Screen name="CreateRonda" component={CreateRondaFlowScreen} />
          <Stack.Screen name="EditRonda" component={EditRondaScreen} />
          <Stack.Screen name="CreateRondaAmistosa" component={CreateRondaAmistosaScreen} />
          <Stack.Screen name="CreatePartido" component={CreatePartidoScreen} />
          <Stack.Screen name="EditPartido" component={EditPartidoScreen} />
          
          {/* Team Management */}
          <Stack.Screen name="EditTeam" component={EditTeamScreen} />
          <Stack.Screen name="CreateTeam" component={CreateTeamScreen} />
          <Stack.Screen name="BulkCreateTeams" component={BulkCreateTeamsScreen} />

          {/* Local & Cancha Management */}
          <Stack.Screen name="CreateLocal" component={CreateLocalScreen} />
          <Stack.Screen name="CreateCancha" component={CreateCanchaScreen} />
          <Stack.Screen name="EditLocal" component={EditLocalScreen} />
          <Stack.Screen name="EditCancha" component={EditCanchaScreen} />
          <Stack.Screen name="LocalDetail" component={LocalDetailScreen} />
          
          {/* Sponsor Management */}
          <Stack.Screen name="CreateSponsor" component={CreateSponsorScreen} />
          <Stack.Screen name="EditSponsor" component={EditSponsorScreen} />
          
          {/* Fase de Grupos & Rankings */}
          <Stack.Screen name="GroupStage" component={GroupStageScreen} />
          <Stack.Screen name="TheBest" component={TheBestScreen} />
          <Stack.Screen name="TeamDetail" component={TeamDetailScreen} />
          <Stack.Screen name="PlayerForm" component={PlayerFormScreen} />
          <Stack.Screen name="PlayerDetail" component={PlayerDetailScreen} />
          <Stack.Screen name="MyTeam" component={MyTeamScreen} />
          <Stack.Screen name="MatchDetail" component={MatchDetailScreen} />
          
          {/* Placeholders (Próximamente) */}
          <Stack.Screen name="ManageGroups" component={CategoryManagementScreen} />
          <Stack.Screen name="Standings" component={CategoryManagementScreen} />
          <Stack.Screen name="ManageKnockout" component={CategoryManagementScreen} />
        </Stack.Navigator>
      </NavigationContainer>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}