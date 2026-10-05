import { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SplashScreen from "../screens/SplashScreen";
import WelcomeScreen from "../screens/WelcomeScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import PendingScreen from "../screens/PendingScreen";
import HomeScreen from "../screens/HomeScreen";
import ChatListScreen from "../screens/ChatListScreen";
import ChatThreadScreen from "../screens/ChatThreadScreen";
import BooksListScreen from "../screens/BooksListScreen";
import BookReaderScreen from "../screens/BookReaderScreen";
import AmasomoListScreen from "../screens/AmasomoListScreen";
import VideoWatchScreen from "../screens/VideoWatchScreen";
import IfaidaListScreen from "../screens/IfaidaListScreen";
import IfaidaDetailScreen from "../screens/IfaidaDetailScreen";
import ExamListScreen from "../screens/ExamListScreen";
import ExamTakeScreen from "../screens/ExamTakeScreen";
import ExamResultScreen from "../screens/ExamResultScreen";
import LiveClassListScreen from "../screens/LiveClassListScreen";
import LiveClassScreen from "../screens/LiveClassScreen";
import { useAuth } from "../context/AuthContext";

const Stack = createNativeStackNavigator();

/**
 * Shows the splash until BOTH the 5-second minimum has elapsed AND the
 * auth check has resolved -- whichever takes longer. A fast device on a
 * slow network shouldn't flash a logged-out Welcome screen for half a
 * second before correcting itself once the real session loads; a
 * logged-in user should land straight on Home, never seeing Welcome at
 * all.
 */
export default function RootNavigator() {
  const { user, loading: authLoading } = useAuth();
  const [splashElapsed, setSplashElapsed] = useState(false);

  if (authLoading || !splashElapsed) {
    return <SplashScreen onElapsed={() => setSplashElapsed(true)} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={user ? "Home" : "Welcome"}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Pending" component={PendingScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Chat" component={ChatListScreen} />
        <Stack.Screen name="ChatThread" component={ChatThreadScreen} />
        <Stack.Screen name="Books" component={BooksListScreen} />
        <Stack.Screen name="BookReader" component={BookReaderScreen} />
        <Stack.Screen name="Amasomo" component={AmasomoListScreen} />
        <Stack.Screen name="VideoWatch" component={VideoWatchScreen} options={{ animation: "fade" }} />
        <Stack.Screen name="Ifaida" component={IfaidaListScreen} />
        <Stack.Screen name="IfaidaDetail" component={IfaidaDetailScreen} />
        <Stack.Screen name="Exams" component={ExamListScreen} />
        <Stack.Screen name="ExamTake" component={ExamTakeScreen} options={{ gestureEnabled: false }} />
        <Stack.Screen name="ExamResult" component={ExamResultScreen} options={{ gestureEnabled: false }} />
        <Stack.Screen name="LiveClassList" component={LiveClassListScreen} />
        <Stack.Screen name="LiveClass" component={LiveClassScreen} options={{ gestureEnabled: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
