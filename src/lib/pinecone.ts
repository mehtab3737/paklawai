import { Pinecone } from '@pinecone-database/pinecone'
import OpenAI from 'openai'
import type { Source } from '@/types'

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! })
const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export async function queryPinecone(queryText: string, topK: number = 5): Promise<Source[]> {
  const embeddingResponse = await openaiClient.embeddings.create({
    model: 'text-embedding-3-small',
    input: queryText,
  })
  const embedding = embeddingResponse.data[0].embedding

  const index = pinecone.index(process.env.PINECONE_INDEX_NAME!)
  const queryResponse = await index.query({
    vector: embedding,
    topK,
    includeMetadata: true,
  })

  return queryResponse.matches
    .filter((match) => match.metadata)
    .map((match) => ({
      text: (match.metadata!.text as string) || '',
      source: (match.metadata!.source as string) || '',
      section: (match.metadata!.section as string) || '',
    }))
}
