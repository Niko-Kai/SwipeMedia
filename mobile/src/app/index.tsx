import { Redirect } from 'expo-router';

// First run always lands on 00 (P1 branches on permission state instead).
export default function Index() {
  return <Redirect href="/landing" />;
}
