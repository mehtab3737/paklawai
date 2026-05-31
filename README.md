# PakLaw AI — Pakistan Legal AI Chatbot

An AI-powered legal assistant for Pakistani law, built with Next.js 16, Supabase, Pinecone, and OpenAI.

## Features

- 🔐 Email/password auth with Supabase
- 💬 Streaming chat responses (GPT-4o-mini)
- 📚 RAG pipeline — answers grounded in real Pakistani law data (Pinecone)
- 📝 Full chat history per user
- ⚖️ Sources cited below every AI response
- 🌙 Dark mode, responsive UI

## Local Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd pakistan-law-chat

# 2. Install dependencies
npm install

# 3. Fill in environment variables
cp .env.local.example .env.local
# Then edit .env.local with your actual keys

# 4. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) |
| `OPENAI_API_KEY` | OpenAI API key |
| `PINECONE_API_KEY` | Pinecone API key |
| `PINECONE_INDEX_NAME` | Pinecone index name (e.g. `legal-docs`) |

## Supabase Setup

Run this SQL in your Supabase SQL Editor:

```sql
create table chat_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'New conversation',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table messages (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references chat_sessions(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  sources jsonb,
  created_at timestamptz default now()
);

create index on chat_sessions(user_id);
create index on messages(session_id);

alter table chat_sessions enable row level security;
alter table messages enable row level security;

create policy "Users manage their own sessions"
  on chat_sessions for all
  using (user_id = auth.uid());

create policy "Users access their own messages"
  on messages for all
  using (
    session_id in (
      select id from chat_sessions where user_id = auth.uid()
    )
  );
```

## Ingesting Law Data

1. Create a `/data` directory in the project root
2. Add `.txt` files containing Pakistani law text
3. Run the ingestion script:

```bash
npx ts-node -e "require('dotenv').config({path:'.env.local'})" scripts/ingest.ts
```

## Deploy to Vercel

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add all environment variables in the Vercel dashboard
4. Deploy — `vercel.json` handles the 30s timeout for the chat endpoint automatically
