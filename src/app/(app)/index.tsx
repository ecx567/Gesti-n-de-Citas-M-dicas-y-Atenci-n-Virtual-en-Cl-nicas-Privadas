import { Redirect } from 'expo-router';

/**
 * Root index of the app group — redirects to the patient home screen.
 * The file at (patient)/home.tsx is what actually renders inside the Home tab.
 */
export default function AppIndex() {
  return <Redirect href="/(app)/(patient)/home" />;
}
