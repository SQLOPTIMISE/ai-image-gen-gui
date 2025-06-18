// Debug script to test image generation workflow
require('dotenv').config();

const OpenAIService = require('./src/services/openaiService');
const FileService = require('./src/services/fileService');
const { createDefaultProject, createDefaultCampaign, createDefaultRequest } = require('./src/models/schemas');

async function debugGeneration() {
    console.log('🔍 Debugging Image Generation Workflow...\n');

    try {
        // Initialize services
        const openaiService = new OpenAIService();
        const fileService = new FileService();

        console.log('1. Testing OpenAI connection...');
        const connected = await openaiService.testConnection();
        console.log(`   OpenAI connected: ${connected}`);

        if (!connected) {
            console.log('❌ OpenAI connection failed. Check your API key.');
            return;
        }

        console.log('\n2. Testing prompt optimization...');
        const context = {
            projectName: 'Test Project',
            styleGuide: 'Modern minimalist design with clean lines',
            campaignName: 'Test Campaign',
            campaignDescription: 'Bright and energetic visuals',
            palette: ['blue', 'white'],
            sloganTemplates: ['Test slogan']
        };

        try {
            const optimizedPrompt = await openaiService.optimizePrompt(
                'A beautiful sunset over the ocean',
                context,
                [],
                ''
            );
            console.log(`   ✅ Prompt optimized: "${optimizedPrompt.substring(0, 100)}..."`);

            console.log('\n3. Testing image generation...');
            const imageResult = await openaiService.generateImage(optimizedPrompt);
            console.log(`   ✅ Image generated: ${imageResult.imageUrl}`);
            console.log(`   Revised prompt: "${imageResult.revisedPrompt?.substring(0, 100)}..."`);

            console.log('\n4. Testing image download...');
            const imageBuffer = await openaiService.downloadImage(imageResult.imageUrl);
            console.log(`   ✅ Image downloaded: ${imageBuffer.length} bytes`);

            console.log('\n5. Testing complete workflow...');
            const completeResult = await openaiService.generateComplete(
                'A beautiful sunset over the ocean',
                context,
                [],
                ''
            );

            if (completeResult.success) {
                console.log('   ✅ Complete workflow succeeded!');
                console.log(`   Image buffer size: ${completeResult.imageBuffer.length} bytes`);
                console.log(`   Optimized prompt: "${completeResult.optimizedPrompt.substring(0, 100)}..."`);
            } else {
                console.log(`   ❌ Complete workflow failed: ${completeResult.error}`);
            }

        } catch (promptError) {
            console.log(`   ❌ Prompt optimization failed: ${promptError.message}`);
            console.log('   Full error:', promptError);
        }

        console.log('\n6. Testing file operations...');
        
        // Test directory creation
        await fileService.ensureDirectoryExists('./test-assets');
        console.log('   ✅ Directory creation works');

        // Test project creation
        const testProject = createDefaultProject('Debug Project', 'Test style guide');
        await fileService.saveProject('debug-project', testProject);
        console.log('   ✅ Project saving works');

        const retrievedProject = await fileService.getProject('debug-project');
        console.log(`   ✅ Project retrieval works: ${retrievedProject.name}`);

        console.log('\n🎉 Debug completed!');

    } catch (error) {
        console.error('❌ Debug failed:', error);
        console.error('Stack trace:', error.stack);
    }
}

debugGeneration();