import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { UserProvider } from './context/UserContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import HomeScreen from './screens/HomeScreen';
import QuizScreen from './screens/QuizScreen';
import ChatbotScreen from './screens/ChatbotScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import AlertsScreen from './screens/AlertsScreen';
import TasksScreen from './screens/TasksScreen';
import KitBuilderScreen from './screens/KitBuilderScreen';
import FloodRunnerScreen from './screens/FloodRunnerScreen';
import StoryScreen from './screens/StoryScreen';
import SettingsScreen from './screens/SettingsScreen';
import ResourceHubScreen from './screens/ResourceHubScreen';
import AudioPlayerScreen from './screens/AudioPlayerScreen';
import LearningPathScreen from './screens/LearningPathScreen';
import LessonScreen from './screens/LessonScreen';
import FirstAidScreen from './screens/FirstAidScreen';
import FirstAidGuideScreen from './screens/FirstAidGuideScreen';
import ArticleReaderScreen from './screens/ArticleReaderScreen';
import SeniorArticleReaderScreen from './screens/SeniorArticleReaderScreen';
import KnowledgeCheckScreen from './screens/KnowledgeCheckScreen';
import KnowledgeCheckQuizScreen from './screens/KnowledgeCheckQuizScreen';
import ProfileScreen from './screens/ProfileScreen';
import EscapeRouteScreen from './screens/EscapeRouteScreen';
import StepSorterScreen from './screens/StepSorterScreen';
import SafeHouseBuilderScreen from './screens/SafeHouseBuilderScreen';
import DispatchHeroScreen from './screens/DispatchHeroScreen';
import FamilyPlanBuilderScreen from './screens/FamilyPlanBuilderScreen';
import WeatherScreen from './screens/WeatherScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { theme, themeName } = useTheme();

  const navTheme = {
    ...(themeName === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(themeName === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.bg,
      card: theme.headerBg,
      text: theme.text,
      border: theme.border,
      primary: themeName === 'dark' ? '#0EA5E9' : '#1E3A8A'
    }
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ animation: 'slide_from_right', animationDuration: 280 }}>
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Log In', animation: 'fade' }} />
        <Stack.Screen name="Signup" component={SignupScreen} options={{ title: 'Sign Up' }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Home', animation: 'fade' }} />
        <Stack.Screen name="Quiz" component={QuizScreen} options={{ title: 'Quiz' }} />
        <Stack.Screen name="Chatbot" component={ChatbotScreen} options={{ title: 'Ask DisasterReady', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="Leaderboard" component={LeaderboardScreen} options={{ title: 'Leaderboard' }} />
        <Stack.Screen name="Alerts" component={AlertsScreen} options={{ title: 'Alerts' }} />
        <Stack.Screen name="Tasks" component={TasksScreen} options={{ title: 'Daily Tasks' }} />
        <Stack.Screen name="KitBuilder" component={KitBuilderScreen} options={{ title: 'Rescue Missions', animation: 'fade' }} />
        <Stack.Screen name="FloodRunner" component={FloodRunnerScreen} options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="Story" component={StoryScreen} options={{ title: 'Story Mode', animation: 'fade' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="Resources" component={ResourceHubScreen} options={{ title: 'Resource Hub' }} />
        <Stack.Screen name="AudioPlayer" component={AudioPlayerScreen} options={{ title: 'Listen & Learn' }} />
        <Stack.Screen name="LearningPath" component={LearningPathScreen} options={{ title: 'Learning Path' }} />
        <Stack.Screen name="Lesson" component={LessonScreen} options={{ headerShown: false }} />
        <Stack.Screen name="FirstAid" component={FirstAidScreen} options={{ title: 'First Aid' }} />
        <Stack.Screen name="FirstAidGuide" component={FirstAidGuideScreen} options={{ title: 'Guide' }} />
        <Stack.Screen name="ArticleReader" component={ArticleReaderScreen} options={{ title: 'Article' }} />
        <Stack.Screen name="SeniorArticleReader" component={SeniorArticleReaderScreen} options={{ title: 'Article', headerShown: false }} />
        <Stack.Screen name="KnowledgeCheck" component={KnowledgeCheckScreen} options={{ title: 'Knowledge Check' }} />
        <Stack.Screen name="KnowledgeCheckQuiz" component={KnowledgeCheckQuizScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="EscapeRoute" component={EscapeRouteScreen} options={{ title: 'Escape Route', animation: 'fade' }} />
        <Stack.Screen name="StepSorter" component={StepSorterScreen} options={{ title: 'Step Sorter', animation: 'fade' }} />
        <Stack.Screen name="SafeHouse" component={SafeHouseBuilderScreen} options={{ title: 'Safe House', animation: 'fade' }} />
        <Stack.Screen name="DispatchHero" component={DispatchHeroScreen} options={{ title: 'Dispatch Hero', animation: 'fade' }} />
        <Stack.Screen name="FamilyPlanBuilder" component={FamilyPlanBuilderScreen} options={{ title: 'Family Plan', animation: 'fade' }} />
        <Stack.Screen name="Weather" component={WeatherScreen} options={{ title: 'Weather' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AccessibilityProvider>
        <ThemeProvider>
          <AppNavigator />
        </ThemeProvider>
      </AccessibilityProvider>
    </UserProvider>
  );
}