import React from 'react'
import { Home, User, LogOut, Calendar, Users, LayoutDashboard, QrCode, Scan, Sparkles } from 'lucide-react'

type UserRole = 'employee' | 'employer' | null

interface NavigationProps {
  onLogout: () => void
  currentPage: string
  onPageChange: (page: string) => void
  userRole: UserRole
}

export default function Navigation({ onLogout, currentPage, onPageChange, userRole }: NavigationProps) {
  const handleLogout = async () => {
    localStorage.removeItem('alba_user')
    onLogout()
  }

  const isEmployer = userRole === 'employer'

  const isActive = (page: string) => 
    currentPage === page 
      ? isEmployer 
        ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-green-200' 
        : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-200'
      : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'

  const employeeMenuItems = [
    { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
    { id: 'qr', label: 'QR 출퇴근', icon: Scan },
    { id: 'schedule', label: '스케줄', icon: Calendar },
    { id: 'profile', label: '프로필', icon: User },
  ]

  const employerMenuItems = [
    { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
    { id: 'qr', label: 'QR 코드', icon: QrCode },
    { id: 'employees', label: '직원 관리', icon: Users },
    { id: 'profile', label: '프로필', icon: User },
  ]

  const menuItems = isEmployer ? employerMenuItems : employeeMenuItems

  return (
    <nav className={`w-72 p-6 flex flex-col glass border-r-0 ${
      isEmployer 
        ? 'bg-gradient-to-b from-emerald-50/80 via-white/90 to-green-50/80' 
        : 'bg-gradient-to-b from-blue-50/80 via-white/90 to-indigo-50/80'
    }`}>
      {/* Logo */}
      <div className="mb-10">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
            isEmployer 
              ? 'bg-gradient-to-br from-emerald-400 to-green-500 shadow-green-200' 
              : 'bg-gradient-to-br from-blue-400 to-indigo-500 shadow-blue-200'
          }`}>
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className={`text-2xl font-bold tracking-tight ${
              isEmployer ? 'gradient-text-green' : 'gradient-text-blue'
            }`}>
              알바체크
            </h1>
            <p className="text-xs text-gray-400 font-medium">
              {isEmployer ? 'Employer Portal' : 'Employee Portal'}
            </p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="space-y-2 flex-1">
        {menuItems.map((item, index) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 font-medium btn-press ${isActive(item.id)}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Icon size={22} strokeWidth={2} />
              <span className="text-[15px]">{item.label}</span>
            </button>
          )
        })}
      </div>

      {/* User Badge & Logout */}
      <div className="pt-6 border-t border-gray-200/50">
        <div className="mb-4 px-2">
          <div className={`inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-2xl font-semibold ${
            isEmployer 
              ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700' 
              : 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700'
          }`}>
            <span className="text-lg">{isEmployer ? '🏪' : '👷'}</span>
            <span>{isEmployer ? '고용주' : '알바생'}</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-5 py-4 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all duration-300 font-medium btn-press"
        >
          <LogOut size={22} strokeWidth={2} />
          <span className="text-[15px]">로그아웃</span>
        </button>
      </div>
    </nav>
  )
}
