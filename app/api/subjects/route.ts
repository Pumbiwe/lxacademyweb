// app/api/subjects/route.ts
import fs from "fs";
import path from "path";

function getSubjectsData() {
  const filePath = path.join(process.cwd(), "data", "subjects.json");
  const fileContents = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(fileContents);
}

export async function GET() {
  const subjects = getSubjectsData();
  const subjectsList = Object.entries(subjects).map(([id, subject]: [string, any]) => ({
    id,
    name: subject.name,
    description: subject.description,
    questionCount: Object.keys(subject.questions).length,
  }));

  return Response.json(subjectsList);
}

export async function POST(request: Request) {
  try {
    const { subjectId, question, answer } = await request.json();

    if (!subjectId || !question || !answer) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const subjectsData = getSubjectsData();
    if (!subjectsData[subjectId]) {
      return Response.json({ error: "Subject not found" }, { status: 404 });
    }

    subjectsData[subjectId].questions[question] = { text: answer };

    const filePath = path.join(process.cwd(), "data", "subjects.json");
    try {
      fs.writeFileSync(filePath, JSON.stringify(subjectsData, null, 2), "utf-8");
    } catch (writeError: any) {
      console.error("Failed to write file:", writeError);
      return Response.json({ error: `Failed to save: ${writeError.message}` }, { status: 500 });
    }

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

    const subjectsData = getSubjectsData();
    if (!subjectsData[subjectId]) {
      return Response.json({ error: "Subject not found" }, { status: 404 });
    }

    if (oldQuestion !== newQuestion) {
      delete subjectsData[subjectId].questions[oldQuestion];
    }
    subjectsData[subjectId].questions[newQuestion] = { text: newAnswer };

    const filePath = path.join(process.cwd(), "data", "subjects.json");
    try {
      fs.writeFileSync(filePath, JSON.stringify(subjectsData, null, 2), "utf-8");
    } catch (writeError: any) {
      console.error("Failed to write file:", writeError);
      return Response.json({ error: `Failed to save: ${writeError.message}` }, { status: 500 });
    }

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

    const subjectsData = getSubjectsData();
    if (!subjectsData[subjectId]) {
      return Response.json({ error: "Subject not found" }, { status: 404 });
    }

    if (!subjectsData[subjectId].questions[question]) {
      return Response.json({ error: "Question not found" }, { status: 404 });
    }

    delete subjectsData[subjectId].questions[question];

    const filePath = path.join(process.cwd(), "data", "subjects.json");
    try {
      fs.writeFileSync(filePath, JSON.stringify(subjectsData, null, 2), "utf-8");
    } catch (writeError: any) {
      console.error("Failed to write file:", writeError);
      return Response.json({ error: `Failed to save: ${writeError.message}` }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete question:", error);
    return Response.json({ error: error.message || "Failed to delete question" }, { status: 500 });
  }
}
