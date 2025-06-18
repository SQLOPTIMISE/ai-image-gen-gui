# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI Image Generation GUI application built with Electron + React/Node.js that integrates with OpenAI's Chat and Image APIs. The system provides a desktop interface for managing image generation projects with a structured pipeline approach.

## Architecture

The application follows a three-tier architecture:
- **Frontend**: Electron + React (or vanilla JS) GUI
- **Backend**: Node.js service handling AI API integration and file operations
- **Storage**: Filesystem-based JSON storage with structured asset management

## Data Model & File Structure

### Core Data Structure
- `projects/{projectName}.json` - Project definitions with style guides and references
- `projects/{projectName}/campaigns/{campaignName}.json` - Campaign definitions with themes and palettes
- `projects/{projectName}/campaigns/{campaignName}/requests/{requestId}.json` - Image requests with prompts and status
- `projects/{projectName}/campaigns/{campaignName}/references.json` - Approved images library

### Asset Storage
- `assets/{project}/{campaign}/{requestId}/{ISO-timestamp}/image.png` - Generated images
- `logs/{project}/{campaign}/{requestId}/{ISO-timestamp}.json` - Run logs with prompts and metadata

## Core Components

### 1. Project Management System
- Hierarchical structure: Project → Campaign → Request
- JSON-based configuration storage
- Reference library for approved images with pin/unpin functionality

### 2. AI Connector Module
- **Prompt Optimizer**: Uses OpenAI Chat API to enhance raw prompts with project and campaign context, and pinned approved examples
- **Image Generator**: Calls OpenAI Image API with optimized prompts
- Context stitching: Combines project style guide + campaign parameters + pinned references + raw prompt (+ feedback if any)

### 3. Feedback Loop System
- Approve/Reject workflow for generated images
- Feedback capture and prompt re-optimization
- Iterative generation with user comments

## Key Workflows

### Image Generation Process
1. User enters raw prompt in request editor
2. System builds context from project style guide, campaign parameters, and pinned references
3. Chat API optimizes the prompt
4. Image API generates images
5. Results displayed in gallery for approval/rejection
6. Approved images added to reference library

### UI Flow
- Sidebar navigation: Project picker → Campaign picker → Request list
- Main pane: Request details, context display, prompt editor, Generate button, approved examples panel, results gallery

## Configuration

- Use `OPENAI_API_KEY` from `.env` or environment
- Ensure terminology and workflow match the project/campaign/request/approved example hierarchy
- Always use approved images as references for prompt optimization when available

## Future Roadmap (v2)
- SQL Server database replacement for JSON storage
- Region-based image annotation and masking
- Semantic search over reference library using embeddings
- Web-hosted multi-user version with cloud storage