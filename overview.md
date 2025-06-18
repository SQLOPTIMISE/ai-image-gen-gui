# Image-Generation Pipeline (v1 GUI MVP)

## 1. Core Components

### 1.1 Project Definitions
- Stored as JSON files in `projects/{projectName}.json`
- Fields:
  - `name`: string
  - `styleGuide`: string
  - `references`: string[] (keywords or reference-image descriptors, project-level references)

### 1.2 Campaign Definitions
- Stored under each project in `projects/{projectName}/campaigns/{campaignName}.json`
- Fields:
  - `name`: string
  - `description`: string
  - `palette`: string[] (optional)
  - `sloganTemplates`: string[] (optional)
  - `references`: string[] (campaign-level reference images)

### 1.3 Image Requests
- Created/edited via GUI
- Metadata stored in JSON under
  `projects/{projectName}/campaigns/{campaignName}/requests/{requestId}.json`
- Fields:
  - `rawPrompt`: string
  - `status`: “Pending” | “Succeeded” | “Needs Feedback”
  - `feedback?`: string
  - `approvedExamples?`: reference to approved images

### 1.4 Reference Library
- Tracks all **approved** images + their final prompts
- Project-level and campaign-level references are both supported and used for prompt optimization
- Stored in
  `projects/{projectName}/campaigns/{campaignName}/references.json`
- Each entry:
  ```json
  {
    "requestId": "...",
    "imagePath": "assets/…/approved.png",
    "finalPrompt": "...",
    "caption": "...",
    "pinned": true
  }
  ```

### 1.5 Desktop GUI
- Sidebar navigation: Project Picker → Campaign Picker → Request List
- Main pane: request details, context display, prompt editor, Generate button, approved examples panel, results gallery
- Approved-Examples panel to pin/unpin reference images for future consistency (at both project and campaign level)
- Optimized prompt is displayed to the user before image generation
- Progress bar or animation is shown while image is being generated

### 1.6 AI Connector Module
- Prompt Optimizer: wraps raw prompt with project + campaign context + pinned references
- Image Generator: calls the OpenAI Image API with the improved prompt
- Returns image URLs or binary buffers

### 1.7 Asset & Log Manager
- Images saved at `assets/{projectName}/{campaignName}/{requestId}/{ISO-timestamp}/image.png`
- Logs saved at `logs/{projectName}/{campaignName}/{requestId}/{ISO-timestamp}.json`
- Log entry example:
  ```json
  {
    "timestamp": "...",
    "rawPrompt": "...",
    "improvedPrompt": "...",
    "imagePath": "...",
    "status": "...",
    "feedback?": "..."
  }
  ```

## 2. User Workflow

1. Select Project (lists all projects/*.json)
2. Select Campaign (lists all campaigns/*.json within the chosen project)
3. Create/Edit Request (enter/edit raw prompt, save to JSON)
4. Generate Images (build system prompt from project style guide, campaign theme, all pinned references, call Chat API, show optimized prompt to user, then call Image API, show progress bar/animation, save assets/logs)
5. Review & Feedback (approve to add to Reference Library, reject to provide feedback and re-generate)
6. Finalize (approved images remain in assets, logs capture full history)

## 3. Behind the Scenes

- Startup: Scan projects/ folder, load project & campaign JSON into UI
- Context Stitching: For each Generate, concatenate project style guide, campaign parameters, pinned reference examples, and user’s raw prompt (+ feedback)
- AI Round-Trip: Prompt Optimization (Chat API), Image Generation (Image API)
- File I/O: Save image files under a timestamped folder, write a JSON log per run
- Feedback Loop: Rejection triggers another AI Round-Trip, seeding the prompt optimizer with user feedback

## 4. v2 Roadmap (Post-MVP)

- Swap JSON + filesystem logs for SQL Server tables
- Add region-based annotation & in-image masking
- Introduce semantic search over reference library (embeddings)
- Build a web-hosted multi-user version (Blazor or React + ASP .NET Core)
- Scale storage to Azure Blob / S3 and introduce cloud orchestration (Durable Functions / Logic Apps)