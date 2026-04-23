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
const MAX_MULTI_FIELDS = 20;

type QuestionType = "single" | "multi";

function normalizeQuestionPayload(payload: {
  question: unknown;
  answer: unknown;
  type?: unknown;
  fieldsCount?: unknown;
  answers?: unknown;
}) {
  const q = typeof payload.question === "string" ? payload.question.slice(0, MAX_QUESTION_LENGTH).trim() : "";
  const a = typeof payload.answer === "string" ? payload.answer.slice(0, MAX_ANSWER_LENGTH).trim() : "";
  const rawType = payload.type === "multi" ? "multi" : "single";
  const parsedAnswers = Array.isArray(payload.answers)
    ? payload.answers
        .map((item) => (typeof item === "string" ? item.slice(0, MAX_ANSWER_LENGTH).trim() : ""))
        .filter(Boolean)
    : [];
  const requestedFieldsCount = Number(payload.fieldsCount);
  const safeFieldsCount = Number.isFinite(requestedFieldsCount)
    ? Math.min(MAX_MULTI_FIELDS, Math.max(2, Math.floor(requestedFieldsCount)))
    : undefined;

  let type: QuestionType = rawType;
  let answers: string[] = parsedAnswers;
  let fieldsCount = safeFieldsCount ?? parsedAnswers.length;

  if (type === "multi") {
    if (answers.length === 0) {
      answers = a
        .split("|")
        .map((part) => part.trim())
        .filter(Boolean);
    }
    if (answers.length < 2) {
      type = "single";
      answers = [];
      fieldsCount = 1;
    } else {
      fieldsCount = Math.max(2, fieldsCount || answers.length);
      answers = answers.slice(0, fieldsCount);
      if (answers.length < fieldsCount) {
        answers = [...answers, ...Array.from({ length: fieldsCount - answers.length }, () => "")];
      }
    }
  } else {
    fieldsCount = 1;
  }

  if (!q || !a) {
    return { error: "Invalid question or answer" } as const;
  }

  return { question: q, answer: a, type, fieldsCount, answers } as const;
}

export async function POST(request: Request) {
  try {
    const { subjectId, question, answer, type, fieldsCount, answers } = await request.json();

    if (!subjectId || !question || !answer) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    const normalized = normalizeQuestionPayload({ question, answer, type, fieldsCount, answers });
    if ("error" in normalized) {
      return Response.json({ error: normalized.error }, { status: 400 });
    }

    const subjectsData = await getSubjectsData();
    if (!subjectsData[subjectId]) {
      return Response.json({ error: "Subject not found" }, { status: 404 });
    }

    subjectsData[subjectId].questions[normalized.question] = {
      text: normalized.answer,
      type: normalized.type,
      fieldsCount: normalized.type === "multi" ? normalized.fieldsCount : 1,
      answers: normalized.type === "multi" ? normalized.answers : [],
    };

    await saveSubjectsData(subjectsData);

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("Failed to add question:", error);
    return Response.json({ error: error.message || "Failed to add question" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { subjectId, oldQuestion, newQuestion, newAnswer, type, fieldsCount, answers } = await request.json();

    if (!subjectId || !oldQuestion || !newQuestion || !newAnswer) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    const normalized = normalizeQuestionPayload({
      question: newQuestion,
      answer: newAnswer,
      type,
      fieldsCount,
      answers,
    });
    if ("error" in normalized) {
      return Response.json({ error: normalized.error }, { status: 400 });
    }

    const subjectsData = await getSubjectsData();
    if (!subjectsData[subjectId]) {
      return Response.json({ error: "Subject not found" }, { status: 404 });
    }

    if (oldQuestion !== normalized.question) {
      delete subjectsData[subjectId].questions[oldQuestion];
    }
    subjectsData[subjectId].questions[normalized.question] = {
      text: normalized.answer,
      type: normalized.type,
      fieldsCount: normalized.type === "multi" ? normalized.fieldsCount : 1,
      answers: normalized.type === "multi" ? normalized.answers : [],
    };

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
