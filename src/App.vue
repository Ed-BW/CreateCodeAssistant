<template>
  <div class="app">
    <header class="header">
      <div class="container">
        <h1 class="title">Create Code Assistant</h1>
        <p class="subtitle">Ask for code examples or documentation</p>
      </div>
    </header>

    <main class="container main-content">
      <SearchBar @search="handleSearch" :isLoading="isLoading" />
      
      <div v-if="error" class="alert alert-error">
        {{ error }}
      </div>

      <div v-if="isLoading" class="loading">
        <p>Generating code solution...</p>
      </div>

      <div v-else-if="answer" class="result-container">
        <div class="panel-container">
          <!-- Left panel: Explanation -->
          <div class="explanation-panel">
            <div class="panel-header">
              <h2>Explanation</h2>
            </div>
            <div class="panel-content">
              <h3 class="query-text">{{ answer.query }}</h3>
              <p class="explanation-text">{{ answer.explanation }}</p>
              
              <div v-if="answer.methodInfo" class="method-info">
                <div class="method-header">
                  <span class="method-class">{{ answer.methodInfo.class }}</span>
                  <h4 class="method-name">{{ answer.methodInfo.method }}</h4>
                </div>
                <div class="method-signature">{{ answer.methodInfo.signature }}</div>
                <p class="method-description">{{ answer.methodInfo.description }}</p>
              </div>
            </div>
          </div>
          
          <!-- Right panel: Code -->
          <div class="code-panel">
            <div class="panel-header">
              <h2>Generated Code</h2>
              <button @click="copyCode" class="copy-button">
                <span v-if="copied">Copied!</span>
                <span v-else>Copy</span>
              </button>
            </div>
            <div class="panel-content">
              <pre v-if="generatedCode" class="code code-block" v-highlight><code class="javascript">{{ generatedCode }}</code></pre>
              <div v-else class="empty-code-state">
                <p>Your generated code will appear here</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <footer class="footer">
      <div class="container">
        <p></p>
      </div>
    </footer>
  </div>
</template>

<script>
import SearchBar from './components/SearchBar.vue';
import AnswerDisplay from './components/AnswerDisplay.vue';

export default {
  name: 'App',
  components: {
    SearchBar,
    AnswerDisplay
  },
  data() {
    return {
      query: '',
      answer: null,
      isLoading: false,
      error: null,
      generatedCode: null,
      copied: false
    };
  },
  methods: {
    async handleSearch(query) {
      this.query = query;
      this.isLoading = true;
      this.error = null;
      this.answer = null;
      this.generatedCode = null;
      this.copied = false;

      try {
        // In production, this would call your Cloudflare worker or other API
        // For now, we'll just simulate a delay
        const response = await this.fetchAnswer(query);
        this.answer = response;
        
        // Extract code from examples or generate code if needed
        if (response.methodInfo && response.methodInfo.examples && response.methodInfo.examples.length > 0) {
          // Use the first example's code
          this.generatedCode = response.methodInfo.examples[0].code;
        } else {
          // Generate a code example based on the method info
          this.generatedCode = this.generateCodeExample(response.methodInfo);
        }
      } catch (err) {
        console.error('Error fetching answer:', err);
        this.error = 'Sorry, there was an error processing your request. Please try again.';
      } finally {
        this.isLoading = false;
      }
    },
    
    // Generate a code example based on method info
    generateCodeExample(methodInfo) {
      if (!methodInfo) return null;
      
      // Create a simple code example based on the method information
      const className = methodInfo.class;
      const methodName = methodInfo.method;
      const params = methodInfo.parameters || [];
      
      // Generate parameter values based on their types
      const paramValues = params.map(param => {
        const type = param.type.toLowerCase();
        if (type.includes('string')) return `"example_${param.name}"`;
        if (type.includes('number')) return '42';
        if (type.includes('boolean')) return 'true';
        if (type.includes('array')) return '[]';
        if (type.includes('object')) return '{}';
        return 'null';
      });
      
      // Generate the code with proper formatting
      let code = `// Example using ${className}.${methodName}\n`;
      code += `function exampleFunction() {\n`;
      code += `  // Initialize the ${className}\n`;
      code += `  const ${className.toLowerCase()} = cs.get${className.charAt(0).toUpperCase() + className.slice(1)}();\n\n`;
      code += `  // Call the ${methodName} method\n`;
      code += `  const result = ${className.toLowerCase()}.${methodName}(${paramValues.join(', ')});\n\n`;
      code += `  // Log the result\n`;
      code += `  cs.log(result);\n`;
      code += `  return result;\n`;
      code += `}\n\n`;
      code += `// Execute the function\n`;
      code += `exampleFunction();`;
      
      return code;
    },
    
    // Copy code to clipboard
    copyCode() {
      if (!this.generatedCode) return;
      
      navigator.clipboard.writeText(this.generatedCode).then(() => {
        this.copied = true;
        setTimeout(() => {
          this.copied = false;
        }, 2000);
      });
    },
    
    // Mock API call - replace with actual API call to your backend
    async fetchAnswer(query) {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // This would be replaced with actual API call
      return {
        query: query,
        methodInfo: {
          class: 'presenter',
          method: 'get_setting',
          signature: 'presenter.get_setting(setting_name, default)',
          description: 'Return the value of a setting, as set by the builder in the Presenter.',
          parameters: [
            {
              name: 'setting_name',
              type: 'string',
              description: 'The key in the array returned by get_settings() in main.js'
            },
            {
              name: 'default',
              type: 'any',
              description: 'Explicit value to be returned by this function call if no value has been set in the widget by the builder'
            }
          ],
          examples: [
            {
              title: 'Retrieve a specific setting',
              description: 'Example of retrieving a setting with a default value',
              code: '// Get a setting from the presenter\nfunction getSetting() {\n  const presenter = cs.getPresenter();\n  \n  // Get the "example_number" setting with a default of "123"\n  const setting = presenter.get_setting("example_number", "123");\n  \n  cs.log("Setting value:", setting);\n  return setting;\n}\n\ngetSetting();',
              output: null
            }
          ]
        },
        explanation: 'The `presenter.get_setting()` method allows you to access configuration values from the Page Builder. It takes the setting name as a required parameter, and an optional default value that will be returned if the setting doesn\'t exist.'
      };
    }
  }
};
</script>

<style>
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header {
  background-color: var(--primary-color);
  color: white;
  padding: 2rem 0;
}

.title {
  margin-bottom: 0.5rem;
}

.subtitle {
  opacity: 0.9;
}

.main-content {
  flex: 1;
  padding: 2rem 0;
}

.loading {
  text-align: center;
  margin: 3rem 0;
  color: var(--dark-gray);
}

.result-container {
  margin-top: 2rem;
}

.panel-container {
  display: flex;
  gap: 1.5rem;
  min-height: 500px;
}

.explanation-panel,
.code-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.panel-header {
  padding: 1rem;
  background-color: var(--light-gray);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h2 {
  margin: 0;
  font-size: 1.2rem;
}

.panel-content {
  padding: 1.5rem;
  flex: 1;
  overflow-y: auto;
}

.query-text {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: var(--primary-color);
}

.explanation-text {
  line-height: 1.6;
  margin-bottom: 2rem;
}

.method-info {
  background-color: var(--light-gray);
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1.5rem;
}

.method-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.method-class {
  font-size: 0.9rem;
  color: var(--dark-gray);
  margin-right: 0.5rem;
}

.method-name {
  font-size: 1.1rem;
  margin: 0;
}

.method-signature {
  font-family: 'Fira Code', monospace;
  background-color: var(--code-background);
  padding: 0.5rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  font-weight: 600;
  font-size: 0.9rem;
}

.copy-button {
  background-color: transparent;
  color: var(--dark-gray);
  border: 1px solid var(--border-color);
  padding: 0.3rem 0.7rem;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.copy-button:hover {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.code-block {
  margin: 0;
  height: 100%;
  overflow-y: auto;
  font-size: 0.9rem;
  line-height: 1.5;
}

.empty-code-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--dark-gray);
  font-style: italic;
}

.footer {
  background-color: var(--light-gray);
  padding: 1rem 0;
  margin-top: auto;
}

@media (max-width: 768px) {
  .panel-container {
    flex-direction: column;
  }
}
</style> 