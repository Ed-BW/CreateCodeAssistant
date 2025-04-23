# Create Code Assistant

A smart code assistant for API documentation, built with Vue.js, Supabase Vector, and OpenAI.

## Project Overview

This application allows users to ask natural language questions about APIs and receive accurate answers with code examples. It uses:

- **Vue.js** frontend for the user interface
- **Supabase Vector** for similarity search of API documentation
- **OpenAI Embeddings** for vectorizing text
- **OpenAI API** for generating natural language answers
- **Cloudflare Workers** for serverless backend

## Setup Instructions

### Prerequisites

- Node.js 16+ and npm
- Supabase account
- OpenAI API key
- Cloudflare account (for deployment)

### Local Development

1. Clone the repository

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with your API keys (see `.env.example` for required variables)

4. Process the JSON documentation files:
   ```
   npm run chunk
   ```

5. Generate embeddings and store in Supabase:
   ```
   npm run embed
   ```

6. Start the development server:
   ```
   npm run dev
   ```

### Supabase Setup

1. Create a new Supabase project
2. Enable Vector extension in the SQL editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

3. Create a table for the API documentation:
   ```sql
   CREATE TABLE api_docs (
     id TEXT PRIMARY KEY,
     class_name TEXT NOT NULL,
     class_description TEXT,
     category TEXT,
     method_name TEXT NOT NULL,
     summary TEXT,
     signature TEXT,
     since TEXT,
     description TEXT,
     parameters JSONB,
     return_value JSONB,
     examples JSONB,
     metadata JSONB,
     content TEXT,
     embedding VECTOR(1536)
   );
   ```

4. Create a stored function for similarity search:
   ```sql
   CREATE OR REPLACE FUNCTION match_documents(
     query_embedding VECTOR(1536),
     match_threshold FLOAT,
     match_count INT
   ) 
   RETURNS TABLE (
     id TEXT,
     class_name TEXT,
     class_description TEXT,
     category TEXT,
     method_name TEXT,
     summary TEXT,
     signature TEXT,
     since TEXT,
     description TEXT,
     parameters JSONB,
     return_value JSONB,
     examples JSONB,
     metadata JSONB,
     content TEXT,
     similarity FLOAT
   )
   LANGUAGE plpgsql
   AS $$
   BEGIN
     RETURN QUERY
     SELECT
       api_docs.id,
       api_docs.class_name,
       api_docs.class_description,
       api_docs.category,
       api_docs.method_name,
       api_docs.summary,
       api_docs.signature,
       api_docs.since,
       api_docs.description,
       api_docs.parameters,
       api_docs.return_value,
       api_docs.examples,
       api_docs.metadata,
       api_docs.content,
       1 - (api_docs.embedding <=> query_embedding) AS similarity
     FROM api_docs
     WHERE 1 - (api_docs.embedding <=> query_embedding) > match_threshold
     ORDER BY similarity DESC
     LIMIT match_count;
   END;
   $$;
   ```

### Cloudflare Workers Deployment

1. Install Wrangler CLI:
   ```
   npm install -g wrangler
   ```

2. Log in to Cloudflare:
   ```
   wrangler login
   ```

3. Publish the worker:
   ```
   wrangler publish
   ```

## Project Structure

- `/src` - Vue frontend code
  - `/components` - Vue components
  - `/assets` - Static assets
- `/data` - Data processing scripts and outputs
  - `/raw` - Original JSON documentation files
  - `/chunks` - Processed documentation chunks
- `/functions` - Cloudflare Workers code
  - `/api` - API endpoints

## License

MIT 