"use client"

import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import { Button } from "../components/ui/button"
import {
  Home,
  Video,
  Settings,
  HelpCircle,
  Youtube,
  FileVideo,
  Camera,
  LogIn,
} from "lucide-react"

const items = [
  {
    title: "Inicio",
    href: "/",
    icon: Home,
  },
  {
    title: "Grabar",
    href: "/grabar",
    icon: Camera,
  },
  {
    title: "Partidos",
    href: "/partidos",
    icon: Video,
  },
  {
    title: "Videos",
    href: "/videos",
    icon: FileVideo,
  },
  {
    title: "YouTube",
    href: "/youtube",
    icon: Youtube,
  },
  {
    title: "Almacenamiento en la nube",
    href: "/conectar-drive",
    icon: LogIn,
  },
  {
    title: "Configuración",
    href: "/configuracion",
    icon: Settings,
  },
  {
    title: "Ayuda",
    href: "/ayuda",
    icon: HelpCircle,
  },

]

export function SidebarNav() {
  const location = useLocation()

  const isActive = (href: string) => {
    return location.pathname === href
  }

  return (
    <div className="fixed left-0 top-0 h-screen w-16 md:w-64 bg-[#1A3C34] border-r border-[#000000]/20 flex flex-col z-50">
      <div className="p-4 border-b border-[#000000]/20">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-[#D4AF37] w-8 h-8 rounded-md flex items-center justify-center">
            <span className="font-bold text-black">I</span>
          </div>
          <span className="font-bold text-white hidden md:block">Instante</span>
        </Link>
      </div>

      <nav className="flex-1 p-2">
        <div className="space-y-1">
          {items.map((item) => (
            <Link key={item.href} to={item.href}>
              <Button
                variant="ghost"
                className={`w-full justify-start text-white hover:bg-white/10 ${
                  isActive(item.href) ? "bg-white/20" : ""
                }`}
              >
                <item.icon className="h-5 w-5 md:mr-2" />
                <span className="hidden md:block">{item.title}</span>
              </Button>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
} 