// JSON Schema definitions for data validation

const projectSchema = {
  name: { type: 'string', required: true, minLength: 1 },
  clientName: { type: 'string', required: true, minLength: 1 },
  clientContact: {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email' },
      phone: { type: 'string' },
      company: { type: 'string' },
      notes: { type: 'string' }
    },
    default: {}
  },
  description: { type: 'string', required: true },
  styleGuide: { type: 'string', required: true },
  startDate: { type: 'string', format: 'date' },
  endDate: { type: 'string', format: 'date' },
  references: { 
    type: 'array', 
    items: { type: 'string' },
    default: []
  },
  approvedImages: {
    type: 'array',
    items: { type: 'object' },
    default: []
  },
  referenceImages: {
    type: 'array',
    items: { type: 'object' },
    default: []
  },
  created: { type: 'string', format: 'date-time' },
  updated: { type: 'string', format: 'date-time' }
};

const campaignSchema = {
  name: { type: 'string', required: true, minLength: 1 },
  description: { type: 'string', required: true },
  campaignType: { 
    type: 'string', 
    enum: ['Anniversary', 'Product Launch', 'Seasonal', 'Brand Awareness', 'Event', 'Other'],
    default: 'Other'
  },
  recurrence: {
    type: 'string',
    enum: ['one-time', 'weekly', 'monthly', 'quarterly', 'yearly'],
    default: 'one-time'
  },
  targetAudience: { type: 'string', default: '' },
  imageRequirements: {
    type: 'array',
    items: { type: 'string' },
    default: []
  },
  imageSpecifications: {
    type: 'object',
    properties: {
      aspectRatio: { type: 'string' },
      resolution: { type: 'string' },
      format: { type: 'string' },
      notes: { type: 'string' }
    },
    default: {}
  },
  startDate: { type: 'string', format: 'date' },
  endDate: { type: 'string', format: 'date' },
  palette: { 
    type: 'array', 
    items: { type: 'string' },
    default: []
  },
  sloganTemplates: { 
    type: 'array', 
    items: { type: 'string' },
    default: []
  },
  referenceImages: {
    type: 'array',
    items: { type: 'object' },
    default: []
  },
  created: { type: 'string', format: 'date-time' },
  updated: { type: 'string', format: 'date-time' }
};

const requestSchema = {
  id: { type: 'string', required: true },
  rawPrompt: { type: 'string', required: true },
  status: { 
    type: 'string', 
    enum: ['Pending', 'Generating', 'Succeeded', 'Needs Feedback', 'Failed'],
    default: 'Pending'
  },
  feedback: { type: 'string', default: '' },
  approvedExamples: { 
    type: 'array', 
    items: { type: 'string' },
    default: []
  },
  created: { type: 'string', format: 'date-time' },
  updated: { type: 'string', format: 'date-time' }
};

const referenceSchema = {
  requestId: { type: 'string', required: true },
  imagePath: { type: 'string', required: true },
  finalPrompt: { type: 'string', required: true },
  caption: { type: 'string', default: '' },
  pinned: { type: 'boolean', default: false },
  created: { type: 'string', format: 'date-time' }
};

const referenceImageSchema = {
  id: { type: 'string', required: true },
  name: { type: 'string', required: true },
  description: { type: 'string', default: '' },
  filePath: { type: 'string', required: true },
  fileName: { type: 'string', required: true },
  fileSize: { type: 'number', required: true },
  mimeType: { type: 'string', required: true },
  tags: {
    type: 'array',
    items: { type: 'string' },
    default: []
  },
  notes: { type: 'string', default: '' },
  pinned: { type: 'boolean', default: false },
  uploadDate: { type: 'string', format: 'date-time', required: true }
};

const logSchema = {
  timestamp: { type: 'string', format: 'date-time', required: true },
  rawPrompt: { type: 'string', required: true },
  improvedPrompt: { type: 'string', required: true },
  imagePath: { type: 'string', required: true },
  status: { type: 'string', required: true },
  feedback: { type: 'string', default: '' },
  generationSettings: {
    type: 'object',
    properties: {
      model: { type: 'string' },
      size: { type: 'string' },
      quality: { type: 'string' }
    }
  }
};

// Helper functions for validation
function validateSchema(data, schema) {
  const errors = [];
  
  for (const [key, rules] of Object.entries(schema)) {
    const value = data[key];
    
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${key} is required`);
      continue;
    }
    
    if (value !== undefined && value !== null) {
      if (rules.type === 'string' && typeof value !== 'string') {
        errors.push(`${key} must be a string`);
      }
      
      if (rules.type === 'array' && !Array.isArray(value)) {
        errors.push(`${key} must be an array`);
      }
      
      if (rules.type === 'boolean' && typeof value !== 'boolean') {
        errors.push(`${key} must be a boolean`);
      }
      
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${key} must be at least ${rules.minLength} characters`);
      }
      
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`${key} must be one of: ${rules.enum.join(', ')}`);
      }
    }
  }
  
  return errors;
}

// Default data generators
function createDefaultProject(name, clientName, description, styleGuide) {
  return {
    name,
    clientName,
    clientContact: {},
    description,
    styleGuide,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    references: [],
    approvedImages: [],
    referenceImages: [],
    created: new Date().toISOString(),
    updated: new Date().toISOString()
  };
}

function createDefaultCampaign(name, description) {
  return {
    name,
    description,
    campaignType: 'Other',
    recurrence: 'one-time',
    targetAudience: '',
    imageRequirements: [],
    imageSpecifications: {},
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    palette: [],
    sloganTemplates: [],
    referenceImages: [],
    created: new Date().toISOString(),
    updated: new Date().toISOString()
  };
}

function createReferenceImage(name, description, filePath, fileName, fileSize, mimeType) {
  return {
    id: require('uuid').v4(),
    name,
    description,
    filePath,
    fileName,
    fileSize,
    mimeType,
    tags: [],
    notes: '',
    pinned: false,
    uploadDate: new Date().toISOString()
  };
}

function createDefaultRequest(rawPrompt) {
  return {
    id: require('uuid').v4(),
    rawPrompt,
    status: 'Pending',
    feedback: '',
    approvedExamples: [],
    created: new Date().toISOString(),
    updated: new Date().toISOString()
  };
}

module.exports = {
  schemas: {
    project: projectSchema,
    campaign: campaignSchema,
    request: requestSchema,
    reference: referenceSchema,
    referenceImage: referenceImageSchema,
    log: logSchema
  },
  validateSchema,
  createDefaultProject,
  createDefaultCampaign,
  createDefaultRequest,
  createReferenceImage
};