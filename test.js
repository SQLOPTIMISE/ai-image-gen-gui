// Simple test script to verify API endpoints
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

async function testAPI() {
    console.log('🧪 Testing AI Image Generation GUI API...\n');

    try {
        // Test health endpoint
        console.log('1. Testing health endpoint...');
        const healthResponse = await fetch(`${BASE_URL}/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Health check:', healthData.status);
        console.log('   OpenAI connection:', healthData.openai);

        // Test create project
        console.log('\n2. Testing create project...');
        const projectData = {
            name: 'Test Project',
            styleGuide: 'Modern minimalist design with clean lines and vibrant colors',
            references: ['modern art', 'minimalist design']
        };
        
        const createProjectResponse = await fetch(`${BASE_URL}/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projectData)
        });
        
        if (createProjectResponse.ok) {
            const project = await createProjectResponse.json();
            console.log('✅ Project created:', project.name);
        } else {
            const error = await createProjectResponse.json();
            console.log('❌ Project creation failed:', error.error);
        }

        // Test list projects
        console.log('\n3. Testing list projects...');
        const listProjectsResponse = await fetch(`${BASE_URL}/projects`);
        const projects = await listProjectsResponse.json();
        console.log('✅ Projects listed:', projects.length, 'projects found');

        if (projects.length > 0) {
            const projectName = projects[0].name;
            
            // Test create campaign
            console.log('\n4. Testing create campaign...');
            const campaignData = {
                name: 'Summer Campaign',
                description: 'Bright and energetic summer-themed visuals',
                palette: ['orange', 'yellow', 'turquoise'],
                sloganTemplates: ['Summer vibes', 'Feel the heat']
            };
            
            const createCampaignResponse = await fetch(`${BASE_URL}/projects/${encodeURIComponent(projectName)}/campaigns`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(campaignData)
            });
            
            if (createCampaignResponse.ok) {
                const campaign = await createCampaignResponse.json();
                console.log('✅ Campaign created:', campaign.name);
                
                // Test create request
                console.log('\n5. Testing create request...');
                const requestData = {
                    rawPrompt: 'A beautiful sunset over the ocean with palm trees'
                };
                
                const createRequestResponse = await fetch(`${BASE_URL}/projects/${encodeURIComponent(projectName)}/campaigns/${encodeURIComponent(campaign.name)}/requests`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestData)
                });
                
                if (createRequestResponse.ok) {
                    const request = await createRequestResponse.json();
                    console.log('✅ Request created:', request.id);
                    console.log('   Prompt:', request.rawPrompt);
                } else {
                    const error = await createRequestResponse.json();
                    console.log('❌ Request creation failed:', error.error);
                }
            } else {
                const error = await createCampaignResponse.json();
                console.log('❌ Campaign creation failed:', error.error);
            }
        }

        console.log('\n🎉 API tests completed!');
        console.log('\n📝 Next steps:');
        console.log('   - Open http://localhost:3000 in your browser');
        console.log('   - Create a project through the UI');
        console.log('   - Test the image generation workflow');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Add node-fetch for compatibility
if (typeof fetch === 'undefined') {
    global.fetch = require('node-fetch');
}

testAPI();