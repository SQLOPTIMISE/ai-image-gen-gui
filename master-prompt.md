I need a detailed technical specification for v1 of a desktop GUI image-generation pipeline. It should use Electron + React (or vanilla JS) for the UI, Node.js for backend logic, and the OpenAI Chat + Image APIs. Follow these requirements:

1. **Data Model & Storage (v1)**  
   - Filesystem only: JSON files under `projects/{project}.json`, `projects/{project}/campaigns/{campaign}.json`, `projects/{project}/campaigns/{campaign}/requests/{requestId}.json`, and `projects/{project}/campaigns/{campaign}/references.json`.  
   - Assets under `assets/{project}/{campaign}/{requestId}/{ISO-timestamp}/image.png`.  
   - Run logs under `logs/{project}/{campaign}/{requestId}/{ISO-timestamp}.json`.

2. **Core Features**  
   - **Project/Campaign/Request Management**: UI to list, create, edit JSON definitions for projects, campaigns, and requests, each with their own context and style guides.  
   - **Prompt Editor**: displays project+campaign context and raw prompt, editable by the user.  
   - **Reference Library**: panel of approved images with final prompts and pin/unpin controls for future prompt optimization.  
   - **Generate Button**: on click, build “system” prompt by concatenating project style guide, campaign parameters, pinned references, and raw prompt (plus feedback if any).  
   - **AI Connector**: Node module using the `openai` NPM package to call Chat (for prompt improvement) then Images (for generation), incorporating approved examples for style consistency.  
   - **Results Gallery**: thumbnails of generated images with Approve/Reject + feedback UI.  
   - **Feedback Loop**: on Reject, capture comments, re-trigger AI Connector with feedback appended to user prompt for iterative improvement.

3. **UI Flow**  
   - Sidebar: project → campaigns → requests  
   - Main pane: request details, context display, prompt editor, Generate button, approved-examples panel, results gallery.

4. **Filesystem Operations**  
   - Reading/writing JSON project, campaign, request, reference files.  
   - Downloading image URLs and saving PNGs.  
   - Writing run-log JSON with fields: timestamp, rawPrompt, improvedPrompt, imagePath, status, feedback.

5. **Configuration & Secrets**  
   - `OPENAI_API_KEY` from `.env` or environment.  
   - Project JSON schema example included.

6. **Future v2 Notes** (for spec addendum)  
   - Swap JSON logs for SQL Server tables.  
   - Add region-based in-image annotation.  
   - Introduce embedding-based semantic search for references.  
   - Web/Cloud-hosted variant (Blazor or ASP.NET Core).

---

**Summary Table:**

| Concept   | Description |
|-----------|-------------|
| Project   | Top-level client or initiative, with style guide and references |
| Campaign  | Subdivision of a project, with specific style/theme/image needs |
| Request   | Individual image generation task with prompt and feedback |
| Approved Example | Reference image pinned for future prompt optimization |

Make sure every feature and workflow from our discussion is captured.
