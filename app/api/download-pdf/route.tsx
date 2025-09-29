import { type NextRequest, NextResponse } from "next/server"
import puppeteer from "puppeteer"

export async function POST(request: NextRequest) {
  try {
    const examData = await request.json()

    // Criar HTML da prova
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${examData.title}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            margin: 40px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        .title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .info {
            font-size: 14px;
            margin-bottom: 10px;
        }
        .instructions {
            margin: 30px 0;
            padding: 15px;
            background-color: #f5f5f5;
            border-left: 4px solid #333;
        }
        .instructions h3 {
            margin-top: 0;
            text-decoration: underline;
        }
        .question {
            margin: 25px 0;
            page-break-inside: avoid;
        }
        .question-number {
            font-weight: bold;
            font-size: 16px;
        }
        .question-text {
            margin: 10px 0;
            font-size: 16px;
        }
        .options {
            margin: 15px 0 15px 20px;
        }
        .option {
            margin: 8px 0;
            font-size: 14px;
        }
        .answer-space {
            margin: 15px 0;
            font-style: italic;
        }
        .answer-lines {
            margin: 10px 0;
        }
        .line {
            border-bottom: 1px solid #333;
            height: 20px;
            margin: 5px 0;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 15px;
        }
        @media print {
            body { margin: 20px; }
            .question { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">${examData.title}</div>
        <div class="info">
            <strong>Disciplina:</strong> ${examData.subject} | 
            <strong>Série:</strong> ${examData.grade} | 
            <strong>Dificuldade:</strong> ${examData.difficulty}
        </div>
        <div class="info">
            <strong>Data:</strong> ${new Date().toLocaleDateString("pt-BR")} | 
            <strong>Questões:</strong> ${examData.questions.length}
        </div>
    </div>

    <div class="instructions">
        <h3>INSTRUÇÕES:</h3>
        <ul>
            <li>Leia atentamente cada questão antes de responder.</li>
            <li>Marque apenas uma alternativa para questões de múltipla escolha.</li>
            <li>Para questões dissertativas, desenvolva sua resposta de forma clara e objetiva.</li>
            <li>Use caneta azul ou preta para suas respostas.</li>
        </ul>
    </div>

    ${examData.questions
      .map(
        (question: any) => `
        <div class="question">
            <div class="question-number">${question.id}.</div>
            <div class="question-text">${question.question}</div>
            
            ${
              question.options && question.options.length > 0
                ? `<div class="options">
                     ${question.options.map((option: string) => `<div class="option">${option}</div>`).join("")}
                   </div>`
                : ""
            }
            
            ${
              question.type === "dissertativa"
                ? `<div class="answer-space">
                     <strong>Resposta:</strong>
                     <div class="answer-lines">
                         <div class="line"></div>
                         <div class="line"></div>
                         <div class="line"></div>
                         <div class="line"></div>
                     </div>
                   </div>`
                : ""
            }
        </div>
    `,
      )
      .join("")}

    <div class="footer">
        Prova gerada em ${new Date().toLocaleDateString("pt-BR")} | Desenvolvedor : Jonnatan Farias
    </div>
</body>
</html>
    `

    // Gerar PDF usando Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "networkidle0" })

    const pdf = await page.pdf({
      format: "A4",
      margin: {
        top: "20mm",
        right: "15mm",
        bottom: "20mm",
        left: "15mm",
      },
      printBackground: true,
    })

    await browser.close()

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${examData.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Erro ao gerar PDF:", error)
    return NextResponse.json({ error: "Erro ao gerar arquivo PDF" }, { status: 500 })
  }
}
