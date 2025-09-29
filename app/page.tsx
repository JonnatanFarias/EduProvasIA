"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { GraduationCap, Sparkles, FileText, Download, LogIn } from "lucide-react"

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (user) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-5">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-16">
            <div className="mx-auto w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mb-8">
              <GraduationCap className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-5xl font-bold text-balance mb-6">Gerador de Provas com IA</h1>
            <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto mb-8">
              Crie provas personalizadas para seus alunos usando inteligência artificial. Selecione a série, disciplina,
              dificuldade e tipos de questões.
            </p>
            <div className="flex gap-4 justify-center">
              <Button className="cursor-pointer" size="lg" onClick={() => router.push("/login")}>
                <GraduationCap className="w-5 h-5 mr-2" />
                Começar Agora
              </Button>
              <Button className="cursor-pointer" size="lg" variant="outline" onClick={() => router.push("/login")}>
                <LogIn/>
                Fazer Login
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">IA Avançada</h3>
              <p className="text-muted-foreground">Questões geradas automaticamente com base no currículo escolar</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Múltiplos Formatos</h3>
              <p className="text-muted-foreground">Suporte a diversos tipos de questões e níveis de dificuldade</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Download className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Export Fácil</h3>
              <p className="text-muted-foreground">Baixe suas provas em PDF ou DOCX para impressão</p>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-card border-2 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">Pronto para começar?</h2>
            <p className="text-muted-foreground mb-6">
              Crie sua conta gratuita e comece a gerar provas personalizadas hoje mesmo.
            </p>
            <Button size="lg" onClick={() => router.push("/login")}>
              Criar Conta Gratuita
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
