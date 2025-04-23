const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

// Load environment variables from .env file
require('dotenv').config();

// Configuration
const CHUNKS_PATH = path.join(__dirname, '../data/chunks/all_chunks.json');
const EMBEDDING_MODEL = 'text-embedding-3-small';
const BATCH_SIZE = 100; // Process in batches to avoid rate limits

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Create a search string for embedding from a chunk
function createEmbeddingText(chunk) {
  // Start with class and method for context
  let text = `${chunk.class}.${chunk.method}: ${chunk.summary}\n\n`;
  
  // Add description
  text += `${chunk.description}\n\n`;
  
  // Add signature
  text += `Signature: ${chunk.signature}\n`;
  
  // Add parameters if any
  if (chunk.parameters && chunk.parameters.length > 0) {
    text += 'Parameters:\n';
    chunk.parameters.forEach(param => {
      text += `- ${param.name} (${param.type}): ${param.description}\n`;
    });
    text += '\n';
  }
  
  // Add return value
  if (chunk.return_value && chunk.return_value.type) {
    text += `Returns: ${chunk.return_value.type} - ${chunk.return_value.description}\n\n`;
  }
  
  // Add examples (first example only to keep embedding text shorter)
  if (chunk.examples && chunk.examples.length > 0) {
    const example = chunk.examples[0];
    text += `Example: ${example.title}\n${example.description}\n`;
    if (example.code) {
      text += `Code: ${example.code}\n`;
    }
  }
  
  return text;
}

// Create vector embeddings for chunks
async function createEmbeddings(chunks) {
  console.log(`Creating embeddings for ${chunks.length} chunks`);
  
  // Process in batches
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batchChunks = chunks.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${i / BATCH_SIZE + 1} (${batchChunks.length} chunks)`);
    
    const embeddingTexts = batchChunks.map(createEmbeddingText);
    
    try {
      // Generate embeddings
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: embeddingTexts
      });
      
      // Add embeddings to chunks
      for (let j = 0; j < batchChunks.length; j++) {
        batchChunks[j].embedding = response.data[j].embedding;
      }
      
      console.log(`Batch ${i / BATCH_SIZE + 1} completed`);
      
      // Wait briefly to avoid rate limits
      if (i + BATCH_SIZE < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error('Error creating embeddings:', error);
      throw error;
    }
  }
  
  return chunks;
}

// Store embeddings in Supabase
async function storeEmbeddings(chunks) {
  console.log('Storing embeddings in Supabase...');
  
  // Create a map to deduplicate chunks with the same ID
  const uniqueRecords = new Map();
  
  // Prepare data for insertion, ensuring unique IDs
  chunks.forEach(chunk => {
    const id = `${chunk.class}.${chunk.method}`;
    // If duplicate, keep the one with the highest "score" or just the last one
    uniqueRecords.set(id, {
      id: id,
      class_name: chunk.class,
      class_description: chunk.class_description,
      category: chunk.category,
      method_name: chunk.method,
      summary: chunk.summary,
      signature: chunk.signature,
      since: chunk.since,
      description: chunk.description,
      parameters: JSON.stringify(chunk.parameters),
      return_value: JSON.stringify(chunk.return_value),
      examples: JSON.stringify(chunk.examples),
      metadata: JSON.stringify(chunk.metadata),
      content: createEmbeddingText(chunk),
      embedding: chunk.embedding
    });
  });
  
  // Convert map to array
  const records = Array.from(uniqueRecords.values());
  console.log(`Prepared ${records.length} unique records for insertion (from ${chunks.length} original chunks)`);
  
  // Insert in batches
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    console.log(`Inserting batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} records)`);
    
    try {
      // First try with upsert
      const { error } = await supabase
        .from('api_docs')
        .upsert(batch, { onConflict: 'id' });
      
      if (error) {
        console.log(`Error with upsert, trying individual inserts: ${error.message}`);
        
        // If upsert fails, try inserting records one by one
        for (const record of batch) {
          // First delete if exists
          await supabase
            .from('api_docs')
            .delete()
            .eq('id', record.id);
          
          // Then insert
          const { error: insertError } = await supabase
            .from('api_docs')
            .insert(record);
          
          if (insertError) {
            console.error(`Error inserting record ${record.id}: ${insertError.message}`);
          }
        }
      }
      
      console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1} inserted`);
    } catch (error) {
      console.error('Error inserting embeddings:', error);
      throw error;
    }
  }
  
  console.log('All embeddings stored successfully');
}

// Main function
async function main() {
  // Load chunks
  if (!fs.existsSync(CHUNKS_PATH)) {
    console.error(`Chunks file not found: ${CHUNKS_PATH}`);
    console.log('Please run the chunker.js script first');
    process.exit(1);
  }
  
  const chunks = JSON.parse(fs.readFileSync(CHUNKS_PATH, 'utf8'));
  console.log(`Loaded ${chunks.length} chunks`);
  
  // Create embeddings
  const chunksWithEmbeddings = await createEmbeddings(chunks);
  
  // Save embeddings locally (backup)
  const embedsOutputPath = path.join(__dirname, '../data/chunks/chunks_with_embeddings.json');
  fs.writeFileSync(embedsOutputPath, JSON.stringify(chunksWithEmbeddings, null, 2));
  console.log(`Saved chunks with embeddings to ${embedsOutputPath}`);
  
  // Store in Supabase
  await storeEmbeddings(chunksWithEmbeddings);
}

// Run the script if executed directly
if (require.main === module) {
  main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
} 