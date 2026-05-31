import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import type { Source } from "@/types";

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function queryPinecone(
  queryText: string,
  topK: number = 5,
): Promise<Source[]> {
  console.log("\n🔍 [Pinecone] Query:", queryText);
  console.log("📦 [Pinecone] Index:", process.env.PINECONE_INDEX_NAME);

  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: queryText,
    dimensions: 384,
  });
  const embedding = embeddingResponse.data[0].embedding;

  console.log(
    "✅ [Pinecone] OpenAI Embedding generated — dimensions:",
    embedding.length,
  );

  const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);
  const queryResponse = await index.query({
    vector: embedding,
    topK,
    includeMetadata: true,
  });

  console.log(
    `📊 [Pinecone] Matches returned: ${queryResponse.matches.length}`,
  );
  if (queryResponse.matches.length > 0) {
    console.log(
      "🗂️  [Pinecone] Raw metadata keys (first match):",
      JSON.stringify(queryResponse.matches[0].metadata),
    );
  }
  queryResponse.matches.forEach((match, i) => {
    const meta = match.metadata ?? {};
    const src = (meta.filename ?? meta.file_name ?? meta.source ?? meta.document ?? "") as string;
    const sec = meta.chunk_index !== undefined ? `Chunk ${meta.chunk_index}` : (meta.section ?? meta.page ?? "") as string;
    const textSnippet = (meta.text ?? meta.content ?? meta.chunk_text ?? "") as string;
    console.log(
      `  [${i + 1}] score=${match.score?.toFixed(4)} | source=${src} | section=${sec}`
    );
    console.log(`      Text: "${textSnippet.substring(0, 200).replace(/\n/g, " ")}..."`);
  });

  const sources = queryResponse.matches
    .filter((match) => match.metadata)
    .map((match) => {
      const meta = match.metadata!;
      return {
        text: (meta.text ?? meta.content ?? meta.chunk_text ?? "") as string,
        source: (meta.filename ??
          meta.file_name ??
          meta.source ??
          meta.document ??
          "Unknown") as string,
        section:
          meta.chunk_index !== undefined
            ? `Chunk ${meta.chunk_index}`
            : ((meta.section ?? meta.page ?? "") as string),
      };
    });

  const avgScore =
    queryResponse.matches.reduce((sum, m) => sum + (m.score ?? 0), 0) /
    queryResponse.matches.length;
  if (avgScore < 0.4) {
    console.warn(
      `⚠️  [Pinecone] LOW similarity scores (avg: ${avgScore.toFixed(4)}) — possible embedding model mismatch!`,
    );
    console.warn("   Expected: scores > 0.7 for good semantic matches");
    console.warn("   Check: what model was used to ingest this data?");
  }

  if (sources.length === 0) {
    console.warn("⚠️  [Pinecone] No sources found — context will be empty");
  } else {
    console.log(`✅ [Pinecone] ${sources.length} source(s) passed to LLM\n`);
  }

  return sources;
}
