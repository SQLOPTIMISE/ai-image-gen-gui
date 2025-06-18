# AI Image Generation GUI

A desktop application for managing AI image generation projects with structured workflows and reference libraries.

## Features

- **Project, Campaign, and Request Management**: Organize work into projects (with style guides and project-level reference images), campaigns (with their own reference images and styles), and individual image requests (with prompts and feedback).
- **Context-Aware Generation**: Prompts are enhanced using project style guides, campaign parameters, and both project-level and campaign-level pinned approved images.
- **Reference Library**: Pin/unpin approved images at both the project and campaign level to guide future generations and maintain style consistency.
- **Feedback Loop**: Iterative improvement with user feedback on rejected images.
- **Optimized Prompt Display**: After prompt optimization, the optimized prompt is shown to the user before image generation for transparency and insight.
- **Progress Indicator**: A progress bar or animation is shown while the image is being generated.
- **File-Based Storage**: All data, assets, and logs are stored in a structured local filesystem for easy retrieval and organization.

## Concept Summary

| Concept   | Description |
|-----------|-------------|
| Project   | Top-level client or initiative, with style guide and project-level references |
| Campaign  | Subdivision of a project, with specific style/theme/image needs and its own references |
| Request   | Individual image generation task with prompt and feedback |
| Approved Example | Reference image pinned for future prompt optimization (at project or campaign level) |

## Intended Workflow

### 1. Project Setup
- Create a new project (JSON file) with name, style guide, and reference images.
- Add campaigns under the project, each with its own style parameters (e.g., aspect ratio, theme) and campaign-specific reference images.

### 2. Creating and Managing Requests
- Within a campaign, create image requests by entering a raw prompt.
- The request is processed by the prompt optimization engine, using project/campaign context and all approved examples (project and campaign level).

### 3. Image Generation and Review
- The improved (optimized) prompt is displayed to the user for review.
- The improved prompt is sent to the image generation API.
- While the image is being generated, a progress bar or animation is shown.
- Resulting images are displayed in the results gallery.
- Users can approve or reject images. On rejection, feedback is added and used to refine/regenerate the image.

### 4. Storing and Using References
- Approved images are saved and tagged as references at the project or campaign level for future requests, ensuring consistent style and quality.

## File Structure

```
projects/
  {project}.json                 # Project definitions
  {project}/
    campaigns/
      {campaign}.json        # Campaign definitions
      {campaign}/
        requests/
          {id}.json      # Request definitions
        references.json    # Approved images library
assets/
  {project}/{campaign}/{request}/{timestamp}/
    image.png                  # Generated images
logs/
  {project}/{campaign}/{request}/
    {timestamp}.json           # Generation logs
```

## Usage Workflow

1. Create/select a project
2. Add campaigns
3. Enter prompts for requests
4. Generate and review images
5. Approve/reject and provide feedback
6. Pin/unpin approved images for future reference

## API Endpoints

- `GET /api/health` - Check system status
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:name/campaigns` - List campaigns
- `POST /api/projects/:name/campaigns` - Create campaign
- `GET /api/projects/:name/campaigns/:name/requests` - List requests
- `POST /api/projects/:name/campaigns/:name/requests` - Create request
- `POST /api/projects/:name/campaigns/:name/requests/:id/generate` - Generate image

## Configuration

Environment variables in `.env`:

```bash
OPENAI_API_KEY=your_key_here
OPENAI_CHAT_MODEL=gpt-4
OPENAI_IMAGE_MODEL=dall-e-3
OPENAI_IMAGE_SIZE=1024x1024
OPENAI_IMAGE_QUALITY=standard
MAX_GENERATION_RETRIES=3
GENERATION_TIMEOUT=30000
```

## Development

- `npm start` - Start production server
- `npm run dev` - Start with nodemon for development
- Server runs on port 3000 by default

## Troubleshooting

- OpenAI Connection: Verify API key, credits, and rate limits
- File Permissions: Ensure write access to `projects/`, `assets/`, and `logs/`
- Frontend: Check browser console and server status

## Future v2 Features

- SQL Server database storage
- Region-based image annotation
- Semantic search over reference library
- Multi-user web interface
- Cloud deployment with Azure integration

## License

MIT License