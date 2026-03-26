
// empty-module.js
'use strict';

// Anthropic stub
module.exports = {
    // For @anthropic-ai/sdk
    default: {
        Client: class {
            constructor() {}
            messages = {
                create: async () => { 
                    console.warn('Anthropic API not available');
                    return { content: [{ text: 'Anthropic API not available' }] };
                }
            }
        }
    },
    Client: class {
        constructor() {}
        messages = {
            create: async () => { 
                console.warn('Anthropic API not available');
                return { content: [{ text: 'Anthropic API not available' }] };
            }
        }
    },

    // For @mistralai/mistralai
    MistralClient: class {
        constructor() {}
        chat = {
            completions: {
                create: async () => {
                    console.warn('Mistral API not available');
                    return { choices: [{ message: { content: 'Mistral API not available' } }] };
                }
            }
        }
    },

    // For @google/generative-ai
    GoogleGenerativeAI: class {
        constructor() {}
        getGenerativeModel() {
            return {
                generateContent: async () => {
                    console.warn('Google AI API not available');
                    return { response: { text: () => 'Google AI API not available' } };
                }
            };
        }
    },

    // For groq-sdk
    Groq: class {
        constructor() {}
        chat = {
            completions: {
                create: async () => {
                    console.warn('Groq API not available');
                    return { choices: [{ message: { content: 'Groq API not available' } }] };
                }
            }
        }
    },

    // For ollama
    chat: async () => {
        console.warn('Ollama API not available');
        return { message: { content: 'Ollama API not available' } };
    }
};
