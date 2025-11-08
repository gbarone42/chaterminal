#!/usr/bin/env node
import OpenAI from 'openai';
import readlineSync from 'readline-sync';

// Check for API key
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('\nError: OPENAI_API_KEY environment variable is not set.');
  console.error('Please set it with: export OPENAI_API_KEY=your_api_key\n');
  process.exit(1);
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: apiKey
});

// Initialize chat history
const messages = [{
  role: 'system',
  content: 'You are a helpful assistant that provides clear and concise responses.'
}];

console.log('\nChat CLI - Type "exit" to quit\n');

// Main chat loop
while (true) {
  const userInput = readlineSync.question('You: ').trim();
  
  // Check for exit command
  if (userInput.toLowerCase() === 'exit') {
    console.log('\nGoodbye!\n');
    process.exit(0);
  }

  // Add user message to history
  messages.push({ role: 'user', content: userInput });

  try {
    // Call OpenAI API with streaming
    const stream = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      stream: true,
    });

    process.stdout.write('Assistant: ');
    let assistantResponse = '';

    // Process the stream
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        process.stdout.write(content);
        assistantResponse += content;
      }
    }
    process.stdout.write('\n\n');

    // Add assistant's response to history
    messages.push({ role: 'assistant', content: assistantResponse });

  } catch (error) {
    console.error('\nError:', error.message);
    if (error.response?.status === 401) {
      console.error('Invalid API key. Please check your OPENAI_API_KEY environment variable.\n');
      process.exit(1);
    }
    messages.pop(); // Remove the failed message from history
  }
}