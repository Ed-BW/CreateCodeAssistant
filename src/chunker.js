const fs = require('fs');
const path = require('path');

// Configuration
const INPUT_DIR = path.join(__dirname, '../data/raw');
const OUTPUT_DIR = path.join(__dirname, '../data/chunks');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Process a single JSON file
function processFile(filePath) {
  console.log(`Processing ${filePath}...`);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(fileContent);
  
  const chunks = [];
  const category = data.category;
  
  // Process each class in the file
  data.classes.forEach(classInfo => {
    const className = classInfo.name;
    const classDescription = classInfo.description;
    
    // Process each method in the class
    classInfo.methods.forEach(method => {
      // Create a chunk that keeps method details together
      const chunk = {
        class: className,
        class_description: classDescription,
        category: category,
        method: method.name,
        summary: method.summary,
        signature: method.signature,
        since: method.since || '',
        description: method.description,
        parameters: method.parameters || [],
        return_value: method.return_value || {},
        examples: method.examples || []
      };
      
      // Add metadata that will help with retrieval
      chunk.metadata = {
        source_file: path.basename(filePath),
        param_count: (method.parameters || []).length,
        has_examples: (method.examples || []).length > 0,
        intent_keywords: extractIntentKeywords(method),
      };
      
      chunks.push(chunk);
    });
  });
  
  return chunks;
}

// Extract keywords that might help identify the intent of the method
function extractIntentKeywords(method) {
  const keywords = new Set();
  const text = `${method.name} ${method.summary} ${method.description}`.toLowerCase();
  
  // Common intent patterns
  const patterns = [
    { words: ['get', 'fetch', 'return', 'retrieve'], intent: 'get' },
    { words: ['set', 'update', 'change', 'modify'], intent: 'set' },
    { words: ['add', 'insert', 'append', 'create'], intent: 'create' },
    { words: ['remove', 'delete', 'clear'], intent: 'delete' },
    { words: ['validate', 'check', 'verify'], intent: 'validate' }
  ];
  
  // Add intent keywords based on text content
  patterns.forEach(pattern => {
    if (pattern.words.some(word => text.includes(word))) {
      keywords.add(pattern.intent);
    }
  });
  
  return Array.from(keywords);
}

// Process all JSON files in the input directory
function processAllFiles() {
  const allChunks = [];
  
  const files = fs.readdirSync(INPUT_DIR)
    .filter(file => file.endsWith('.json'));
  
  files.forEach(file => {
    const filePath = path.join(INPUT_DIR, file);
    const fileChunks = processFile(filePath);
    
    // Add chunks to our collection
    allChunks.push(...fileChunks);
    
    // Also save chunks for each file separately
    const outputFilePath = path.join(OUTPUT_DIR, `${path.basename(file, '.json')}_chunks.json`);
    fs.writeFileSync(
      outputFilePath, 
      JSON.stringify(fileChunks, null, 2)
    );
    
    console.log(`Saved ${fileChunks.length} chunks to ${outputFilePath}`);
  });
  
  // Save all chunks together
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'all_chunks.json'),
    JSON.stringify(allChunks, null, 2)
  );
  
  console.log(`Processed ${files.length} files. Total chunks: ${allChunks.length}`);
}

// If run directly
if (require.main === module) {
  // Make sure the directories exist
  if (!fs.existsSync(INPUT_DIR)) {
    fs.mkdirSync(INPUT_DIR, { recursive: true });
    console.log(`Created input directory at ${INPUT_DIR}`);
    console.log(`Please place your JSON files in this directory and run the script again.`);
    process.exit(0);
  }
  
  processAllFiles();
} 