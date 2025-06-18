const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.chatModel = process.env.OPENAI_CHAT_MODEL || 'gpt-4';
    this.imageModel = process.env.OPENAI_IMAGE_MODEL || 'dall-e-3';
    this.imageSize = process.env.OPENAI_IMAGE_SIZE || '1024x1024';
    this.imageQuality = process.env.OPENAI_IMAGE_QUALITY || 'standard';
    this.maxRetries = parseInt(process.env.MAX_GENERATION_RETRIES) || 3;
    this.timeout = parseInt(process.env.GENERATION_TIMEOUT) || 30000;
  }

  /**
   * Optimize a raw prompt using the Chat API with fallback
   * @param {string} rawPrompt - The user's raw prompt
   * @param {object} context - Project and campaign context
   * @param {array} pinnedReferences - Array of pinned reference examples
   * @param {string} feedback - Optional feedback from previous generations
   * @param {array} referenceImages - Array of uploaded reference images
   * @returns {Promise<string>} - Optimized prompt
   */
  async optimizePrompt(rawPrompt, context, pinnedReferences = [], feedback = '', referenceImages = []) {
    try {
      const systemPrompt = this.buildSystemPrompt(context, pinnedReferences, referenceImages);
      const userPrompt = this.buildUserPrompt(rawPrompt, feedback);

      const completion = await this.client.chat.completions.create({
        model: this.chatModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      return completion.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error optimizing prompt:', error);
      
      // If quota exceeded or other API issues, use fallback optimization
      if (error.status === 429 || error.status === 401 || error.code === 'insufficient_quota') {
        console.log('Using fallback prompt optimization due to API limits...');
        return this.fallbackOptimizePrompt(rawPrompt, context, pinnedReferences, feedback);
      }
      
      throw new Error(`Prompt optimization failed: ${error.message}`);
    }
  }

  /**
   * Fallback prompt optimization when API is unavailable
   * @param {string} rawPrompt - The user's raw prompt
   * @param {object} context - Project and campaign context
   * @param {array} pinnedReferences - Array of pinned reference examples
   * @param {string} feedback - Optional feedback from previous generations
   * @returns {string} - Enhanced prompt using template
   */
  fallbackOptimizePrompt(rawPrompt, context, pinnedReferences = [], feedback = '') {
    let optimizedPrompt = rawPrompt;

    // Add concise style context
    if (context.styleGuide && context.styleGuide.length > 0) {
      const styleWords = context.styleGuide.split(' ').slice(0, 10).join(' '); // Limit words
      optimizedPrompt += `, ${styleWords} style`;
    }

    // Add color palette (limit to 3 colors)
    if (context.palette && context.palette.length > 0) {
      const colors = context.palette.slice(0, 3).join(', ');
      optimizedPrompt += `, ${colors} colors`;
    }

    // Add feedback if provided
    if (feedback && feedback.trim()) {
      const feedbackWords = feedback.split(' ').slice(0, 15).join(' '); // Limit feedback
      optimizedPrompt += `, ${feedbackWords}`;
    }

    // Add quality descriptors
    optimizedPrompt += ', high quality, professional';

    // Ensure prompt is under 1000 characters for DALL-E
    if (optimizedPrompt.length > 1000) {
      optimizedPrompt = optimizedPrompt.substring(0, 997) + '...';
    }

    return optimizedPrompt;
  }

  /**
   * Generate image using the Images API or demo mode
   * @param {string} optimizedPrompt - The optimized prompt
   * @returns {Promise<object>} - Generation result with image URL and metadata
   */
  async generateImage(optimizedPrompt) {
    try {
      const response = await this.client.images.generate({
        model: this.imageModel,
        prompt: optimizedPrompt,
        size: this.imageSize,
        quality: this.imageQuality,
        n: 1,
        response_format: 'url'
      });

      return {
        imageUrl: response.data[0].url,
        revisedPrompt: response.data[0].revised_prompt,
        metadata: {
          model: this.imageModel,
          size: this.imageSize,
          quality: this.imageQuality,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error generating image:', error);
      
      // If demo mode is enabled and we have any API issues, return a demo image
      if (process.env.DEMO_MODE === 'true' && (error.status === 429 || error.status === 400 || error.code === 'insufficient_quota' || error.type === 'image_generation_user_error')) {
        console.log('Using demo mode due to API error...');
        return this.generateDemoImage(optimizedPrompt);
      }
      
      throw new Error(`Image generation failed: ${error.message}`);
    }
  }

  /**
   * Generate a demo placeholder image
   * @param {string} prompt - The prompt for the demo
   * @returns {Promise<object>} - Demo generation result
   */
  async generateDemoImage(prompt) {
    // Create a placeholder image URL (SVG data URL)
    const svgImage = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="1024" height="1024" fill="url(#grad1)" />
      <text x="512" y="400" text-anchor="middle" fill="white" font-family="Arial" font-size="36" font-weight="bold">DEMO IMAGE</text>
      <text x="512" y="460" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-family="Arial" font-size="24">Generated for:</text>
      <text x="512" y="520" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="Arial" font-size="20">${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}</text>
      <text x="512" y="600" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-family="Arial" font-size="16">OpenAI quota exceeded - using demo mode</text>
    </svg>`;
    
    const imageUrl = `data:image/svg+xml;base64,${Buffer.from(svgImage).toString('base64')}`;
    
    return {
      imageUrl,
      revisedPrompt: `[DEMO MODE] ${prompt}`,
      metadata: {
        model: 'demo-mode',
        size: this.imageSize,
        quality: 'demo',
        timestamp: new Date().toISOString(),
        demo: true
      }
    };
  }

  /**
   * Download image from URL and return buffer
   * @param {string} imageUrl - URL of the generated image
   * @returns {Promise<Buffer>} - Image buffer
   */
  async downloadImage(imageUrl) {
    try {
      // Handle data URLs (demo mode)
      if (imageUrl.startsWith('data:')) {
        const base64Data = imageUrl.split(',')[1];
        return Buffer.from(base64Data, 'base64');
      }
      
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('Error downloading image:', error);
      throw new Error(`Image download failed: ${error.message}`);
    }
  }

  /**
   * Complete image generation workflow
   * @param {string} rawPrompt - User's raw prompt
   * @param {object} context - Project and campaign context
   * @param {array} pinnedReferences - Pinned reference examples
   * @param {string} feedback - Optional feedback
   * @param {array} referenceImages - Uploaded reference images
   * @returns {Promise<object>} - Complete generation result
   */
  async generateComplete(rawPrompt, context, pinnedReferences = [], feedback = '', referenceImages = []) {
    let attempt = 0;
    
    while (attempt < this.maxRetries) {
      try {
        // Step 1: Optimize prompt
        const optimizedPrompt = await this.optimizePrompt(rawPrompt, context, pinnedReferences, feedback, referenceImages);
        
        // Step 2: Generate image
        const generationResult = await this.generateImage(optimizedPrompt);
        
        // Step 3: Download image
        const imageBuffer = await this.downloadImage(generationResult.imageUrl);
        
        return {
          success: true,
          rawPrompt,
          optimizedPrompt,
          revisedPrompt: generationResult.revisedPrompt,
          imageBuffer,
          metadata: generationResult.metadata,
          attempt: attempt + 1
        };
      } catch (error) {
        attempt++;
        console.error(`Generation attempt ${attempt} failed:`, error);
        
        if (attempt >= this.maxRetries) {
          return {
            success: false,
            error: error.message,
            rawPrompt,
            attempt
          };
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  /**
   * Build system prompt for prompt optimization
   * @param {object} context - Project and campaign context
   * @param {array} pinnedReferences - Pinned reference examples
   * @returns {string} - System prompt
   */
  buildSystemPrompt(context, pinnedReferences, referenceImages = []) {
    let systemPrompt = `You are an expert AI image generation prompt optimizer. Your task is to enhance user prompts for DALL-E 3 image generation.

PROJECT CONTEXT:
- Project: ${context.projectName}
- Style Guide: ${context.styleGuide}`;

    // Add project reference images if available
    if (context.projectReferenceImages && context.projectReferenceImages.length > 0) {
      systemPrompt += `\n- Project Reference Images: ${context.projectReferenceImages.map(img => `"${img.name}" (${img.description})`).join(', ')}`;
    }

    systemPrompt += `\n\nCAMPAIGN CONTEXT:
- Campaign: ${context.campaignName}
- Description: ${context.campaignDescription}`;

    // Add campaign-specific details
    if (context.campaignType && context.campaignType !== 'Other') {
      systemPrompt += `\n- Campaign Type: ${context.campaignType}`;
    }

    if (context.targetAudience) {
      systemPrompt += `\n- Target Audience: ${context.targetAudience}`;
    }

    if (context.imageRequirements && context.imageRequirements.length > 0) {
      systemPrompt += `\n- Image Requirements: ${context.imageRequirements.join('; ')}`;
    }

    if (context.imageSpecifications && Object.keys(context.imageSpecifications).length > 0) {
      const specs = [];
      if (context.imageSpecifications.aspectRatio) specs.push(`Aspect Ratio: ${context.imageSpecifications.aspectRatio}`);
      if (context.imageSpecifications.resolution) specs.push(`Resolution: ${context.imageSpecifications.resolution}`);
      if (context.imageSpecifications.format) specs.push(`Format: ${context.imageSpecifications.format}`);
      if (specs.length > 0) {
        systemPrompt += `\n- Image Specifications: ${specs.join(', ')}`;
      }
    }

    if (context.palette && context.palette.length > 0) {
      systemPrompt += `\n- Color Palette: ${context.palette.join(', ')}`;
    }

    if (context.sloganTemplates && context.sloganTemplates.length > 0) {
      systemPrompt += `\n- Slogan Templates: ${context.sloganTemplates.join('; ')}`;
    }

    // Add campaign reference images if available
    if (context.campaignReferenceImages && context.campaignReferenceImages.length > 0) {
      systemPrompt += `\n- Campaign Reference Images: ${context.campaignReferenceImages.map(img => `"${img.name}" (${img.description})`).join(', ')}`;
    }

    if (pinnedReferences && pinnedReferences.length > 0) {
      systemPrompt += `\n\nPINNED REFERENCE EXAMPLES (use these as style/quality references):`;
      pinnedReferences.forEach((ref, index) => {
        if (ref.finalPrompt) {
          // This is a generated image reference
          systemPrompt += `\n${index + 1}. ${ref.caption}: "${ref.finalPrompt}"`;
        }
      });
    }

    // Add reference images information
    if (referenceImages && referenceImages.length > 0) {
      systemPrompt += `\n\nUPLOADED REFERENCE IMAGES (consider these visual styles and themes):`;
      referenceImages.forEach((img, index) => {
        systemPrompt += `\n${index + 1}. "${img.name}"`;
        if (img.description) systemPrompt += `: ${img.description}`;
        if (img.tags && img.tags.length > 0) systemPrompt += ` [Tags: ${img.tags.join(', ')}]`;
        if (img.notes) systemPrompt += ` (Notes: ${img.notes})`;
      });
    }

    systemPrompt += `\n\nGuidelines:
- Enhance the prompt while maintaining the user's core intent
- Incorporate relevant project style guide elements
- Use campaign context to inform the visual direction
- Consider the uploaded reference images for style and thematic inspiration
- If color palette is specified, include relevant colors
- Respect image requirements and specifications
- Make prompts specific and detailed for better results
- Include technical quality descriptors (high resolution, professional, etc.)
- Ensure the prompt works well with DALL-E 3's capabilities
- Keep the enhanced prompt under 1000 characters

Return only the optimized prompt, no additional commentary.`;

    return systemPrompt;
  }

  /**
   * Build user prompt for optimization
   * @param {string} rawPrompt - User's raw prompt
   * @param {string} feedback - Optional feedback
   * @returns {string} - User prompt
   */
  buildUserPrompt(rawPrompt, feedback) {
    let userPrompt = `Raw prompt to optimize: "${rawPrompt}"`;
    
    if (feedback && feedback.trim()) {
      userPrompt += `\n\nPrevious feedback to incorporate: "${feedback}"`;
    }
    
    return userPrompt;
  }

  /**
   * Test API connection and quota status
   * @returns {Promise<object>} - Connection status with details
   */
  async testConnection() {
    try {
      await this.client.models.list();
      
      // Try a minimal chat completion to test quota
      try {
        await this.client.chat.completions.create({
          model: this.chatModel,
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1
        });
        return { connected: true, hasQuota: true };
      } catch (quotaError) {
        if (quotaError.status === 429 || quotaError.code === 'insufficient_quota') {
          return { connected: true, hasQuota: false, error: 'Quota exceeded' };
        }
        return { connected: true, hasQuota: true };
      }
    } catch (error) {
      console.error('OpenAI API connection test failed:', error);
      return { connected: false, hasQuota: false, error: error.message };
    }
  }
}

module.exports = OpenAIService;