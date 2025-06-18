// Check available OpenAI models
require('dotenv').config();
const OpenAI = require('openai');

async function checkModels() {
    const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });

    try {
        console.log('🔍 Checking available OpenAI models...\n');
        
        const models = await client.models.list();
        
        const chatModels = models.data.filter(model => 
            model.id.includes('gpt') || model.id.includes('chatgpt')
        ).map(model => model.id).sort();
        
        const imageModels = models.data.filter(model => 
            model.id.includes('dall-e')
        ).map(model => model.id).sort();
        
        console.log('Available Chat Models:');
        chatModels.forEach(model => console.log(`  - ${model}`));
        
        console.log('\nAvailable Image Models:');
        imageModels.forEach(model => console.log(`  - ${model}`));
        
        // Recommend the best available model
        let recommendedChatModel = 'gpt-3.5-turbo';
        if (chatModels.includes('gpt-4o-mini')) {
            recommendedChatModel = 'gpt-4o-mini';
        } else if (chatModels.includes('gpt-4-turbo')) {
            recommendedChatModel = 'gpt-4-turbo';
        } else if (chatModels.includes('gpt-4o')) {
            recommendedChatModel = 'gpt-4o';
        }
        
        console.log(`\n✅ Recommended chat model: ${recommendedChatModel}`);
        console.log(`✅ Recommended image model: dall-e-3`);
        
    } catch (error) {
        console.error('❌ Error checking models:', error.message);
    }
}

checkModels();