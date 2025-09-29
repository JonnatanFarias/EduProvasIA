"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Download, Search, Calendar } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { collection, query, where, orderBy, getDocs, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface ExamHistoryItem {
  id: string
  title: string
  subject: string
  grade: string
  difficulty: string
  questionCount: number
  createdAt: Date
  questions: any[]
}

export function ExamHistory() {
  const { user } = useAuth()
  const [exams, setExams] = useState<ExamHistoryItem[]>([])
  const [filteredExams, setFilteredExams] = useState<ExamHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [difficultyFilter, setDifficultyFilter] = useState("all")

  useEffect(() => {
    if (user) {
      loadExamHistory()
    }
  }, [user])

  useEffect(() => {
    filterExams()
  }, [exams, searchTerm, subjectFilter, difficultyFilter])

  const loadExamHistory = async () => {
    if (!user) return

    try {
      const q = query(collection(db, "exams"), where("userId", "==", user.uid), orderBy("createdAt", "desc"))

      const querySnapshot = await getDocs(q)
      const examsList: ExamHistoryItem[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        examsList.push({
          id: doc.id,
          title: data.title,
          subject: data.subject,
          grade: data.grade,
          difficulty: data.difficulty,
          questionCount: data.questions?.length || 0,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          questions: data.questions || [],
        })
      })

      setExams(examsList)
    } catch (error) {
      console.error("Erro ao carregar histórico:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterExams = () => {
    let filtered = exams

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(
        (exam) =>
          exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          exam.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          exam.grade.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filtro por disciplina
    if (subjectFilter !== "all") {
      filtered = filtered.filter((exam) => exam.subject.toLowerCase().includes(subjectFilter.toLowerCase()))
    }

    // Filtro por dificuldade
    if (difficultyFilter !== "all") {
      filtered = filtered.filter((exam) => exam.difficulty.toLowerCase().includes(difficultyFilter.toLowerCase()))
    }

    setFilteredExams(filtered)
  }

  const downloadExam = async (exam: ExamHistoryItem, format: "pdf" | "docx") => {
    try {
      const response = await fetch(`/api/download-${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exam),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${exam.title.replace(/[^a-zA-Z0-9]/g, "_")}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error(`Erro ao baixar ${format.toUpperCase()}:`, error)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "fácil":
        return "bg-green-100 text-green-800"
      case "médio":
        return "bg-yellow-100 text-yellow-800"
      case "difícil":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Histórico de Provas
        </CardTitle>
        <CardDescription>Visualize e baixe suas provas geradas anteriormente ({exams.length} provas)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, disciplina ou série..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="w-full md:w-48 cursor-pointer">
              <SelectValue placeholder="Filtrar por disciplina" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem className="cursor-pointer" value="all">Todas as disciplinas</SelectItem>
              <SelectItem className="cursor-pointer" value="matemática">Matemática</SelectItem>
              <SelectItem className="cursor-pointer" value="português">Português</SelectItem>
              <SelectItem className="cursor-pointer" value="história">História</SelectItem>
              <SelectItem className="cursor-pointer" value="geografia">Geografia</SelectItem>
              <SelectItem className="cursor-pointer" value="ciências">Ciências</SelectItem>
              <SelectItem className="cursor-pointer" value="física">Física</SelectItem>
              <SelectItem className="cursor-pointer" value="química">Química</SelectItem>
              <SelectItem className="cursor-pointer" value="biologia">Biologia</SelectItem>
              <SelectItem className="cursor-pointer" value="inglês">Inglês</SelectItem>
              <SelectItem className="cursor-pointer" value="artes">Artes</SelectItem>
              <SelectItem className="cursor-pointer" value="ensinoReligioso">Ensino Religioso</SelectItem>
            </SelectContent>
          </Select>
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-full md:w-48 cursor-pointer">
              <SelectValue placeholder="Filtrar por dificuldade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem className="cursor-pointer" value="all">Todas as dificuldades</SelectItem>
              <SelectItem className="cursor-pointer" value="fácil">Fácil</SelectItem>
              <SelectItem className="cursor-pointer" value="médio">Médio</SelectItem>
              <SelectItem className="cursor-pointer" value="difícil">Difícil</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista de provas */}
        {filteredExams.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {exams.length === 0 ? "Nenhuma prova gerada ainda" : "Nenhuma prova encontrada"}
            </h3>
            <p className="text-muted-foreground">
              {exams.length === 0
                ? "Crie sua primeira prova usando o gerador acima."
                : "Tente ajustar os filtros de busca."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExams.map((exam) => (
              <Card key={exam.id} className="border">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{exam.title}</h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline">{exam.subject}</Badge>
                        <Badge variant="outline">{exam.grade}</Badge>
                        <Badge variant="secondary" className={getDifficultyColor(exam.difficulty)}>
                          {exam.difficulty}
                        </Badge>
                        <Badge variant="outline">{exam.questionCount} questões</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        Criada em {exam.createdAt.toLocaleDateString("pt-BR")} às{" "}
                        {exam.createdAt.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button className="cursor-pointer" variant="outline" size="sm" onClick={() => downloadExam(exam, "pdf")}>
                        <Download className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
                      <Button className="cursor-pointer" variant="outline" size="sm" onClick={() => downloadExam(exam, "docx")}>
                        <FileText className="w-4 h-4 mr-2" />
                        DOCX
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
