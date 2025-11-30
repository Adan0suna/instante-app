import { CheckCircle2, HardDrive, Cloud, Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { cn } from "../lib/utils"
import { useStorage } from "../hooks/useStorage"
import type { StorageProviderType } from "../lib/storage/types"

type StorageProviderSelectorProps = {
  showCredentials?: boolean
}

type ProviderConfig = {
  id: StorageProviderType
  title: string
  description: string
  helper: string
  icon: typeof Cloud
  accent: string
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: "google-drive",
    title: "Google Drive",
    description: "Conecta tu cuenta para guardar clips y automatizar la subida.",
    helper: "Necesitas autorizar la app de Instante con tu cuenta de Google.",
    icon: Cloud,
    accent: "text-blue-600",
  },
  {
    id: "mega",
    title: "MEGA",
    description: "Usa tus credenciales para subir videos directamente a MEGA.",
    helper: "Introduce correo y contraseña de una cuenta dedicada para mayor seguridad.",
    icon: HardDrive,
    accent: "text-purple-600",
  },
]

export function StorageProviderSelector({ showCredentials = false }: StorageProviderSelectorProps) {
  const { provider, credentials, updateProvider, hasCredentials } = useStorage()

  const hasProviderCredentials = (id: StorageProviderType) => {
    if (id === "google-drive") {
      return !!credentials.googleDrive?.access_token
    }
    if (id === "mega") {
      return !!credentials.mega?.email && !!credentials.mega?.password
    }
    return false
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Proveedor de almacenamiento</CardTitle>
        <CardDescription>Selecciona dónde quieres guardar tus grabaciones.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {PROVIDERS.map((item) => {
            const Icon = item.icon
            const isActive = provider === item.id
            const configured = hasProviderCredentials(item.id)

            return (
              <div
                key={item.id}
                onClick={() => updateProvider(item.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    updateProvider(item.id)
                  }
                }}
                role="button"
                tabIndex={0}
                className={cn(
                  "flex h-full flex-col gap-4 rounded-xl border p-4 text-left transition",
                  isActive ? "border-blue-500 bg-blue-50/60 dark:bg-slate-900/40" : "border-border hover:border-blue-300"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={cn("h-6 w-6", item.accent)} />
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  {configured && (
                    <Badge className="bg-emerald-500/90 text-white gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Configurado
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">{item.helper}</p>

                <div className="flex justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {isActive ? "Seleccionado" : "Seleccionar"}
                  </span>
                  <Button type="button" size="sm" variant={isActive ? "default" : "outline"}>
                    {isActive ? "Activo" : "Usar"}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {showCredentials && (
          <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <Shield className="h-4 w-4" />
              <span className="font-medium">Estado del proveedor seleccionado</span>
            </div>
            <p>
              {hasCredentials()
                ? "Ya registraste credenciales para este proveedor. Puedes actualizar o revocar el acceso desde las tarjetas superiores."
                : "Aún no hay credenciales guardadas. Completa la conexión para habilitar las subidas automáticas."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

