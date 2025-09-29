"use client"

import { useAuth } from "@/contexts/auth-context"
import { Header } from "@/components/header"
import { ExamGenerator } from "@/components/exam-generator"
import { ExamHistory } from "@/components/dashboard/exam-history"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, TrendingUp, Clock, LogOut, Sparkles, History } from "lucide-react"
import { useState, useEffect } from "react"
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"



export function DashboardContent() {
  const { user, userProfile, logout } = useAuth()
  const [stats, setStats] = useState({
    totalExams: 0,
    thisMonth: 0,
    thisWeek: 0,
  })

  useEffect(() => {
    if (user) {
      loadStats()
    }
  }, [user])

  const loadStats = async () => {
    if (!user) return

    try {
      const q = query(collection(db, "exams"), where("userId", "==", user.uid))
      const querySnapshot = await getDocs(q)

      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))

      let totalExams = 0
      let thisMonth = 0
      let thisWeek = 0

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt)

        totalExams++

        if (createdAt >= startOfMonth) {
          thisMonth++
        }

        if (createdAt >= startOfWeek) {
          thisWeek++
        }
      })

      setStats({ totalExams, thisMonth, thisWeek })
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error)
    }
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Dashboard Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-balance">Bem-vindo, Professor(a) {userProfile?.name || user?.displayName}!</h1>
              <p className="text-muted-foreground mt-1">Crie provas personalizadas com inteligência artificial</p>
            </div>
            <Button className="cursor-pointer" variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-[#009e96]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2  text-white">
              <CardTitle className="text-sm font-medium  ">PROVAS GERADAS</CardTitle>
              <FileText className=" text-white" />
            </CardHeader>
            <CardContent className=" text-white">
              <div className="text-2xl font-bold">{stats.totalExams}</div>
              <p className="text-xs  text-white ">Total de provas criadas</p>
            </CardContent>
          </Card>

          <Card className="bg-[#4e66ba]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 text-white">
              <CardTitle className="text-sm font-medium">ESTE MÊS</CardTitle>
              <TrendingUp className="text-white" />
            </CardHeader>
            <CardContent className="text-white">
              <div className="text-2xl font-bold">{stats.thisMonth}</div>
              <p className="text-xs text-white">
                Provas geradas em {new Date().toLocaleDateString("pt-BR", { month: "long" })}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#0086bf]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 text-white">
              <CardTitle className="text-sm font-medium">CONTA CRIADA</CardTitle>
              <Clock className="text-white" />
            </CardHeader>
            <CardContent className=" text-white">
              <div className="text-2xl font-bold">
                {userProfile?.createdAt
                  ? new Date(userProfile.createdAt.seconds * 1000).toLocaleDateString("pt-BR")
                  : "Hoje"}
              </div>
              <p className="text-xs text-muted-foreground">
                <Badge variant="secondary" className="text-xs">
                  {userProfile?.role === "professor" ? "Professor" : "Usuário"}
                </Badge>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content with Tabs */}
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="generator" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="generator" className="flex items-center gap-2 cursor-pointer">
                <Sparkles className="w-4 h-4" />
                Gerar Nova Prova
              </TabsTrigger >
              <TabsTrigger value="history" className="flex items-center gap-2  cursor-pointer">
                <History className="w-4 h-4" />
                Histórico de Provas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="generator">
              <ExamGenerator />
            </TabsContent>

            <TabsContent value="history">
              <ExamHistory />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
