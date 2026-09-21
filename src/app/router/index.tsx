import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { Dashboard } from '../../features/surveys/Dashboard';
import { FacilityList } from '../../features/facilities/FacilityList';
import { SurveyHistory } from '../../features/surveys/SurveyHistory';
import { SurveyForm } from '../../features/surveys/SurveyForm';
import { Login } from '../../features/auth/Login';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'facilities', element: <FacilityList /> },
      { path: 'surveys/new', element: <SurveyForm /> },
      { path: 'surveys/history', element: <SurveyHistory /> },
      { path: 'profile', element: <div>Profile</div> },
    ],
  },
  {
    path: '/login',
    element: <Login />,
  }
]);
