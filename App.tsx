import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { StatusBar } from "react-native"
import AuthScreen from "./src/screens/AuthScreen"
import OnboardingScreen from "./src/screens/OnboardingScreen"
import MainApp from "./src/screens/MainApp" // Ensure MainApp is imported

export type RootStackParamList = {
  Auth: undefined
  Onboarding: { user: any }
  Main: { user: any }
}

const Stack = createStackNavigator<RootStackParamList>()

const App = (): JSX.Element => {
  return (
    <NavigationContainer>
      <StatusBar backgroundColor="#3b2e00" barStyle="light-content" />
      <Stack.Navigator
        initialRouteName="Auth"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Main" component={MainApp} /> {/* Ensure MainApp is used */}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default App
