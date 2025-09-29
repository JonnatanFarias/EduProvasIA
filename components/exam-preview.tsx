"use client"

import { useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Printer } from "lucide-react"

interface Question {
  id: number
  type: string
  question: string
  options?: string[]
  answer: string
  correctAnswer: string
}

interface ExamPreviewProps {
  exam: {
    title: string
    difficulty: string
    questions: Question[]
  }
  onClose: () => void
}

export function ExamPreview({ exam, onClose }: ExamPreviewProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const getQuestionTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      "multipla-escolha": "Múltipla Escolha",
      "verdadeiro-falso": "Verdadeiro ou Falso",
      dissertativa: "Dissertativa",
      completar: "Completar Lacunas",
      associacao: "Associação",
    }
    return types[type] || type
  }

  const printWindowStyles = `
  body { 
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
    line-height: 1.6; 
    background-color: #fff;
    
  }
  .border { 
    border-radius: 6px; 
    background-color: #fff;
    margin-bottom:26px ;
  }
  .text-center { text-align: center; }
  .bg-green-100 { background-color: #d1fae5; }
  .text-green-800 { color: #166534; }
`;

 const handlePrint = () => {
  if (!printRef.current) return;

  const printContents = printRef.current.innerHTML;

  // Usando largura e altura da tela
  const printWindow = window.open(
    "",
    "_blank",
    `width=${screen.width},height=${screen.height},top=0,left=0,scrollbars=yes,resizable=yes`
  );
  if (!printWindow) return;

  printWindow.document.write(`
    <html>
      <head>
        <title>${exam.title} - GABARITO</title>
        <style>${printWindowStyles}</style>
      </head>
      <body>${printContents}</body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};



  // Função que gera o JSX das questões
  const renderQuestions = (questions: Question[]) =>
    questions.map((question) => (
      <div key={question.id} className="border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className="text-xs">
            {getQuestionTypeLabel(question.type)}
          </Badge>
        </div>

        <div className="mb-4">
          <span className="font-semibold">{question.id}. </span>
          {question.question}
        </div>

        {question.options && (
          <div className="space-y-2 ml-4">
            {Object.entries(question.options).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span>{value}</span>
              </div>
            ))}
          </div>
        )}

        <div className="bg-green-100 text-green-800 px-2 py-1 rounded break-words max-w-full mt-1.5">
          <strong>Resposta correta:</strong> {typeof question.correctAnswer === 'object' ? JSON.stringify(question.correctAnswer) : question.correctAnswer}
        </div>


        {question.type === "dissertativa" && (
          <div className="mt-4 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="border-b border-dashed border-muted-foreground/30 h-4"
              ></div>
            ))}
          </div>
        )}

        {question.type === "verdadeiro-falso" && (
          <div className="flex gap-6 mt-4 ml-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 border rounded-full flex items-center justify-center text-sm">
                V
              </span>
              <span>Verdadeiro</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 border rounded-full flex items-center justify-center text-sm">
                F
              </span>
              <span>Falso</span>
            </div>
          </div>
        )}

        {question.type === "completar" && (
          <div className="mt-4 ml-4">
            <p>Complete as lacunas: _____________ e _____________</p>
          </div>
        )}
      </div>
    ))

  // Cabeçalho do exame, usado tanto no modal quanto na impressão
  const renderHeader = (
    <div className="text-center border-b pb-4">
      <h2 className="text-2xl font-bold">{exam.title}</h2>
      <p className="text-muted-foreground mt-2">
        ⚠️ Revise todas as respostas e explicações antes de entregar a prova ao aluno.
      </p>
    </div>
  )

  const renderFooter = (
    <div className="text-center text-sm text-muted-foreground border-t pt-4 mb-2.5">
      <p>Boa sorte! 📚</p>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-xl">{exam.title}</CardTitle>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary">
                {exam.difficulty === "facil"
                  ? "Fácil"
                  : exam.difficulty === "medio"
                    ? "Médio"
                    : "Difícil"}
              </Badge>
              <Badge variant="outline">{exam.questions.length} questões</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              IMPRIMIR
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <div className="printable-area">
          <CardContent className="overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
            {renderHeader}
            {renderQuestions(exam.questions)}
            {renderFooter}
          </CardContent>
        </div>
      </Card>

      {/* Conteúdo flat para impressão */}
      <div ref={printRef} style={{ display: "none" }}>
        <div className="printable-area space-y-6">
          {renderHeader}
          {renderQuestions(exam.questions)}
          {renderFooter}
        </div>
      </div>
    </div>
  )
}
