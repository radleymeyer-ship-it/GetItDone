import { Redirect } from 'expo-router';

export default function UnmatchedRoute() {
  // If an unhandled route or email deep link opens, safely redirect home
  return <Redirect href="/" />;
}