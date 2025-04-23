<template>
  <div class="search-container">
    <form @submit.prevent="handleSubmit" class="search-form">
      <input
        type="text"
        v-model="query"
        placeholder="Ask for code examples or how to implement a feature (e.g., 'How do I create a dropdown with presenter?')"
        class="search-input"
        :disabled="isLoading"
        ref="searchInput"
      />
      <button type="submit" class="search-button" :disabled="isLoading || !query.trim()">
        <span v-if="isLoading">Generating...</span>
        <span v-else>Generate Code</span>
      </button>
    </form>
    <div class="search-examples">
      <p>Try asking:</p>
      <div class="examples-list">
        <button 
          v-for="(example, index) in examples" 
          :key="index" 
          @click="useExample(example)"
          class="example-button"
          :disabled="isLoading"
        >
          {{ example }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SearchBar',
  props: {
    isLoading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      query: '',
      examples: [
        'Write code to get a setting from the presenter',
        'Create a function that shows a widget after 5 seconds',
        'How to use component methods with error handling',
        'Write a function to handle form submission and validate inputs'
      ]
    };
  },
  mounted() {
    // Focus the search input when component is mounted
    this.$refs.searchInput.focus();
  },
  methods: {
    handleSubmit() {
      if (this.query.trim() && !this.isLoading) {
        this.$emit('search', this.query.trim());
      }
    },
    useExample(example) {
      this.query = example;
      this.handleSubmit();
    }
  }
};
</script>

<style scoped>
.search-container {
  margin: 2rem 0;
}

.search-form {
  display: flex;
  gap: 0.5rem;
}

.search-input {
  flex: 1;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.search-button {
  min-width: 140px;
  background-color: var(--primary-color);
  color: white;
  font-weight: 500;
}

.search-examples {
  margin-top: 1rem;
}

.examples-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.example-button {
  background-color: var(--light-gray);
  color: var(--dark-gray);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.example-button:hover {
  background-color: var(--border-color);
}
</style> 