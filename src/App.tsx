import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import Home from '@/pages/Home'
import Assessment from '@/pages/Assessment'
import AssessmentSleep from '@/pages/AssessmentSleep'
import AssessmentMenopause from '@/pages/AssessmentMenopause'
import AssessmentResult from '@/pages/AssessmentResult'
import CarePlan from '@/pages/CarePlan'
import Activities from '@/pages/Activities'
import ActivityDetail from '@/pages/ActivityDetail'
import MyActivities from '@/pages/MyActivities'
import Resources from '@/pages/Resources'
import ResourceDetail from '@/pages/ResourceDetail'
import CareChannel from '@/pages/CareChannel'
import Feedback from '@/pages/Feedback'
import Admin from '@/pages/Admin'
import AdminDashboard from '@/pages/AdminDashboard'
import AdminActivities from '@/pages/AdminActivities'
import AdminFeedback from '@/pages/AdminFeedback'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      {
        path: 'assessment',
        children: [
          { index: true, element: <Assessment /> },
          { path: 'sleep', element: <AssessmentSleep /> },
          { path: 'menopause', element: <AssessmentMenopause /> },
          { path: 'result/:id', element: <AssessmentResult /> },
        ],
      },
      { path: 'care-plan', element: <CarePlan /> },
      {
        path: 'activities',
        children: [
          { index: true, element: <Activities /> },
          { path: 'my', element: <MyActivities /> },
          { path: ':id', element: <ActivityDetail /> },
        ],
      },
      {
        path: 'resources',
        children: [
          { index: true, element: <Resources /> },
          { path: ':id', element: <ResourceDetail /> },
        ],
      },
      { path: 'care-channel', element: <CareChannel /> },
      { path: 'feedback', element: <Feedback /> },
      {
        path: 'admin',
        children: [
          { index: true, element: <Admin /> },
          { path: 'dashboard', element: <AdminDashboard /> },
          { path: 'activities', element: <AdminActivities /> },
          { path: 'feedback', element: <AdminFeedback /> },
        ],
      },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
