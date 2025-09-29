import { type NextRequest, NextResponse } from "next/server"
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, UnderlineType } from "docx"

export async function POST(request: NextRequest) {
  try {
    const examData = await request.json()

    // Criar documento DOCX
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Cabeçalho da prova
            new Paragraph({
              children: [
                new TextRun({
                  text: examData.title,
                  bold: true,
                  size: 32,
                }),
              ],
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),

            // Informações da prova
            new Paragraph({
              children: [
                new TextRun({
                  text: `Disciplina: ${examData.subject} | Série: ${examData.grade} | Dificuldade: ${examData.difficulty}`,
                  size: 22,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 600 },
            }),

            // Instruções
            new Paragraph({
              children: [
                new TextRun({
                  text: "INSTRUÇÕES:",
                  bold: true,
                  underline: { type: UnderlineType.SINGLE },
                  size: 24,
                }),
              ],
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "• Leia atentamente cada questão antes de responder.",
                  size: 22,
                }),
              ],
              spacing: { after: 100 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "• Marque apenas uma alternativa para questões de múltipla escolha.",
                  size: 22,
                }),
              ],
              spacing: { after: 100 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "• Para questões dissertativas, desenvolva sua resposta de forma clara e objetiva.",
                  size: 22,
                }),
              ],
              spacing: { after: 400 },
            }),

            // Linha separadora
            new Paragraph({
              children: [
                new TextRun({
                  text: "─".repeat(80),
                  size: 20,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),

            // Questões
            ...examData.questions.flatMap((question: any, index: number) => {
              const questionParagraphs = [
                // Número e enunciado da questão
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${question.id}. `,
                      bold: true,
                      size: 24,
                    }),
                    new TextRun({
                      text: question.question,
                      size: 24,
                    }),
                  ],
                  spacing: { before: 300, after: 200 },
                }),
              ]

              // Adicionar opções se for múltipla escolha ou verdadeiro/falso
              if (question.options && question.options.length > 0) {
                question.options.forEach((option: string) => {
                  questionParagraphs.push(
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: option,
                          size: 22,
                        }),
                      ],
                      spacing: { after: 100 },
                    }),
                  )
                })
              }

              // Espaço para resposta em questões dissertativas
              if (question.type === "dissertativa") {
                questionParagraphs.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Resposta:",
                        size: 22,
                        italics: true,
                      }),
                    ],
                    spacing: { before: 200, after: 100 },
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "_".repeat(100),
                        size: 20,
                      }),
                    ],
                    spacing: { after: 100 },
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "_".repeat(100),
                        size: 20,
                      }),
                    ],
                    spacing: { after: 100 },
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "_".repeat(100),
                        size: 20,
                      }),
                    ],
                    spacing: { after: 200 },
                  }),
                )
              }

              // Espaço entre questões
              if (index < examData.questions.length - 1) {
                questionParagraphs.push(
                  new Paragraph({
                    children: [new TextRun({ text: "" })],
                    spacing: { after: 300 },
                  }),
                )
              }

              return questionParagraphs
            }),

            // Rodapé
            new Paragraph({
              children: [
                new TextRun({
                  text: "─".repeat(80),
                  size: 20,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 600, after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: `Prova gerada em ${new Date().toLocaleDateString("pt-BR")} | Desenvolvedor : Jonnatan Farias`,
                  size: 20,
                  italics: true,
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
        },
      ],
    })

    // Gerar buffer do documento
    const buffer = await Packer.toBuffer(doc)

    // Retornar arquivo DOCX
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${examData.title.replace(/[^a-zA-Z0-9]/g, "_")}.docx"`,
      },
    })
  } catch (error) {
    console.error("Erro ao gerar DOCX:", error)
    return NextResponse.json({ error: "Erro ao gerar arquivo DOCX" }, { status: 500 })
  }
}
