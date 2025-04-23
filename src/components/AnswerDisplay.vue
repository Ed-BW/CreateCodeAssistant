<template>
  <div class="answer-display">
    <div class="answer-content card">
      <h2 class="answer-heading">{{ answer.query }}</h2>
      <p v-if="answer.explanation" class="answer-explanation">
        {{ answer.explanation }}
      </p>
    </div>

    <div v-if="answer.methodInfo" class="method-info card">
      <div class="method-header">
        <span class="method-class">{{ answer.methodInfo.class }}</span>
        <h3 class="method-name">{{ answer.methodInfo.method }}</h3>
      </div>
      
      <div class="method-signature">{{ answer.methodInfo.signature }}</div>
      
      <p class="method-description">{{ answer.methodInfo.description }}</p>
      
      <div v-if="answer.methodInfo.parameters && answer.methodInfo.parameters.length > 0" class="method-parameters">
        <h4>Parameters</h4>
        <ul class="parameters-list">
          <li v-for="(param, index) in answer.methodInfo.parameters" :key="index" class="parameter-item">
            <span class="parameter-name">{{ param.name }}</span>
            <span class="parameter-type">({{ param.type }})</span>
            <p class="parameter-description">{{ param.description }}</p>
          </li>
        </ul>
      </div>
      
      <div v-if="answer.methodInfo.examples && answer.methodInfo.examples.length > 0" class="method-examples">
        <h4>Examples</h4>
        <div v-for="(example, index) in answer.methodInfo.examples" :key="index" class="example">
          <h5 class="example-title">{{ example.title }}</h5>
          <p v-if="example.description" class="example-description">{{ example.description }}</p>
          <pre v-if="example.code" class="code example-code">{{ example.code }}</pre>
          <pre v-if="example.output" class="code example-output">{{ example.output }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AnswerDisplay',
  props: {
    answer: {
      type: Object,
      required: true
    }
  }
};
</script>

<style scoped>
.answer-display {
  margin-bottom: 2rem;
}

.answer-heading {
  font-size: 1.4rem;
  margin-bottom: 1rem;
}

.answer-explanation {
  font-size: 1.05rem;
  line-height: 1.6;
}

.method-info {
  margin-top: 1.5rem;
}

.method-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.method-class {
  font-size: 1rem;
  color: var(--dark-gray);
  margin-right: 0.5rem;
}

.method-name {
  font-size: 1.3rem;
  margin: 0;
}

.method-signature {
  font-family: 'Fira Code', monospace;
  background-color: var(--code-background);
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  font-weight: 600;
  overflow-x: auto;
}

.method-description {
  margin-bottom: 1.5rem;
}

.method-parameters h4,
.method-examples h4 {
  margin-bottom: 0.75rem;
  font-size: 1.1rem;
}

.parameter-item {
  margin-bottom: 1rem;
  list-style-type: none;
}

.parameter-name {
  font-weight: 600;
  margin-right: 0.25rem;
}

.parameter-type {
  color: var(--dark-gray);
  font-size: 0.9rem;
}

.parameter-description {
  margin-top: 0.25rem;
  margin-bottom: 0;
}

.method-examples {
  margin-top: 1.5rem;
}

.example {
  margin-bottom: 1.5rem;
}

.example-title {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.example-description {
  margin-bottom: 0.75rem;
}

.example-code,
.example-output {
  margin-bottom: 0.75rem;
}
</style> 