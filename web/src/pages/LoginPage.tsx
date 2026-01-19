import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Users, Building2, ArrowLeft, UserPlus, Store, Sparkles } from 'lucide-react'

type UserRole = 'employee' | 'employer' | null

interface LoginPageProps {
  onLogin: (role: UserRole) => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [view, setView] = useState<'selection' | 'employee-login' | 'employer-login' | 'employee-register' | 'employer-register'>('selection')
  const [name, setName] = useState('')
  const [branchCode, setBranchCode] = useState('')
  const [branchName, setBranchName] = useState('')

  const handleEmployeeLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!email || !password) {
        setError('이메일과 비밀번호를 입력해주세요')
        setLoading(false)
        return
      }

      // 개발/테스트 모드: 로컬 스토리지 사용
      const isDemoMode = email === 'test@example.com' || password === 'password123'
      
      if (isDemoMode) {
        localStorage.setItem('alba_user', JSON.stringify({ 
          email, 
          role: 'employee',
          userId: 'demo-user-' + Math.random().toString(36).substr(2, 9),
          name: '테스트 근로자',
          timestamp: new Date().toISOString() 
        }))
        onLogin('employee')
        return
      }

      // 실제 Supabase 연결
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      if (data.user) {
        const { data: employee, error: employeeError } = await supabase
          .from('employees')
          .select('status')
          .eq('user_id', data.user.id)
          .single()

        if (employeeError) {
          throw new Error('직원 정보를 불러오는데 실패했습니다.')
        }

        if (employee.status === 'pending') {
          await supabase.auth.signOut()
          throw new Error('고용주의 승인을 기다려주세요.')
        } else if (employee.status === 'approved') {
          localStorage.setItem('alba_user', JSON.stringify({ 
            email, 
            role: 'employee',
            userId: data.user.id,
            timestamp: new Date().toISOString() 
          }))
          onLogin('employee')
        }
      }
    } catch (err: any) {
      setError(err.message || '로그인 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleEmployerLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!email || !password) {
        setError('이메일과 비밀번호를 입력해주세요')
        setLoading(false)
        return
      }

      // 개발/테스트 모드: 로컬 스토리지 사용
      const isDemoMode = email === 'employer@example.com' || password === 'password123'
      
      if (isDemoMode) {
        localStorage.setItem('alba_user', JSON.stringify({ 
          email, 
          role: 'employer',
          userId: 'demo-employer-' + Math.random().toString(36).substr(2, 9),
          branchName: '테스트 지점',
          timestamp: new Date().toISOString() 
        }))
        onLogin('employer')
        return
      }

      // 실제 Supabase 연결
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      if (data.user) {
        const { data: branch } = await supabase
          .from('branches')
          .select('id')
          .eq('employer_id', data.user.id)
          .single()

        if (!branch) {
          await supabase.auth.signOut()
          throw new Error('고용주 정보를 찾을 수 없습니다.')
        }

        localStorage.setItem('alba_user', JSON.stringify({ 
          email, 
          role: 'employer',
          userId: data.user.id,
          timestamp: new Date().toISOString() 
        }))
        onLogin('employer')
      }
    } catch (err: any) {
      setError(err.message || '로그인 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleEmployeeRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!email || !password || !name || !branchCode) {
        setError('모든 필드를 입력해주세요')
        setLoading(false)
        return
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) throw signUpError

      if (data.user) {
        const { error: insertError } = await supabase
          .from('employees')
          .insert({
            user_id: data.user.id,
            name,
            branch_code: branchCode,
            status: 'pending',
          })

        if (insertError) throw insertError

        setError('')
        alert('회원가입이 완료되었습니다. 고용주의 승인을 기다려주세요.')
        setView('employee-login')
      }
    } catch (err: any) {
      setError(err.message || '회원가입 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleEmployerRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!email || !password || !branchName) {
        setError('모든 필드를 입력해주세요')
        setLoading(false)
        return
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) throw signUpError

      if (data.user) {
        const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase()
        
        const { error: insertError } = await supabase
          .from('branches')
          .insert({
            employer_id: data.user.id,
            name: branchName,
            branch_code: generatedCode,
          })

        if (insertError) throw insertError

        setError('')
        alert(`회원가입이 완료되었습니다.\n지점 코드: ${generatedCode}\n직원들에게 이 코드를 공유해주세요.`)
        setView('employer-login')
      }
    } catch (err: any) {
      setError(err.message || '회원가입 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 선택 화면
  if (view === 'selection') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden p-4">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full filter blur-3xl opacity-30 animate-pulse-slow"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400 rounded-full filter blur-3xl opacity-30 animate-pulse-slow" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-300 rounded-full filter blur-3xl opacity-20 animate-pulse-slow" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="relative z-10 animate-fade-in w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-12 border border-gray-100">
            {/* Logo */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-28 h-28 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/40 mb-8">
                <span className="text-6xl">⏰</span>
              </div>
              <h1 className="text-5xl font-bold text-gray-800 mb-3 tracking-tight">알바체크</h1>
              <p className="text-gray-500 text-base">근태 및 급여 관리 플랫폼</p>
            </div>
            
            <p className="text-center text-gray-600 mb-10 text-base font-medium">어떤 유형으로 시작하시겠어요?</p>
            
            <div className="space-y-5">
              <button
                onClick={() => setView('employee-login')}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-5 rounded-2xl font-bold hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-lg shadow-blue-500/40 hover:shadow-xl hover:shadow-blue-500/50 btn-press flex items-center justify-center gap-4 text-xl"
              >
                <span className="text-4xl">👷</span> 알바생
              </button>
              <button
                onClick={() => setView('employer-login')}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-500 text-white py-5 rounded-2xl font-bold hover:from-emerald-600 hover:to-green-600 transition-all duration-300 shadow-lg shadow-green-500/40 hover:shadow-xl hover:shadow-green-500/50 btn-press flex items-center justify-center gap-4 text-xl"
              >
                <span className="text-4xl">🏪</span> 고용주
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 알바생 로그인
  if (view === 'employee-login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden p-4">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full filter blur-3xl opacity-30 animate-pulse-slow"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400 rounded-full filter blur-3xl opacity-30 animate-pulse-slow"></div>
        </div>
        
        <div className="relative z-10 animate-fade-in w-full max-w-[420px]">
          <div className="bg-white rounded-3xl shadow-2xl p-10 border border-gray-100">
            <button onClick={() => setView('selection')} className="text-gray-500 hover:text-gray-800 mb-6 flex items-center gap-2 transition-colors">
              <ArrowLeft size={20} />
              <span>뒤로가기</span>
            </button>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-4 shadow-lg shadow-blue-500/30">
                <Users size={32} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">알바생 로그인</h1>
              <p className="text-gray-500 mt-2">출퇴근 및 급여를 관리하세요</p>
            </div>

          <form onSubmit={handleEmployeeLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-400 transition-all"
                placeholder="이메일을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-400 transition-all"
                placeholder="비밀번호를 입력하세요"
              />
            </div>

            {error && <div className="text-red-600 text-sm bg-red-50 p-4 rounded-xl border border-red-200">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-2xl font-semibold hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 transition-all duration-300 shadow-lg shadow-blue-500/30 btn-press text-lg"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="mt-6 space-y-4">
            <div className="text-center">
              <button
                onClick={() => { setView('employee-register'); setError('') }}
                className="text-blue-600 hover:text-blue-800 text-sm transition-colors"
              >
                계정이 없나요? 회원가입
              </button>
            </div>
            
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-400 mb-3">💡 테스트 로그인</p>
              <button
                type="button"
                onClick={() => {
                  setEmail('test@example.com')
                  setPassword('password123')
                  setTimeout(() => {
                    handleEmployeeLogin(new Event('submit') as any)
                  }, 100)
                }}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl text-sm hover:bg-gray-200 transition-all border border-gray-200"
              >
                테스트 계정으로 접속
              </button>
            </div>
          </div>
          </div>
        </div>
      </div>
    )
  }

  // 고용주 로그인
  if (view === 'employer-login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 relative overflow-hidden p-4">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-400 rounded-full filter blur-3xl opacity-30 animate-pulse-slow"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-400 rounded-full filter blur-3xl opacity-30 animate-pulse-slow"></div>
        </div>
        
        <div className="relative z-10 animate-fade-in w-full max-w-[420px]">
          <div className="bg-white rounded-3xl shadow-2xl p-10 border border-gray-100">
            <button onClick={() => setView('selection')} className="text-gray-500 hover:text-gray-800 mb-6 flex items-center gap-2 transition-colors">
              <ArrowLeft size={20} />
              <span>뒤로</span>
            </button>
          
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 mb-4 shadow-lg shadow-emerald-500/30">
                <Building2 size={32} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">고용주 로그인</h1>
              <p className="text-gray-500 mt-2">매장 관리 시스템에 접속</p>
            </div>

            <form onSubmit={handleEmployerLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-800 placeholder-gray-400 transition-all"
                  placeholder="이메일을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-800 placeholder-gray-400 transition-all"
                  placeholder="비밀번호를 입력하세요"
                />
              </div>

              {error && <div className="text-red-600 text-sm bg-red-50 p-4 rounded-xl border border-red-200">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white py-4 rounded-2xl font-semibold hover:from-emerald-600 hover:to-green-700 disabled:opacity-50 transition-all duration-300 shadow-lg shadow-emerald-500/30 btn-press text-lg"
              >
                {loading ? '로그인 중...' : '로그인'}
              </button>
            </form>

            <div className="mt-6 space-y-4">
              <div className="text-center">
                <button
                  onClick={() => { setView('employer-register'); setError('') }}
                  className="text-emerald-600 hover:text-emerald-800 text-sm transition-colors"
                >
                  계정이 없나요? 회원가입
                </button>
              </div>
            
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400 mb-3">💡 테스트 로그인</p>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('employer@example.com')
                    setPassword('password123')
                    setTimeout(() => {
                      handleEmployerLogin(new Event('submit') as any)
                    }, 100)
                  }}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl text-sm hover:bg-gray-200 transition-all border border-gray-200"
                >
                  테스트 계정으로 접속
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 알바생 회원가입
  if (view === 'employee-register') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 relative overflow-hidden">
        {/* 배경 애니메이션 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full blur-3xl opacity-30 animate-pulse-slow" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400 rounded-full blur-3xl opacity-30 animate-pulse-slow" style={{ animationDelay: '1s' }} />
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md animate-fade-in relative z-10 border border-gray-100">
          <button onClick={() => setView('employee-login')} className="text-gray-500 hover:text-gray-800 mb-6 flex items-center gap-2 transition-colors">
            <ArrowLeft size={20} />
            <span>뒤로</span>
          </button>
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-4 shadow-lg shadow-blue-500/30">
              <UserPlus size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">알바생 회원가입</h1>
            <p className="text-gray-500 mt-2">새 계정을 만들어 시작하세요</p>
          </div>

          <form onSubmit={handleEmployeeRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-400 transition-all"
                placeholder="이름을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-400 transition-all"
                placeholder="이메일을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-400 transition-all"
                placeholder="비밀번호를 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">지점 코드</label>
              <input
                type="text"
                value={branchCode}
                onChange={(e) => setBranchCode(e.target.value)}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-400 transition-all"
                placeholder="고용주에게 받은 지점 코드"
              />
            </div>

            {error && <div className="text-red-600 text-sm bg-red-50 p-4 rounded-xl border border-red-200">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-2xl font-semibold hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 transition-all duration-300 shadow-lg shadow-blue-500/30 btn-press text-lg mt-2"
            >
              {loading ? '가입 중...' : '회원가입'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // 고용주 회원가입
  if (view === 'employer-register') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4 relative overflow-hidden">
        {/* 배경 애니메이션 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-400 rounded-full blur-3xl opacity-30 animate-pulse-slow" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-400 rounded-full blur-3xl opacity-30 animate-pulse-slow" style={{ animationDelay: '1s' }} />
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md animate-fade-in relative z-10 border border-gray-100">
          <button onClick={() => setView('employer-login')} className="text-gray-500 hover:text-gray-800 mb-6 flex items-center gap-2 transition-colors">
            <ArrowLeft size={20} />
            <span>뒤로</span>
          </button>
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 mb-4 shadow-lg shadow-emerald-500/30">
              <Store size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">고용주 회원가입</h1>
            <p className="text-gray-500 mt-2">매장을 등록하고 시작하세요</p>
          </div>

          <form onSubmit={handleEmployerRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">지점명</label>
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-800 placeholder-gray-400 transition-all"
                placeholder="지점/매장 이름을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-800 placeholder-gray-400 transition-all"
                placeholder="이메일을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-800 placeholder-gray-400 transition-all"
                placeholder="비밀번호를 입력하세요"
              />
            </div>

            {error && <div className="text-red-600 text-sm bg-red-50 p-4 rounded-xl border border-red-200">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white py-4 rounded-2xl font-semibold hover:from-emerald-600 hover:to-green-700 disabled:opacity-50 transition-all duration-300 shadow-lg shadow-emerald-500/30 btn-press text-lg mt-2"
            >
              {loading ? '가입 중...' : '회원가입'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return null
}
