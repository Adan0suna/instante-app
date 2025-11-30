"use client"

import * as React from "react"
import { SidebarNav } from "../components/SidebarNav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion"
import { HelpCircle, Book, Mail, Video, Settings, Share2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"

export default function AyudaPage() {
  return (
    <div className="flex-1">
      <div className="flex-1">
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Ayuda y Soporte</h1>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6">
          <div className="space-y-6">
            {/* Hero Section */}
            <div className="rounded-lg bg-gradient-to-r from-[#1A3C34] to-[#D4AF37] p-8 text-white">
              <h2 className="text-3xl font-bold mb-4">¿Cómo podemos ayudarte?</h2>
              <p className="text-lg mb-6">Encuentra respuestas rápidas a tus preguntas o contacta con nuestro equipo de soporte.</p>
              <div className="flex gap-4">
                <Input placeholder="Buscar en la ayuda..." className="max-w-md bg-white/10 border-white/20 text-white placeholder:text-white/60" />
                <Button className="bg-[#D4AF37] text-[#1A3C34] hover:bg-[#D4AF37]/90">Buscar</Button>
              </div>
            </div>

            <Tabs defaultValue="faq" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="faq" className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  Preguntas Frecuentes
                </TabsTrigger>
                <TabsTrigger value="tutoriales" className="flex items-center gap-2">
                  <Book className="h-4 w-4" />
                  Tutoriales
                </TabsTrigger>
                <TabsTrigger value="contacto" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Contacto
                </TabsTrigger>
              </TabsList>

              <TabsContent value="faq">
                <Card>
                  <CardHeader>
                    <CardTitle>Preguntas Frecuentes</CardTitle>
                    <CardDescription>Respuestas a las preguntas más comunes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="item-1">
                        <AccordionTrigger>¿Cómo inicio una nueva grabación?</AccordionTrigger>
                        <AccordionContent>
                          Para iniciar una nueva grabación, ve a la página principal y haz clic en el botón "Nueva Grabación". 
                          Selecciona la fuente de video y audio, ajusta la calidad y haz clic en "Iniciar Grabación".
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-2">
                        <AccordionTrigger>¿Qué formatos de video soporta la aplicación?</AccordionTrigger>
                        <AccordionContent>
                          Instante soporta los formatos más comunes como MP4, MOV y AVI. Puedes configurar tu formato preferido 
                          en la sección de Configuración.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-3">
                        <AccordionTrigger>¿Cómo comparto mis grabaciones?</AccordionTrigger>
                        <AccordionContent>
                          Puedes compartir tus grabaciones de varias formas: generando un enlace, exportando el archivo o 
                          compartiendo directamente a través de plataformas integradas.
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tutoriales">
                <Card>
                  <CardHeader>
                    <CardTitle>Tutoriales</CardTitle>
                    <CardDescription>Aprende a usar Instante con nuestros tutoriales paso a paso</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Video className="h-4 w-4 text-blue-600" />
                            </div>
                            <h3 className="font-medium">Primera grabación</h3>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">Aprende los conceptos básicos para iniciar tu primera grabación de partido.</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">⏱️ 5 min</span>
                            <Button variant="outline" size="sm">Ver tutorial</Button>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <Settings className="h-4 w-4 text-green-600" />
                            </div>
                            <h3 className="font-medium">Configurar cámara</h3>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">Configura tu cámara y ajusta la calidad de video para mejores resultados.</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">⏱️ 3 min</span>
                            <Button variant="outline" size="sm">Ver tutorial</Button>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                              <Share2 className="h-4 w-4 text-yellow-600" />
                            </div>
                            <h3 className="font-medium">Subir a YouTube</h3>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">Conecta tu cuenta de YouTube y sube videos directamente desde Instante.</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">⏱️ 7 min</span>
                            <Button variant="outline" size="sm">Ver tutorial</Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contacto">
                <Card>
                  <CardHeader>
                    <CardTitle>Contacto</CardTitle>
                    <CardDescription>¿No encuentras lo que buscas? Contáctanos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <label htmlFor="email" className="text-sm font-medium">Correo electrónico</label>
                        <Input id="email" type="email" placeholder="tu@email.com" />
                      </div>
                      <div className="grid gap-2">
                        <label htmlFor="subject" className="text-sm font-medium">Asunto</label>
                        <Input id="subject" placeholder="¿En qué podemos ayudarte?" />
                      </div>
                      <div className="grid gap-2">
                        <label htmlFor="message" className="text-sm font-medium">Mensaje</label>
                        <Textarea id="message" placeholder="Describe tu problema o consulta..." className="min-h-[100px]" />
                      </div>
                      <Button>Enviar mensaje</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
        <footer className="border-t p-4 text-center text-sm text-muted-foreground">
          © 2024 Instante. Todos los derechos reservados.
        </footer>
      </div>
    </div>
  )
} 