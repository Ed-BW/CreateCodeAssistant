// Cloudflare Worker for NetCall Assistant API

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Supabase client (using Cloudflare environment variables)
const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_KEY
);

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
});

export async function onRequest(context) {
  // Extract the request
  const request = context.request;
  
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
  
  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  
  try {
    // Parse the request JSON
    const { query } = await request.json();
    
    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Generate an embedding for the query
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query
      })
    });
    
    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data[0].embedding;
    
    // Search for the most relevant chunks
    const { data: matchingChunks, error } = await supabase
      .rpc('match_documents', {
        query_embedding: embedding,
        match_threshold: 0.5,
        match_count: 5
      });
    
    if (error) {
      throw new Error(`Error searching for documents: ${error.message}`);
    }
    
    // Prepare context for Claude
    const context = matchingChunks.map(chunk => {
      // Parse JSON fields
      const parameters = JSON.parse(chunk.parameters);
      const returnValue = JSON.parse(chunk.return_value);
      const examples = JSON.parse(chunk.examples);
      
      return {
        class: chunk.class_name,
        method: chunk.method_name,
        signature: chunk.signature,
        description: chunk.description,
        parameters,
        return_value: returnValue,
        examples,
        score: chunk.similarity
      };
    });
    
    // Construct a prompt for Claude
    const prompt = `
You are a helpful API documentation assistant for NetCall. 
You are given the following API method documentation to answer the user's question.

USER QUESTION: ${query}

RELEVANT API METHODS:
${JSON.stringify(context, null, 2)}

Based solely on the above API documentation, provide a comprehensive answer. Include:
1. A summary of the most relevant method(s) that address the user's question
2. Parameter explanations if asked about usage
3. Example code if available
4. Any helpful tips about using the method correctly

If the user's question cannot be answered with the provided documentation, say so clearly.
Do not make up information that isn't in the provided context.

Your response should be in JSON format with these fields:
- query: The original query
- methodInfo: Details about the most relevant method (class, method, signature, description, parameters, examples)
- explanation: A clear explanation addressing the user's question

IMPORTANT: Return ONLY valid JSON, nothing else.
`;

    // Call Claude API to generate an answer
    const claudeResponse = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4000,
      temperature: 0.3,
      system: "You are an AI assistant that specializes in NetCall API documentation. You provide accurate, helpful responses based only on the provided documentation. Always return your response as valid JSON as specified in the prompt.",
      messages: [
        { role: 'user', content: prompt }
      ]
    });
    
    // Parse Claude's response as JSON
    const claudeContent = claudeResponse.content[0].text;
    const answer = JSON.parse(claudeContent);
    
    // Return the answer
    return new Response(JSON.stringify(answer), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    
    return new Response(JSON.stringify({ error: 'An error occurred processing your request' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
} 