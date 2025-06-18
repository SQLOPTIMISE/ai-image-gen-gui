require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const FileService = require('./services/fileService');
const OpenAIService = require('./services/openaiService');
const UploadService = require('./services/uploadService');
const { createDefaultProject, createDefaultCampaign, createDefaultRequest } = require('./models/schemas');

const app = express();
const port = process.env.PORT || 3000;

// Initialize services
const fileService = new FileService();
const openaiService = new OpenAIService();
const uploadService = new UploadService();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));
app.use('/assets', express.static('assets'));

// API Routes

// Projects
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await fileService.listProjects();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/projects/:projectName', async (req, res) => {
  try {
    const project = await fileService.getProject(req.params.projectName);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { 
      name, 
      clientName, 
      clientContact = {}, 
      description, 
      styleGuide, 
      startDate, 
      endDate, 
      references = [] 
    } = req.body;
    
    if (!name || !clientName || !description || !styleGuide) {
      return res.status(400).json({ error: 'Name, client name, description, and style guide are required' });
    }

    // Check if project already exists
    const existing = await fileService.getProject(name);
    if (existing) {
      return res.status(409).json({ error: 'Project already exists' });
    }

    const projectData = createDefaultProject(name, clientName, description, styleGuide);
    projectData.clientContact = clientContact;
    projectData.startDate = startDate || projectData.startDate;
    projectData.endDate = endDate || projectData.endDate;
    projectData.references = references;
    
    await fileService.saveProject(name, projectData);
    res.status(201).json(projectData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/projects/:projectName', async (req, res) => {
  try {
    const { styleGuide, references } = req.body;
    const project = await fileService.getProject(req.params.projectName);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (styleGuide !== undefined) project.styleGuide = styleGuide;
    if (references !== undefined) project.references = references;
    project.updated = new Date().toISOString();

    await fileService.saveProject(req.params.projectName, project);
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/projects/:projectName', async (req, res) => {
  try {
    await fileService.deleteProject(req.params.projectName);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Campaigns
app.get('/api/projects/:projectName/campaigns', async (req, res) => {
  try {
    const campaigns = await fileService.listCampaigns(req.params.projectName);
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/projects/:projectName/campaigns/:campaignName', async (req, res) => {
  try {
    const campaign = await fileService.getCampaign(req.params.projectName, req.params.campaignName);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects/:projectName/campaigns', async (req, res) => {
  try {
    const { 
      name, 
      description, 
      campaignType = 'Other',
      recurrence = 'one-time',
      targetAudience = '',
      imageRequirements = [],
      imageSpecifications = {},
      startDate,
      endDate,
      palette = [], 
      sloganTemplates = [] 
    } = req.body;
    
    if (!name || !description) {
      return res.status(400).json({ error: 'Name and description are required' });
    }

    // Check if campaign already exists
    const existing = await fileService.getCampaign(req.params.projectName, name);
    if (existing) {
      return res.status(409).json({ error: 'Campaign already exists' });
    }

    const campaignData = createDefaultCampaign(name, description);
    campaignData.campaignType = campaignType;
    campaignData.recurrence = recurrence;
    campaignData.targetAudience = targetAudience;
    campaignData.imageRequirements = imageRequirements;
    campaignData.imageSpecifications = imageSpecifications;
    campaignData.startDate = startDate || campaignData.startDate;
    campaignData.endDate = endDate || campaignData.endDate;
    campaignData.palette = palette;
    campaignData.sloganTemplates = sloganTemplates;
    
    await fileService.saveCampaign(req.params.projectName, name, campaignData);
    res.status(201).json(campaignData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/projects/:projectName/campaigns/:campaignName', async (req, res) => {
  try {
    const { description, palette, sloganTemplates } = req.body;
    const campaign = await fileService.getCampaign(req.params.projectName, req.params.campaignName);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (description !== undefined) campaign.description = description;
    if (palette !== undefined) campaign.palette = palette;
    if (sloganTemplates !== undefined) campaign.sloganTemplates = sloganTemplates;
    campaign.updated = new Date().toISOString();

    await fileService.saveCampaign(req.params.projectName, req.params.campaignName, campaign);
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Requests
app.get('/api/projects/:projectName/campaigns/:campaignName/requests', async (req, res) => {
  try {
    const requests = await fileService.listRequests(req.params.projectName, req.params.campaignName);
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/projects/:projectName/campaigns/:campaignName/requests/:requestId', async (req, res) => {
  try {
    const request = await fileService.getRequest(req.params.projectName, req.params.campaignName, req.params.requestId);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects/:projectName/campaigns/:campaignName/requests', async (req, res) => {
  try {
    const { rawPrompt } = req.body;
    
    if (!rawPrompt) {
      return res.status(400).json({ error: 'Raw prompt is required' });
    }

    const requestData = createDefaultRequest(rawPrompt);
    
    await fileService.saveRequest(req.params.projectName, req.params.campaignName, requestData.id, requestData);
    res.status(201).json(requestData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/projects/:projectName/campaigns/:campaignName/requests/:requestId', async (req, res) => {
  try {
    const { rawPrompt, status, feedback, approvedExamples } = req.body;
    const request = await fileService.getRequest(req.params.projectName, req.params.campaignName, req.params.requestId);
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (rawPrompt !== undefined) request.rawPrompt = rawPrompt;
    if (status !== undefined) request.status = status;
    if (feedback !== undefined) request.feedback = feedback;
    if (approvedExamples !== undefined) request.approvedExamples = approvedExamples;
    request.updated = new Date().toISOString();

    await fileService.saveRequest(req.params.projectName, req.params.campaignName, req.params.requestId, request);
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Project-level approved images
app.get('/api/projects/:projectName/approvedImages', async (req, res) => {
  try {
    const project = await fileService.getProject(req.params.projectName);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project.approvedImages || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects/:projectName/approvedImages', async (req, res) => {
  try {
    const { requestId, imagePath, finalPrompt, caption = '', pinned = false } = req.body;
    
    if (!requestId || !imagePath || !finalPrompt) {
      return res.status(400).json({ error: 'RequestId, imagePath, and finalPrompt are required' });
    }

    const project = await fileService.getProject(req.params.projectName);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!project.approvedImages) {
      project.approvedImages = [];
    }

    const newApprovedImage = {
      requestId,
      imagePath,
      finalPrompt,
      caption,
      pinned,
      level: 'project',
      created: new Date().toISOString()
    };

    project.approvedImages.push(newApprovedImage);
    project.updated = new Date().toISOString();
    
    await fileService.saveProject(req.params.projectName, project);
    
    res.status(201).json(newApprovedImage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/projects/:projectName/approvedImages', async (req, res) => {
  try {
    const { approvedImages } = req.body;
    
    if (!Array.isArray(approvedImages)) {
      return res.status(400).json({ error: 'ApprovedImages must be an array' });
    }

    const project = await fileService.getProject(req.params.projectName);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    project.approvedImages = approvedImages;
    project.updated = new Date().toISOString();
    
    await fileService.saveProject(req.params.projectName, project);
    res.json(approvedImages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Campaign-level references
app.get('/api/projects/:projectName/campaigns/:campaignName/references', async (req, res) => {
  try {
    const references = await fileService.getReferences(req.params.projectName, req.params.campaignName);
    
    // Mark campaign-level references
    const campaignReferences = references.map(ref => ({
      ...ref,
      level: 'campaign'
    }));
    
    res.json(campaignReferences);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects/:projectName/campaigns/:campaignName/references', async (req, res) => {
  try {
    const { requestId, imagePath, finalPrompt, caption = '', pinned = false } = req.body;
    
    if (!requestId || !imagePath || !finalPrompt) {
      return res.status(400).json({ error: 'RequestId, imagePath, and finalPrompt are required' });
    }

    const references = await fileService.getReferences(req.params.projectName, req.params.campaignName);
    
    const newReference = {
      requestId,
      imagePath,
      finalPrompt,
      caption,
      pinned,
      level: 'campaign',
      created: new Date().toISOString()
    };

    references.push(newReference);
    await fileService.saveReferences(req.params.projectName, req.params.campaignName, references);
    
    res.status(201).json(newReference);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/projects/:projectName/campaigns/:campaignName/references', async (req, res) => {
  try {
    const { references } = req.body;
    
    if (!Array.isArray(references)) {
      return res.status(400).json({ error: 'References must be an array' });
    }

    await fileService.saveReferences(req.params.projectName, req.params.campaignName, references);
    res.json(references);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reference Image Upload Endpoints
app.post('/api/projects/:projectName/referenceImages', uploadService.getMulterConfig().single('image'), async (req, res) => {
  try {
    const { projectName } = req.params;
    const { name, description, tags, notes } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    // Validate that project exists
    const project = await fileService.getProject(projectName);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const metadata = {
      name: name || req.file.originalname,
      description: description || '',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      notes: notes || ''
    };

    // Process the uploaded file
    const referenceImage = await uploadService.processReferenceImage(
      req.file.path,
      projectName,
      null, // No campaign name for project-level
      metadata
    );

    // Add to project's reference images
    if (!project.referenceImages) {
      project.referenceImages = [];
    }
    project.referenceImages.push(referenceImage);
    project.updated = new Date().toISOString();

    await fileService.saveProject(projectName, project);

    res.status(201).json(referenceImage);
  } catch (error) {
    console.error('Project reference image upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects/:projectName/campaigns/:campaignName/referenceImages', uploadService.getMulterConfig().single('image'), async (req, res) => {
  try {
    const { projectName, campaignName } = req.params;
    const { name, description, tags, notes } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    // Validate that project and campaign exist
    const project = await fileService.getProject(projectName);
    const campaign = await fileService.getCampaign(projectName, campaignName);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const metadata = {
      name: name || req.file.originalname,
      description: description || '',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      notes: notes || ''
    };

    // Process the uploaded file
    const referenceImage = await uploadService.processReferenceImage(
      req.file.path,
      projectName,
      campaignName,
      metadata
    );

    // Add to campaign's reference images
    if (!campaign.referenceImages) {
      campaign.referenceImages = [];
    }
    campaign.referenceImages.push(referenceImage);
    campaign.updated = new Date().toISOString();

    await fileService.saveCampaign(projectName, campaignName, campaign);

    res.status(201).json(referenceImage);
  } catch (error) {
    console.error('Campaign reference image upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get project reference images
app.get('/api/projects/:projectName/referenceImages', async (req, res) => {
  try {
    const project = await fileService.getProject(req.params.projectName);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project.referenceImages || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get campaign reference images
app.get('/api/projects/:projectName/campaigns/:campaignName/referenceImages', async (req, res) => {
  try {
    const campaign = await fileService.getCampaign(req.params.projectName, req.params.campaignName);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json(campaign.referenceImages || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete reference image
app.delete('/api/referenceImages/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    let found = false;
    
    // Search through all projects and campaigns
    const projects = await fileService.listProjects();
    
    for (const projectName of projects) {
      const project = await fileService.getProject(projectName);
      
      // Check project-level reference images
      if (project.referenceImages) {
        const imageIndex = project.referenceImages.findIndex(img => img.id === imageId);
        if (imageIndex !== -1) {
          const referenceImage = project.referenceImages[imageIndex];
          await uploadService.deleteReferenceImage(referenceImage);
          project.referenceImages.splice(imageIndex, 1);
          project.updated = new Date().toISOString();
          await fileService.saveProject(projectName, project);
          found = true;
          break;
        }
      }
      
      // Check campaign-level reference images
      const campaigns = await fileService.listCampaigns(projectName);
      for (const campaignName of campaigns) {
        const campaign = await fileService.getCampaign(projectName, campaignName);
        if (campaign.referenceImages) {
          const imageIndex = campaign.referenceImages.findIndex(img => img.id === imageId);
          if (imageIndex !== -1) {
            const referenceImage = campaign.referenceImages[imageIndex];
            await uploadService.deleteReferenceImage(referenceImage);
            campaign.referenceImages.splice(imageIndex, 1);
            campaign.updated = new Date().toISOString();
            await fileService.saveCampaign(projectName, campaignName, campaign);
            found = true;
            break;
          }
        }
      }
      
      if (found) break;
    }
    
    if (!found) {
      return res.status(404).json({ error: 'Reference image not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete reference image error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update reference image metadata
app.put('/api/referenceImages/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    const { name, description, tags, notes, pinned } = req.body;
    let found = false;
    let updatedImage = null;
    
    // Search through all projects and campaigns
    const projects = await fileService.listProjects();
    
    for (const projectName of projects) {
      const project = await fileService.getProject(projectName);
      
      // Check project-level reference images
      if (project.referenceImages) {
        const imageIndex = project.referenceImages.findIndex(img => img.id === imageId);
        if (imageIndex !== -1) {
          const referenceImage = project.referenceImages[imageIndex];
          if (name !== undefined) referenceImage.name = name;
          if (description !== undefined) referenceImage.description = description;
          if (tags !== undefined) referenceImage.tags = tags;
          if (notes !== undefined) referenceImage.notes = notes;
          if (pinned !== undefined) referenceImage.pinned = pinned;
          
          project.updated = new Date().toISOString();
          await fileService.saveProject(projectName, project);
          updatedImage = referenceImage;
          found = true;
          break;
        }
      }
      
      // Check campaign-level reference images
      const campaigns = await fileService.listCampaigns(projectName);
      for (const campaignName of campaigns) {
        const campaign = await fileService.getCampaign(projectName, campaignName);
        if (campaign.referenceImages) {
          const imageIndex = campaign.referenceImages.findIndex(img => img.id === imageId);
          if (imageIndex !== -1) {
            const referenceImage = campaign.referenceImages[imageIndex];
            if (name !== undefined) referenceImage.name = name;
            if (description !== undefined) referenceImage.description = description;
            if (tags !== undefined) referenceImage.tags = tags;
            if (notes !== undefined) referenceImage.notes = notes;
            if (pinned !== undefined) referenceImage.pinned = pinned;
            
            campaign.updated = new Date().toISOString();
            await fileService.saveCampaign(projectName, campaignName, campaign);
            updatedImage = referenceImage;
            found = true;
            break;
          }
        }
      }
      
      if (found) break;
    }
    
    if (!found) {
      return res.status(404).json({ error: 'Reference image not found' });
    }
    
    res.json(updatedImage);
  } catch (error) {
    console.error('Update reference image error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Image Generation
app.post('/api/projects/:projectName/campaigns/:campaignName/requests/:requestId/generate', async (req, res) => {
  try {
    const { projectName, campaignName, requestId } = req.params;
    
    // Get project, campaign, and request data
    const project = await fileService.getProject(projectName);
    const campaign = await fileService.getCampaign(projectName, campaignName);
    const request = await fileService.getRequest(projectName, campaignName, requestId);
    
    if (!project || !campaign || !request) {
      return res.status(404).json({ error: 'Project, campaign, or request not found' });
    }

    // Get pinned references from both project and campaign levels
    const projectApprovedImages = project.approvedImages || [];
    const campaignReferences = await fileService.getReferences(projectName, campaignName);
    
    const projectPinnedRefs = projectApprovedImages.filter(ref => ref.pinned).map(ref => ({...ref, level: 'project'}));
    const campaignPinnedRefs = campaignReferences.filter(ref => ref.pinned).map(ref => ({...ref, level: 'campaign'}));
    
    const pinnedReferences = [...projectPinnedRefs, ...campaignPinnedRefs];

    // Update request status
    request.status = 'Generating';
    await fileService.saveRequest(projectName, campaignName, requestId, request);

    // Build enhanced context for AI including all new fields
    const context = {
      projectName: project.name,
      styleGuide: project.styleGuide,
      projectReferenceImages: project.referenceImages || [],
      campaignName: campaign.name,
      campaignDescription: campaign.description,
      campaignType: campaign.campaignType,
      targetAudience: campaign.targetAudience,
      imageRequirements: campaign.imageRequirements,
      imageSpecifications: campaign.imageSpecifications,
      palette: campaign.palette,
      sloganTemplates: campaign.sloganTemplates,
      campaignReferenceImages: campaign.referenceImages || []
    };

    // Collect all reference images for prompt optimization
    const allReferenceImages = [
      ...(project.referenceImages || []),
      ...(campaign.referenceImages || [])
    ];

    // Generate image
    const result = await openaiService.generateComplete(
      request.rawPrompt,
      context,
      pinnedReferences,
      request.feedback,
      allReferenceImages
    );

    if (result.success) {
      // Save image asset
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const imagePath = await fileService.saveAsset(
        projectName,
        campaignName,
        requestId,
        timestamp,
        result.imageBuffer
      );

      // Save log
      const logData = {
        timestamp: result.metadata.timestamp,
        rawPrompt: result.rawPrompt,
        improvedPrompt: result.optimizedPrompt,
        imagePath,
        status: 'Succeeded',
        feedback: request.feedback || '',
        generationSettings: result.metadata
      };
      
      await fileService.saveLog(projectName, campaignName, requestId, timestamp, logData);

      // Update request status
      request.status = 'Succeeded';
      await fileService.saveRequest(projectName, campaignName, requestId, request);

      // Return result with relative path for frontend
      const relativeImagePath = await fileService.getRelativeAssetPath(projectName, campaignName, requestId, timestamp);
      
      res.json({
        success: true,
        imagePath: relativeImagePath,
        optimizedPrompt: result.optimizedPrompt,
        revisedPrompt: result.revisedPrompt,
        metadata: result.metadata
      });
    } else {
      // Update request status to failed
      request.status = 'Failed';
      await fileService.saveRequest(projectName, campaignName, requestId, request);
      
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check and API info
app.get('/api/health', async (req, res) => {
  try {
    const openaiStatus = await openaiService.testConnection();
    res.json({ 
      status: 'healthy',
      openai: openaiStatus.connected ? 'connected' : 'disconnected',
      quota: openaiStatus.hasQuota ? 'available' : 'exceeded',
      fallbackMode: !openaiStatus.hasQuota,
      details: openaiStatus.error || 'OK',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(port, () => {
  console.log(`AI Image Generation GUI server running on http://localhost:${port}`);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('OpenAI API Key configured:', !!process.env.OPENAI_API_KEY);
});

module.exports = app;