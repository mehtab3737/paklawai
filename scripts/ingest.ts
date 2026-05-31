import * as fs from "fs";
import * as path from "path";

// Load .env variables manually for CLI execution context
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envLines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of envLines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        // Strip surrounding quotes if present
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;
const INDEX_NAME = process.env.PINECONE_INDEX_NAME ?? "legal-docs";
const DATA_DIR = path.join(process.cwd(), "data");

function chunkText(text: string, size: number, overlap: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let i = 0;
  while (i < words.length) {
    chunks.push(words.slice(i, i + size).join(" "));
    i += size - overlap;
  }
  return chunks;
}

async function ingestFile(filePath: string) {
  const filename = path.basename(filePath);
  const content = fs.readFileSync(filePath, "utf-8");

  // Filter out any empty chunks or whitespace-only chunks
  const chunks = chunkText(content, CHUNK_SIZE, CHUNK_OVERLAP).filter(
    (c) => c.trim().length > 0,
  );
  if (chunks.length === 0) {
    console.log(`  ⏭️  Skipping empty file: ${filename}`);
    return;
  }

  const index = pinecone.index(INDEX_NAME);
  const total = chunks.length;

  console.log(`\n📄 Ingesting ${filename} — ${total} chunks`);

  const BATCH = 50;
  for (let b = 0; b < chunks.length; b += BATCH) {
    const batch = chunks.slice(b, b + BATCH);
    const embeddings = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: batch,
      dimensions: 384,
    });

    const vectors = embeddings.data.map((item, j) => ({
      id: `${filename}-chunk-${b + j}`,
      values: item.embedding,
      metadata: {
        text: batch[j],
        filename: filename,
        chunk_index: b + j,
      },
    }));
    if (vectors.length > 0) {
      await index.upsert({ records: vectors });
    }
    for (let k = 0; k < batch.length; k++) {
      console.log(`  ✓ Ingested chunk ${b + k + 1}/${total} from ${filename}`);
    }
  }
}

function getFilesRecursively(dir: string, extension: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    if (file.startsWith('.')) return;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursively(filePath, extension));
    } else if (file.endsWith(extension)) {
      results.push(filePath);
    }
  });
  return results;
}

async function main() {
  if (!fs.existsSync(DATA_DIR)) {
    console.error(
      `❌ /data directory not found. Create it and add .txt files.`,
    );
    process.exit(1);
  }

  const files = getFilesRecursively(DATA_DIR, ".txt");

  if (files.length === 0) {
    console.error(
      "❌ No .txt files found in /data (did you run scripts/pdf_to_txt.py?)",
    );
    process.exit(1);
  }

  const PROGRESS_FILE = path.join(process.cwd(), ".ingested_progress.txt");
  const ingestedFiles = new Set<string>();
  if (fs.existsSync(PROGRESS_FILE)) {
    const progressContent = fs.readFileSync(PROGRESS_FILE, "utf-8");
    progressContent.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed) {
        ingestedFiles.add(trimmed);
      }
    });
  }

  console.log(
    `🚀 Starting ingestion of ${files.length} file(s) into Pinecone index: ${INDEX_NAME}`,
  );
  if (ingestedFiles.size > 0) {
    console.log(
      `ℹ️ Found progress file. Already ingested: ${ingestedFiles.size} files. Resuming...`,
    );
  }

  let successCount = 0;
  for (const file of files) {
    const filename = path.basename(file);
    if (ingestedFiles.has(filename)) {
      continue;
    }

    try {
      await ingestFile(file);
      fs.appendFileSync(PROGRESS_FILE, `${filename}\n`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to ingest ${filename}:`, error);
      console.log(
        "⚠️ Ingestion paused due to error. You can run the script again to resume.",
      );
      process.exit(1);
    }
  }

  console.log(`\n✅ Ingestion complete! Ingested ${successCount} new file(s).`);
}

main().catch(console.error);
