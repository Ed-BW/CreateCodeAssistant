// Test connections to APIs
const { createClient } = require('@supabase/supabase-js');
const { OpenAI } = require('openai');
require('dotenv').config();

async function testConnections() {
  console.log('Testing API connections...\n');

  // Test OpenAI connection
  console.log('1. Testing OpenAI API connection:');
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // Simple test call to the OpenAI API
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: 'Hello, world!'
    });
    
    if (embeddingResponse && embeddingResponse.data && embeddingResponse.data.length > 0) {
      console.log('   ✅ OpenAI API connection successful!');
      console.log(`   - Embedding dimension: ${embeddingResponse.data[0].embedding.length}`);
    } else {
      console.log('   ❌ OpenAI API returned unexpected response format.');
    }
  } catch (error) {
    console.log('   ❌ OpenAI API connection failed:');
    console.error(`   - Error: ${error.message}`);
  }
  
  // Test Supabase connection
  console.log('\n2. Testing Supabase connection:');
  try {
    console.log(`   Using URL: ${process.env.SUPABASE_URL}`);
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );
    
    // Test simple ping to Supabase
    const { data: pingData, error: pingError } = await supabase.from('api_docs').select('*').limit(1);
    
    if (pingError) {
      console.log('   ❌ Supabase query failed:');
      console.error(`   - Error: ${pingError.message || JSON.stringify(pingError)}`);
    } else {
      console.log('   ✅ Supabase connection successful!');
      console.log('   - api_docs table is accessible');
      
      // Test vector extension
      try {
        const { data: vectorTest, error: vectorError } = await supabase
          .rpc('match_documents', {
            query_embedding: Array(1536).fill(0.1),
            match_threshold: 0.5,
            match_count: 1
          });
        
        if (vectorError) {
          console.log('   ❌ Vector search function test failed:');
          console.error(`   - Error: ${vectorError.message || JSON.stringify(vectorError)}`);
        } else {
          console.log('   ✅ Vector search function is working!');
        }
      } catch (vectorTestError) {
        console.log('   ❌ Vector search function test failed:');
        console.error(`   - Error: ${vectorTestError.message || JSON.stringify(vectorTestError)}`);
      }
    }
  } catch (error) {
    console.log('   ❌ Supabase connection failed:');
    console.error(`   - Error: ${error.message || JSON.stringify(error)}`);
  }
  
  console.log('\nConnection tests completed.');
}

// Run the tests
testConnections().catch(err => {
  console.error('Unhandled error in test script:', err);
}); 