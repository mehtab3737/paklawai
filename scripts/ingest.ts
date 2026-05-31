import * as fs from 'fs'
import * as path from 'path'
import OpenAI from 'openai'
import { Pinecone } from '@pinecone-database/pinecone'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! })

const CHUNK_SIZE = 500
const CHUNK_OVERLAP = 50
const INDEX_NAME = process.env.PINECONE_INDEX_NAME ?? 'legal-docs'
const DATA_DIR = path.join(process.cwd(), 'data')

function chunkText(text: string, size: number, overlap: number): string[] {
  const words = text.split(/\s+/)
  const chunks: string[] = []
  let i = 0
  while (i < words.length) {
    chunks.push(words.slice(i, i + size).join(' '))
    i += size - overlap
  }
  return chunks
}

async function ingestFile(filePath: string) {
  const filename = path.basename(filePath)
  const content = fs.readFileSync(filePath, 'utf-8')
  const chunks = chunkText(content, CHUNK_SIZE, CHUNK_OVERLAP)
  const index = pinecone.index(INDEX_NAME)
  const total = chunks.length

  console.log(`\n📄 Ingesting ${filename} — ${total} chunks`)

  const BATCH = 50
  for (let b = 0; b < chunks.length; b += BATCH) {
    const batch = chunks.slice(b, b + BATCH)
    const embeddings = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: batch,
    })

    const vectors = embeddings.data.map((item, j) => ({
      id: `${filename}-chunk-${b + j}`,
      values: item.embedding,
      metadata: {
        text: batch[j],
        source: filename,
        section: `chunk-${b + j}`,
      },
    }))

    await index.upsert({ records: vectors })

    for (let k = 0; k < batch.length; k++) {
      console.log(`  ✓ Ingested chunk ${b + k + 1}/${total} from ${filename}`)
    }
  }
}

async function main() {
  if (!fs.existsSync(DATA_DIR)) {
    console.error(`❌ /data directory not found. Create it and add .txt files.`)
    process.exit(1)
  }

  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.txt') || f.endsWith('.pdf'))

  if (files.length === 0) {
    console.error('❌ No .txt or .pdf files found in /data')
    process.exit(1)
  }

  console.log(`🚀 Starting ingestion of ${files.length} file(s) into Pinecone index: ${INDEX_NAME}`)

  for (const file of files) {
    await ingestFile(path.join(DATA_DIR, file))
  }

  console.log('\n✅ Ingestion complete!')
}

main().catch(console.error)
