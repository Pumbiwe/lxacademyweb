// app/api/subjects/manage/route.ts
import fs from "fs";
import path from "path";

function getSubjectsData() {
  const filePath = path.join(process.cwd(), "data", "subjects.json");
  const fileContents = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(fileContents);
}

function saveSubjectsData(data: any) {
  const filePath = path.join(process.cwd(), "data", "subjects.json");
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// Создать новый предмет
export async function POST(request: Request) {
  try {
    const { id, name, description } = await request.json();

    if (!id || !name) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const subjectsData = getSubjectsData();
    
    if (subjectsData[id]) {
      return Response.json({ error: "Subject with this ID already exists" }, { status: 400 });
    }

    subjectsData[id] = {
      name,
      description: description || "",
      questions: {},
    };

    saveSubjectsData(subjectsData);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: "Failed to create subject" }, { status: 500 });
  }
}

// Удалить предмет
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");

    if (!subjectId) {
      return Response.json({ error: "Missing subjectId" }, { status: 400 });
    }

    const subjectsData = getSubjectsData();
    
    if (!subjectsData[subjectId]) {
      return Response.json({ error: "Subject not found" }, { status: 404 });
    }

    delete subjectsData[subjectId];

    saveSubjectsData(subjectsData);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: "Failed to delete subject" }, { status: 500 });
  }
}

// Экспорт предмета
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");

    if (!subjectId) {
      return Response.json({ error: "Missing subjectId" }, { status: 400 });
    }

    const subjectsData = getSubjectsData();
    
    if (!subjectsData[subjectId]) {
      return Response.json({ error: "Subject not found" }, { status: 404 });
    }

    const subject = subjectsData[subjectId];
    const exportData = {
      id: subjectId,
      name: subject.name,
      description: subject.description,
      questions: subject.questions,
    };

    return Response.json(exportData);
  } catch (error) {
    return Response.json({ error: "Failed to export subject" }, { status: 500 });
  }
}

// Импорт предмета
export async function PUT(request: Request) {
  try {
    const { subjectId, name, description, questions } = await request.json();

    if (!subjectId || !name) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const subjectsData = getSubjectsData();
    
    subjectsData[subjectId] = {
      name,
      description: description || "",
      questions: questions || {},
    };

    saveSubjectsData(subjectsData);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: "Failed to import subject" }, { status: 500 });
  }
}
