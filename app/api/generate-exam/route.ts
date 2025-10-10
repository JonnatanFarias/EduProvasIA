import { type NextRequest, NextResponse } from "next/server"
import { google } from "@ai-sdk/google" // 👈 importa o provedor Gemini
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const { grade, subject, difficulty, questionTypes, questionCount, topics, instructions } = await request.json()

    const gradeMap: Record<string, string> = {
      "1ano": "1º Ano do Ensino Fundamental",
      "2ano": "2º Ano do Ensino Fundamental",
      "3ano": "3º Ano do Ensino Fundamental",
      "4ano": "4º Ano do Ensino Fundamental",
      "5ano": "5º Ano do Ensino Fundamental",
      "6ano": "6º Ano do Ensino Fundamental",
      "7ano": "7º Ano do Ensino Fundamental",
      "8ano": "8º Ano do Ensino Fundamental",
      "9ano": "9º Ano do Ensino Fundamental",
      "1medio": "1º Ano do Ensino Médio",
      "2medio": "2º Ano do Ensino Médio",
      "3medio": "3º Ano do Ensino Médio",
    }

    const subjectMap: Record<string, string> = {
      matematica: "Matemática",
      portugues: "Português",
      historia: "História",
      geografia: "Geografia",
      ciencias: "Ciências",
      fisica: "Física",
      quimica: "Química",
      biologia: "Biologia",
      ingles: "Inglês",
      artes: "Artes",
      ensinoReligioso: "Ensino Religioso",
    }

    const difficultyMap: Record<string, string> = {
      facil: "Fácil",
      medio: "Médio",
      dificil: "Difícil",
    }

    const questionTypeMap: Record<string, string> = {
      "multipla-escolha": "Múltipla Escolha",
      "verdadeiro-falso": "Verdadeiro ou Falso",
      dissertativa: "Dissertativa",
      completar: "Completar Lacunas",
      associacao: "Associação",
    }

    const gradeText = gradeMap[grade] || grade
    const subjectText = subjectMap[subject] || subject
    const difficultyText = difficultyMap[difficulty] || difficulty
    const questionTypesText = questionTypes.map((type: string) => questionTypeMap[type] || type).join(", ")
    const topicsText = topics ? `Tópicos específicos: ${topics}` : ""
    // Monta o texto de instruções com reforço para explicações
    let instructionsText = ""

    if (instructions) {
      instructionsText = `Instruções adicionais: ${instructions}`

      // Se o usuário pediu explicação/contexto prévio, reforça no prompt
      if (instructions.toLowerCase().includes("explicação") || instructions.toLowerCase().includes("contexto")) {
        instructionsText += `
Cada questão deve começar com uma breve explicação ou contextualização do tema abordado,
antes do enunciado principal. Essa explicação deve ajudar o aluno a entender o contexto.`
      }
    }


    const prompt = `
Você é um especialista em educação brasileira. Crie uma prova de ${subjectText} para ${gradeText} com as seguintes especificações:

- Nível de dificuldade: ${difficultyText}
- Número de questões: ${questionCount}
- Tipos de questões: ${questionTypesText}
${topicsText}
${instructionsText}

IMPORTANTE: Retorne APENAS um JSON válido no seguinte formato:
{
  "title": "Prova de [Disciplina] - [Série]",
  "subject": "${subjectText}",
  "grade": "${gradeText}",
  "difficulty": "${difficultyText}",
  "questions": [
    {
      "id": 1,
      "type": "tipo-da-questao",
      "question": "Enunciado da questão",
      "options": ["A) opção", "B) opção", "C) opção", "D) opção"] (apenas para múltipla escolha),
      "correctAnswer": "resposta correta ou gabarito",
      "explanation": "explicação da resposta"
    }
  ]
}

Regras importantes:
- Para questões de múltipla escolha, inclua 4 alternativas (A, B, C, D)
- Para verdadeiro/falso, use "Verdadeiro" ou "Falso" como opções
- Para dissertativas, não inclua "options", apenas "correctAnswer" com uma resposta modelo
- Para completar lacunas, use _____ no enunciado e forneça as palavras corretas
- Para a disciplina de matemática tente, colocar questões para realizar cáculos.
- Para associação, crie duas colunas para associar
- Todas as questões devem estar alinhadas com a BNCC (Base Nacional Comum Curricular)
- Sempre inclua o campo "explanation" com uma explicação curta sobre o contexto ou a resposta da questão
- Use linguagem adequada para a faixa etária
- Questões devem ser educativas e construtivas

Não inclua texto adicional, apenas o JSON.
`

    // 👇 aqui usamos Gemini corretamente
    const { text } = await generateText({
      model: google("models/gemini-2.0-flash"),
      prompt,
      temperature: 0.7,
    })

    let examData
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        examData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("JSON não encontrado na resposta")
      }
    } catch (parseError) {
      console.error("Erro ao fazer parse do JSON:", parseError)
      console.error("Resposta da IA:", text)

      examData = {
        title: `Prova de ${subjectText} - ${gradeText}`,
        subject: subjectText,
        grade: gradeText,
        difficulty: difficultyText,
        questions: Array.from({ length: questionCount }, (_, i) => ({
          id: i + 1,
          type: questionTypes[i % questionTypes.length],
          question: `Questão ${i + 1} sobre ${topics || "o conteúdo programático"}`,
          options:
            questionTypes[i % questionTypes.length] === "multipla-escolha"
              ? ["A) Alternativa A", "B) Alternativa B", "C) Alternativa C", "D) Alternativa D"]
              : undefined,
          correctAnswer: "Resposta modelo",
          explanation: "Explicação da questão",
        })),
      }
    }

    return NextResponse.json(examData)
  } catch (error) {
    console.error("Erro na geração da prova:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
