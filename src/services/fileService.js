const fs = require('fs').promises;
const path = require('path');
const { validateSchema, schemas } = require('../models/schemas');

class FileService {
  constructor() {
    this.projectsDir = process.env.PROJECTS_DIR || './projects';
    this.assetsDir = process.env.ASSETS_DIR || './assets';
    this.logsDir = process.env.LOGS_DIR || './logs';
  }

  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch (error) {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  // Project operations
  async listProjects() {
    try {
      await this.ensureDirectoryExists(this.projectsDir);
      const files = await fs.readdir(this.projectsDir);
      const projects = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const projectName = path.basename(file, '.json');
          const projectData = await this.getProject(projectName);
          if (projectData) {
            projects.push(projectData);
          }
        }
      }
      
      return projects;
    } catch (error) {
      console.error('Error listing projects:', error);
      return [];
    }
  }

  async getProject(projectName) {
    try {
      const filePath = path.join(this.projectsDir, `${projectName}.json`);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading project ${projectName}:`, error);
      return null;
    }
  }

  async saveProject(projectName, projectData) {
    try {
      const errors = validateSchema(projectData, schemas.project);
      if (errors.length > 0) {
        throw new Error(`Validation errors: ${errors.join(', ')}`);
      }

      await this.ensureDirectoryExists(this.projectsDir);
      const filePath = path.join(this.projectsDir, `${projectName}.json`);
      await fs.writeFile(filePath, JSON.stringify(projectData, null, 2));
      return true;
    } catch (error) {
      console.error(`Error saving project ${projectName}:`, error);
      throw error;
    }
  }

  async deleteProject(projectName) {
    try {
      const filePath = path.join(this.projectsDir, `${projectName}.json`);
      await fs.unlink(filePath);
      
      // Also delete project directory if it exists
      const projectDir = path.join(this.projectsDir, projectName);
      try {
        await fs.rmdir(projectDir, { recursive: true });
      } catch (error) {
        // Directory might not exist, that's okay
      }
      
      return true;
    } catch (error) {
      console.error(`Error deleting project ${projectName}:`, error);
      throw error;
    }
  }

  // Campaign operations
  async listCampaigns(projectName) {
    try {
      const campaignsDir = path.join(this.projectsDir, projectName, 'campaigns');
      await this.ensureDirectoryExists(campaignsDir);
      
      const files = await fs.readdir(campaignsDir);
      const campaigns = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const campaignName = path.basename(file, '.json');
          const campaignData = await this.getCampaign(projectName, campaignName);
          if (campaignData) {
            campaigns.push(campaignData);
          }
        }
      }
      
      return campaigns;
    } catch (error) {
      console.error(`Error listing campaigns for project ${projectName}:`, error);
      return [];
    }
  }

  async getCampaign(projectName, campaignName) {
    try {
      const filePath = path.join(this.projectsDir, projectName, 'campaigns', `${campaignName}.json`);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading campaign ${campaignName}:`, error);
      return null;
    }
  }

  async saveCampaign(projectName, campaignName, campaignData) {
    try {
      const errors = validateSchema(campaignData, schemas.campaign);
      if (errors.length > 0) {
        throw new Error(`Validation errors: ${errors.join(', ')}`);
      }

      const campaignsDir = path.join(this.projectsDir, projectName, 'campaigns');
      await this.ensureDirectoryExists(campaignsDir);
      
      const filePath = path.join(campaignsDir, `${campaignName}.json`);
      await fs.writeFile(filePath, JSON.stringify(campaignData, null, 2));
      return true;
    } catch (error) {
      console.error(`Error saving campaign ${campaignName}:`, error);
      throw error;
    }
  }

  // Request operations
  async listRequests(projectName, campaignName) {
    try {
      const requestsDir = path.join(this.projectsDir, projectName, 'campaigns', campaignName, 'requests');
      await this.ensureDirectoryExists(requestsDir);
      
      const files = await fs.readdir(requestsDir);
      const requests = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const requestId = path.basename(file, '.json');
          const requestData = await this.getRequest(projectName, campaignName, requestId);
          if (requestData) {
            requests.push(requestData);
          }
        }
      }
      
      return requests.sort((a, b) => new Date(b.updated) - new Date(a.updated));
    } catch (error) {
      console.error(`Error listing requests:`, error);
      return [];
    }
  }

  async getRequest(projectName, campaignName, requestId) {
    try {
      const filePath = path.join(this.projectsDir, projectName, 'campaigns', campaignName, 'requests', `${requestId}.json`);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading request ${requestId}:`, error);
      return null;
    }
  }

  async saveRequest(projectName, campaignName, requestId, requestData) {
    try {
      const errors = validateSchema(requestData, schemas.request);
      if (errors.length > 0) {
        throw new Error(`Validation errors: ${errors.join(', ')}`);
      }

      const requestsDir = path.join(this.projectsDir, projectName, 'campaigns', campaignName, 'requests');
      await this.ensureDirectoryExists(requestsDir);
      
      const filePath = path.join(requestsDir, `${requestId}.json`);
      await fs.writeFile(filePath, JSON.stringify(requestData, null, 2));
      return true;
    } catch (error) {
      console.error(`Error saving request ${requestId}:`, error);
      throw error;
    }
  }

  // Reference operations
  async getReferences(projectName, campaignName) {
    try {
      const filePath = path.join(this.projectsDir, projectName, 'campaigns', campaignName, 'references.json');
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      // File might not exist yet
      return [];
    }
  }

  async saveReferences(projectName, campaignName, references) {
    try {
      const campaignDir = path.join(this.projectsDir, projectName, 'campaigns', campaignName);
      await this.ensureDirectoryExists(campaignDir);
      
      const filePath = path.join(campaignDir, 'references.json');
      await fs.writeFile(filePath, JSON.stringify(references, null, 2));
      return true;
    } catch (error) {
      console.error(`Error saving references:`, error);
      throw error;
    }
  }

  // Asset operations
  async saveAsset(projectName, campaignName, requestId, timestamp, imageBuffer) {
    try {
      const assetDir = path.join(this.assetsDir, projectName, campaignName, requestId, timestamp);
      await this.ensureDirectoryExists(assetDir);
      
      const filePath = path.join(assetDir, 'image.png');
      await fs.writeFile(filePath, imageBuffer);
      return filePath;
    } catch (error) {
      console.error(`Error saving asset:`, error);
      throw error;
    }
  }

  // Log operations
  async saveLog(projectName, campaignName, requestId, timestamp, logData) {
    try {
      const errors = validateSchema(logData, schemas.log);
      if (errors.length > 0) {
        throw new Error(`Validation errors: ${errors.join(', ')}`);
      }

      const logDir = path.join(this.logsDir, projectName, campaignName, requestId);
      await this.ensureDirectoryExists(logDir);
      
      const filePath = path.join(logDir, `${timestamp}.json`);
      await fs.writeFile(filePath, JSON.stringify(logData, null, 2));
      return true;
    } catch (error) {
      console.error(`Error saving log:`, error);
      throw error;
    }
  }

  // Utility methods
  async getAssetPath(projectName, campaignName, requestId, timestamp) {
    return path.join(this.assetsDir, projectName, campaignName, requestId, timestamp, 'image.png');
  }

  async getRelativeAssetPath(projectName, campaignName, requestId, timestamp) {
    return path.join('assets', projectName, campaignName, requestId, timestamp, 'image.png');
  }
}

module.exports = FileService;