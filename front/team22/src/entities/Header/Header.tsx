import { useNavigate } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import T1logo from "@entities/Header/assets/T1 logo white.svg?react"
import { useAuthStore } from "@shared/store/auth"

type HeaderProps = {
  officeName: string | undefined
}

export default function Header({ officeName }: HeaderProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  let text = ""
  if (officeName !== undefined && officeName !== "") {
    text = `Офис: "${officeName}"`
  }

  const handleLogout = () => {
    logout()
    navigate("/auth")
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <header className="fixed top-0 left-0 w-full bg-[#2F80ED] h-[60px] z-[2000]">
      <div className="flex items-center justify-between h-full px-10 ">
        <div className="w-1/3">
          <div className="relative" ref={menuRef}>
            <div
              className="text-white cursor-pointer hover:text-gray-200 transition-colors"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <span className="text-[#2F80ED] font-bold text-sm">
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                  </span>
                </div>
                <span className="text-sm font-medium">
                  {user?.name || user?.email || "Пользователь"}
                </span>
              </div>
            </div>

            {/* Выпадающее меню */}
            {showUserMenu && (
              <div className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-lg py-2 min-w-[200px] z-50">
                <div className="px-4 py-2 border-b border-gray-200">
                  <div className="text-sm text-gray-600">{user?.email}</div>
                  {user?.role && (
                    <div className="text-xs text-gray-500">{user.role}</div>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors"
                >
                  Выйти
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Центр — название офиса */}
        <div className="w-1/3 flex justify-center">
          <p className="font-bold text-white text-3xl tracking-wide drop-shadow-lg">
            {text}
          </p>
        </div>

        {/* Правая часть — кнопка и пользователь */}
        <div className="w-1/3 flex justify-end items-center gap-4 pr-8">
          <p
            className="font-bold text-white text-3xl cursor-pointer flex items-center gap-2 transition-colors"
            onClick={() => navigate("/")}
          >
            {/* <T1logo className="w-15 h-15" /> */}
            Office Map
          </p>
        </div>
      </div>
    </header>
  )
}
