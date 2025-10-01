"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sparkles, FileText, Download, Eye, AlertCircle, CheckIcon } from "lucide-react"
import { ExamPreview } from "./exam-preview"
import { useAuth } from "@/contexts/auth-context"
import { doc, updateDoc, increment, collection, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ExamConfig {
  grade: string
  subject: string
  difficulty: string
  questionTypes: string[]
  questionCount: number
  topics: string
  instructions: string
}

interface GeneratedExam {
  id?: string
  title: string
  subject: string
  grade: string
  difficulty: string
  questions: Array<{
    id: number
    type: string
    question: string
    options?: string[]
    correctAnswer: string
    explanation: string
  }>
  createdAt?: Date
  userId?: string
}

export function ExamGenerator() {
  const { user, userProfile } = useAuth()

  const [cooldown, setCooldown] = useState<number>(0) // segundos restantes

  // 🔹 Quando o componente carrega, calcula se existe cooldown ativo salvo no localStorage
  useEffect(() => {
    const lastGenerated = localStorage.getItem("lastGeneratedAt")
    if (lastGenerated) {
      const lastTime = parseInt(lastGenerated, 10)
      const now = Date.now()
      const diff = Math.floor((now - lastTime) / 1000) // diferença em segundos
      const remaining = 300 - diff // 5 minutos = 300s
      if (remaining > 0) {
        setCooldown(remaining)
      }
    }
  }, [])

  // 🔹 Timer que vai diminuindo o cooldown
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => (prev > 0 ? prev - 1 : 0))
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [cooldown])





  const [config, setConfig] = useState<ExamConfig>({
    grade: "",
    subject: "",
    difficulty: "",
    questionTypes: [],
    questionCount: 10,
    topics: "",
    instructions: "",
  })

  const [manualInstructions, setManualInstructions] = useState("") // TEXTO DIGITADO PELO USUÁRIO
  const [showPontos, setShowPontos] = useState(true)
  const [showBncc, setShowBncc] = useState(false)
  const [pontos, setPontos] = useState<number | "">(1)

  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedExam, setGeneratedExam] = useState<GeneratedExam | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState("")
  const [showAlert, setShowAlert] = useState(false)


  // Arrays de opções
  const grades = [
    { value: "1ano", label: "1º Ano" },
    { value: "2ano", label: "2º Ano" },
    { value: "3ano", label: "3º Ano" },
    { value: "4ano", label: "4º Ano" },
    { value: "5ano", label: "5º Ano" },
    { value: "6ano", label: "6º Ano" },
    { value: "7ano", label: "7º Ano" },
    { value: "8ano", label: "8º Ano" },
    { value: "9ano", label: "9º Ano" },
    { value: "1medio", label: "1º Médio" },
    { value: "2medio", label: "2º Médio" },
    { value: "3medio", label: "3º Médio" },
  ]

  const subjects = [
    { value: "matematica", label: "Matemática" },
    { value: "portugues", label: "Português" },
    { value: "historia", label: "História" },
    { value: "geografia", label: "Geografia" },
    { value: "ciencias", label: "Ciências" },
    { value: "fisica", label: "Física" },
    { value: "quimica", label: "Química" },
    { value: "biologia", label: "Biologia" },
    { value: "ingles", label: "Inglês" },
    { value: "artes", label: "Artes" },
    { value: "ensinoReligioso", label: "Ensino Religioso" },
  ]

  const difficulties = [
    { value: "facil", label: "Fácil", color: "bg-green-100 text-green-800" },
    { value: "medio", label: "Médio", color: "bg-yellow-100 text-yellow-800" },
    { value: "dificil", label: "Difícil", color: "bg-red-100 text-red-800" },
  ]

  const questionTypes = [
    { id: "multipla-escolha", label: "Múltipla Escolha" },
    { id: "verdadeiro-falso", label: "Verdadeiro ou Falso" },
    { id: "dissertativa", label: "Dissertativa" },
    { id: "completar", label: "Completar Lacunas" },
    { id: "associacao", label: "Associação" },
  ]

  const handleQuestionTypeChange = (typeId: string, checked: boolean) => {
    setConfig((prev) => ({
      ...prev,
      questionTypes: checked
        ? [...prev.questionTypes, typeId]
        : prev.questionTypes.filter((t) => t !== typeId),
    }))
  }

  // Função que gera as instruções combinando manual + extras
  const getTextareaValue = () => {
    const extras: string[] = []
    if (showPontos && pontos) extras.push(`Informe ao lado da questão que vale ${pontos} ponto(s)`)
    if (showBncc) extras.push("Informe ao lado da questão o código BNCC")

    return [manualInstructions, ...extras].filter(Boolean).join("\n")
  }

  const generateExam = async () => {
    if (!user || cooldown > 0) return

    setIsGenerating(true)
    setError("")

    try {
      const finalInstructions = getTextareaValue()
      const payload = { ...config, instructions: finalInstructions }

      const response = await fetch("/api/generate-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error("Erro ao gerar prova")

      const examData: GeneratedExam = await response.json()

      examData.createdAt = new Date()
      examData.userId = user.uid

      const docRef = await addDoc(collection(db, "exams"), examData)
      examData.id = docRef.id

      if (userProfile) {
        await updateDoc(doc(db, "users", user.uid), {
          examsGenerated: increment(1),
        })
      }

      setGeneratedExam(examData)
      setShowAlert(true)

      // ⏳ Salva hora da geração no localStorage e inicia cooldown
      localStorage.setItem("lastGeneratedAt", Date.now().toString())
      setCooldown(300) // 5 minutos


    } catch (err) {
      console.error(err)
      setError("Erro ao gerar prova. Tente novamente.")
    } finally {
      setIsGenerating(false)
    }
  }

  const isConfigValid =
    config.grade &&
    config.subject &&
    config.difficulty &&
    config.questionTypes.length > 0

  return (
    <div className="space-y-8">
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Configuração da Prova
          </CardTitle>
          <CardDescription>
            Configure os parâmetros para gerar uma prova personalizada com IA
          </CardDescription>
        </CardHeader>
        <div className="flex justify-center p-2">
          <Badge variant="destructive" className="whitespace-normal text-center max-w-xs sm:max-w-md">
            Aviso: a IA pode apresentar imprecisões. Revise as questões geradas.
          </Badge>
        </div>


        <CardContent className="space-y-6">
          {/* Seletor de Série/Ano */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grade">Série/Ano</Label>
              <Select value={config.grade} onValueChange={(value) => setConfig((prev) => ({ ...prev, grade: value }))}>
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="Selecione a série" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((grade) => (
                    <SelectItem className="cursor-pointer" key={grade.value} value={grade.value}>{grade.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Disciplina */}
            <div className="space-y-2">
              <Label htmlFor="subject">Disciplina</Label>
              <Select
                value={config.subject}
                onValueChange={(value) => setConfig((prev) => ({ ...prev, subject: value }))}
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="Selecione a disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem className="cursor-pointer" key={subject.value} value={subject.value}>{subject.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dificuldade */}
            <div className="space-y-2">
              <Label htmlFor="difficulty">Nível de Dificuldade</Label>
              <Select
                value={config.difficulty}
                onValueChange={(value) => setConfig((prev) => ({ ...prev, difficulty: value }))}
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="Selecione a dificuldade" />
                </SelectTrigger>
                <SelectContent>
                  {difficulties.map((diff) => (
                    <SelectItem className="cursor-pointer" key={diff.value} value={diff.value}>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={diff.color}>{diff.label}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tipos de Questões */}
          <div className="space-y-3">
            <Label>Tipos de Questões</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {questionTypes.map((type) => (
                <div key={type.id} className="flex items-center space-x-2">
                  <Checkbox className="cursor-pointer"
                    id={type.id}
                    checked={config.questionTypes.includes(type.id)}
                    onCheckedChange={(checked) => handleQuestionTypeChange(type.id, checked as boolean)}
                  />
                  <Label htmlFor={type.id} className="text-sm font-normal">{type.label}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Quantidade de questões*/}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="questionCount">Quantidade de questões</Label>
              <Input id="questionCount"
                type="number"
                min="5"
                max="50"
                value={config.questionCount}
                onChange={(e) => setConfig((prev) => ({
                  ...prev, questionCount: Number.parseInt(e.target.value) || 10
                }))} />
            </div>
          </div>

          {/* Tópicos / Assuntos principais */}
          <div className="space-y-2">
            <Label htmlFor="topics">Tópicos Específicos <small className="text-red-400">(obrigatório)</small></Label>
            <Input id="topics" placeholder="Ex: Equações do 2º grau, Teorema de Pitágoras..."
              value={config.topics}
              onChange={(e) => setConfig((prev) => ({ ...prev, topics: e.target.value }))} />
          </div>

          {/* Instruções adicionais */}
          <Label>Instruções adicionais</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox className="cursor-pointer" checked={showPontos} onCheckedChange={(checked) => setShowPontos(checked as boolean)} />
              <Label className="text-sm font-normal">Informar valor dos pontos nas questões</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox className="cursor-pointer" checked={showBncc} onCheckedChange={(checked) => setShowBncc(checked as boolean)} />
              <Label className="text-sm font-normal">Informar código BNCC nas questões</Label>
            </div>
          </div>

          {showPontos && (
            <Input
              className="w-[190px]"
              type="number"
              placeholder="Quantidade de pontos"
              value={pontos}
              onChange={(e) => setPontos(Number(e.target.value))}
            />
          )}

          <div className="space-y-2">
            <Label htmlFor="instructions">Instruções Adicionais (opcional)</Label>
            <Textarea
              id="instructions"
              placeholder="Instruções específicas para a prova..."
              value={getTextareaValue()} // <-- mostra manual + extras em tempo real
              onChange={(e) => setManualInstructions(e.target.value)}
              rows={3}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              onClick={generateExam}
              disabled={!isConfigValid || isGenerating || cooldown > 0}
              className="flex-1 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Gerando Prova com IA...
                </>
              ) : cooldown > 0 ? (
                <>
                  ⏳ Aguarde {Math.floor(cooldown / 60)}:
                  {String(cooldown % 60).padStart(2, "0")}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Gerar Prova com IA
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Prova gerada */}
      {generatedExam && (
        <Card className="border-2 border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent" />
              Prova Gerada
            </CardTitle>
            <CardDescription>Sua prova foi gerada com sucesso! Visualize ou baixe.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 mb-4">
              <Badge variant="outline">{generatedExam.title}</Badge>
              <Badge
                variant="secondary"
                className={difficulties.find((d) => d.value === generatedExam.difficulty.toLowerCase())?.color}
              >
                {generatedExam.difficulty}
              </Badge>
              <Badge variant="outline">{generatedExam.questions.length} questões</Badge>
            </div>

            <div className="flex gap-3">
              <Button className="cursor-pointer" onClick={() => setShowPreview(true)} variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                Visualizar
              </Button>
              <Button
                className="cursor-pointer"
                variant="outline"
                onClick={async () => {
                  try {
                    const response = await fetch("/api/download-pdf", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(generatedExam),
                    })
                    if (response.ok) {
                      const blob = await response.blob()
                      const url = window.URL.createObjectURL(blob)
                      const a = document.createElement("a")
                      a.href = url
                      a.download = `${generatedExam.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`
                      document.body.appendChild(a)
                      a.click()
                      window.URL.revokeObjectURL(url)
                      document.body.removeChild(a)
                    }
                  } catch (error) {
                    console.error("Erro ao baixar PDF:", error)
                  }
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar PDF
              </Button>

              <Button
                className="cursor-pointer"
                variant="outline"
                onClick={async () => {
                  try {
                    const response = await fetch("/api/download-docx", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(generatedExam),
                    })
                    if (response.ok) {
                      const blob = await response.blob()
                      const url = window.URL.createObjectURL(blob)
                      const a = document.createElement("a")
                      a.href = url
                      a.download = `${generatedExam.title.replace(/[^a-zA-Z0-9]/g, "_")}.docx`
                      document.body.appendChild(a)
                      a.click()
                      window.URL.revokeObjectURL(url)
                      document.body.removeChild(a)
                    }
                  } catch (error) {
                    console.error("Erro ao baixar DOCX:", error)
                  }
                }}
              >
                <FileText className="w-4 h-4 mr-2" />
                Baixar DOCX
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de preview da prova */}
      {showPreview && generatedExam && (
        <ExamPreview exam={generatedExam} onClose={() => setShowPreview(false)} />
      )}
      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-1.5">
              <Sparkles /> Prova Gerada
            </AlertDialogTitle>
            <AlertDialogDescription>
              Sua prova foi gerada com sucesso! Visualize ou baixe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="cursor-pointer" onClick={() => setShowAlert(false)}>
              <CheckIcon /> Entendi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
