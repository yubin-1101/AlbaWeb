import React, { useState, useEffect } from 'react'
import LoginPage from './pages/LoginPage'
import EmployeeDashboardPage from './pages/EmployeeDashboardPage'
import EmployerDashboardPage from './pages/EmployerDashboardPage'
import ProfilePage from './pages/ProfilePage'
import SchedulePage from './pages/SchedulePage'
import QRPage from './pages/QRPage'
import Navigation from './components/Navigation'
import './App.css'

type UserRole = 'employee' | 'employer' | null

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('App mounted')
    const user = localStorage.getItem('alba_user')
    console.log('User from storage:', user)
    if (user) {
      const userData = JSON.parse(user)
      setIsLoggedIn(true)
      setUserRole(userData.role || 'employee')
    }
    setLoading(false)
  }, [])

  const handleLogin = (role: UserRole) => {
    setIsLoggedIn(true)
    setUserRole(role)
    setCurrentPage('dashboard')
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUserRole(null)
    setCurrentPage('dashboard')
  }

  console.log('App rendering:', { isLoggedIn, loading, userRole })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-500 to-indigo-600">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
          <div className="text-xl text-white font-medium">로딩 중...</div>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />
  }

  const renderPage = () => {
    if (userRole === 'employer') {
      switch (currentPage) {
        case 'dashboard':
          return <EmployerDashboardPage />
        case 'qr':
          return <QRPage userRole={userRole} />
        case 'employees':
          return <EmployerDashboardPage />
        case 'profile':
          return <ProfilePage />
        default:
          return <EmployerDashboardPage />
      }
    } else {
      switch (currentPage) {
        case 'dashboard':
          return <EmployeeDashboardPage />
        case 'qr':
          return <QRPage userRole={userRole} />
        case 'schedule':
          return <SchedulePage />
        case 'profile':
          return <ProfilePage />
        default:
          return <EmployeeDashboardPage />
      }
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Navigation 
        onLogout={handleLogout}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        userRole={userRole}
      />
      <main className="flex-1 overflow-auto">
        {renderPage()}
      </main>
    </div>
  )
}
