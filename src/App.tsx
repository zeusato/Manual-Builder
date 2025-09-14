// src/App.tsx
import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

const Intro = React.lazy(() => import('./pages/Intro'))
const ManualAppPage = React.lazy(() => import('./pages/ManualAppPage'))
const ManualWebPage = React.lazy(() => import('./pages/ManualWebPage'))

const router = createBrowserRouter(
  [
    { path: '/', element: <Intro /> },
    { path: '/manual/app', element: <ManualAppPage /> },
    { path: '/manual/web', element: <ManualWebPage /> },
    { path: '*', element: <Intro /> },
  ],
  { basename: import.meta.env.BASE_URL || '/' }
)

export default function App() {
  return (
    <React.Suspense fallback={<div className="p-6">Đang tải…</div>}>
      <RouterProvider router={router} />
    </React.Suspense>
  )
}
