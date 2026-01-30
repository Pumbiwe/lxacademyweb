// app/api/subjects/route.ts
import { getSubjectsData, saveSubjectsData } from "@/lib/db";

export async function GET() {
  try {
    const subjects = await getSubjectsData();
    const subjectsList = Object.entries(subjects).map(([id, subject]: [string, any]) => ({
      id,
      name: subject.name,
      description: subject.description,
      questionCount: Object.keys(subject.questions).length,
    }));

    return Response.json(subjectsList);
  } catch (error: any) {
    console.error("Failed to get subjects:", error);
    return Response.json({ error: error.message || "Failed to get subjects" }, { status: 500 });
  }
}

const MAX_QUESTION_LENGTH = 2000;
const MAX_ANSWER_LENGTH = 5000;

export async function POST(request: Request) {
  try {
    const { subjectId, question, answer } = await request.json();

    if (!subjectId || !question || !answer) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    const q = typeof question === "string" ? question.slice(0, MAX_QUESTION_LENGTH).trim() : "";
    const a = typeof answer === "string" ? answer.slice(0, MAX_ANSWER_LENGTH).trim() : "";
    if (!q || !a) {
      return Response.json({ error: "Invalid question or answer" }, { status: 400 });
    }

    const subjectsData = await getSubjectsData();
    if (!subjectsData[subjectId]) {
      return Response.json({ error: "Subject not found" }, { status: 404 });
    }

    subjectsData[subjectId].questions[q] = { text: a };

    await saveSubjectsData(subjectsData);

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("Failed to add question:", error);
    return Response.json({ error: error.message || "Failed to add question" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { subjectId, oldQuestion, newQuestion, newAnswer } = await request.json();

    if (!subjectId || !oldQuestion || !newQuestion || !newAnswer) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    const newQ = typeof newQuestion === "string" ? newQuestion.slice(0, MAX_QUESTION_LENGTH).trim() : "";
    const newA = typeof newAnswer === "string" ? newAnswer.slice(0, MAX_ANSWER_LENGTH).trim() : "";
    if (!newQ || !newA) {
      return Response.json({ error: "Invalid question or answer" }, { status: 400 });
    }

    const subjectsData = await getSubjectsData();
    if (!subjectsData[subjectId]) {
      return Response.json({ error: "Subject not found" }, { status: 404 });
    }

    if (oldQuestion !== newQ) {
      delete subjectsData[subjectId].questions[oldQuestion];
    }
    subjectsData[subjectId].questions[newQ] = { text: newA };

    await saveSubjectsData(subjectsData);

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("Failed to update question:", error);
    return Response.json({ error: error.message || "Failed to update question" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");
    const question = searchParams.get("question");

    if (!subjectId || !question) {
      return Response.json({ error: "Missing parameters" }, { status: 400 });
    }

    const subjectsData = await getSubjectsData();
    if (!subjectsData[subjectId]) {
      return Response.json({ error: "Subject not found" }, { status: 404 });
    }

    if (!subjectsData[subjectId].questions[question]) {
      return Response.json({ error: "Question not found" }, { status: 404 });
    }

    delete subjectsData[subjectId].questions[question];

    await saveSubjectsData(subjectsData);

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete question:", error);
    return Response.json({ error: error.message || "Failed to delete question" }, { status: 500 });
  }
}
