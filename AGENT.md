# AGENT.md - AI Image Generation GUI

## Commands
- **Start Dev**: `npm run dev` (uses nodemon) or `npm start`
- **Test**: No test suite configured yet (`npm test` returns placeholder)
- **Dependencies**: `npm install`

## Architecture
- **Tech Stack**: Node.js/Express backend, filesystem-based JSON storage, OpenAI integration
- **Structure**: 3-tier hierarchy - Project → Campaign → Request → Approved Examples
- **API**: REST endpoints in `src/server.js` (port 3000)
- **Services**: `src/services/` - fileService, openaiService, uploadService, scheduledTasksService
- **Data Models**: `src/models/schemas.js` for default structures
- **Storage**: `projects/{name}.json`, `assets/{project}/{campaign}/{request}/`, logs in same structure

## Code Style & Conventions
- **Environment**: Requires `OPENAI_API_KEY` in `.env`
- **Error Handling**: Try-catch with 500 status responses, consistent error messaging
- **File Paths**: Use path.join() for cross-platform compatibility
- **JSON Storage**: Structured filesystem approach, not database
- **Naming**: camelCase for variables/functions, kebab-case for file/folder names
- **Imports**: CommonJS (`require`), services injected via constructor pattern

## Key Context (from CLAUDE.md)
- AI workflow: raw prompt → context building → Chat API optimization → Image API generation
- Reference library system with pin/unpin at project and campaign levels
- Feedback loop for iterative improvement on rejected images
- Always show optimized prompt to user before generation for transparency
