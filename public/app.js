// AI Image Generation GUI - Frontend Application

class ImageGenApp {
    constructor() {
        this.currentProject = null;
        this.currentCampaign = null;
        this.currentRequest = null;
        this.references = [];
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.checkHealth();
        await this.loadProjects();
    }

    setupEventListeners() {
        // Modal triggers
        document.getElementById('newProjectBtn').addEventListener('click', () => {
            this.showNewProjectModal();
        });

        document.getElementById('newCampaignBtn').addEventListener('click', () => {
            this.showNewCampaignModal();
        });

        document.getElementById('newRequestBtn').addEventListener('click', () => {
            this.showNewRequestModal();
        });

        // Form submissions
        document.getElementById('createProjectBtn').addEventListener('click', () => {
            this.createProject();
        });

        document.getElementById('createCampaignBtn').addEventListener('click', () => {
            this.createCampaign();
        });

        document.getElementById('createRequestBtn').addEventListener('click', () => {
            this.createRequest();
        });

        // Generation controls
        document.getElementById('generateBtn').addEventListener('click', () => {
            this.showPromptPreview();
        });

        document.getElementById('proceedWithGenerationBtn').addEventListener('click', () => {
            this.proceedWithGeneration();
        });

        document.getElementById('regenerateBtn').addEventListener('click', () => {
            this.regenerateWithFeedback();
        });

        document.getElementById('saveRequestBtn').addEventListener('click', () => {
            this.saveCurrentRequest();
        });

        // Prompt input auto-save
        document.getElementById('rawPromptInput').addEventListener('input', () => {
            this.debounce(() => this.saveCurrentRequest(), 1000)();
        });
    }

    // Utility functions
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-floating alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }

    showLoading(message = 'Processing...', detail = 'Initializing...') {
        document.getElementById('loadingMessage').textContent = message;
        document.getElementById('loadingDetail').textContent = detail;
        document.getElementById('loadingProgress').style.width = '0%';
        const modal = new bootstrap.Modal(document.getElementById('loadingModal'));
        modal.show();
        return modal;
    }

    updateLoadingProgress(percentage, message, detail) {
        document.getElementById('loadingProgress').style.width = `${percentage}%`;
        document.getElementById('loadingMessage').textContent = message;
        document.getElementById('loadingDetail').textContent = detail;
    }

    hideLoading() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('loadingModal'));
        if (modal) modal.hide();
    }

    // API calls
    async apiCall(endpoint, options = {}) {
        try {
            const response = await fetch(`/api${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'API call failed');
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async checkHealth() {
        try {
            const status = await this.apiCall('/health');
            this.updateStatusIndicator(status);
            this.updateStatusDetails(status);
            this.updateWelcomeBanner(status);
        } catch (error) {
            this.updateStatusIndicator(null, error);
            this.updateStatusDetails(null, error);
            this.updateWelcomeBanner(null, error);
        }
    }

    updateWelcomeBanner(status, error = null) {
        const welcomeBanner = document.getElementById('welcomeBanner');
        if (!welcomeBanner) return;

        if (error) {
            welcomeBanner.innerHTML = `
                <div class="alert alert-danger">
                    <h6><i class="bi bi-exclamation-triangle"></i> Connection Error</h6>
                    <p class="mb-0">Unable to connect to the server. Please check if the server is running.</p>
                </div>
            `;
            return;
        }

        if (status.fallbackMode || status.quota === 'exceeded') {
            welcomeBanner.innerHTML = `
                <div class="alert alert-warning">
                    <h6><i class="bi bi-info-circle"></i> Demo Mode Active</h6>
                    <p class="mb-2">OpenAI quota exceeded. The app is running in demo mode with placeholder images.</p>
                    <a href="https://platform.openai.com/settings/organization/billing" target="_blank" class="btn btn-sm btn-outline-dark">
                        <i class="bi bi-credit-card"></i> Add OpenAI Credits
                    </a>
                </div>
            `;
        } else {
            welcomeBanner.innerHTML = `
                <div class="alert alert-success">
                    <h6><i class="bi bi-check-circle"></i> Ready for Image Generation</h6>
                    <p class="mb-0">OpenAI API connected and ready. Create a project to start generating images!</p>
                </div>
            `;
        }
    }

    updateStatusIndicator(status, error = null) {
        const indicator = document.getElementById('statusIndicator');
        
        if (error) {
            indicator.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="connection-dot disconnected"></div>
                    <small class="text-danger ms-2">Connection Error</small>
                </div>
                <i class="bi bi-exclamation-triangle-fill text-danger"></i>
            `;
            return;
        }

        if (status.openai === 'connected') {
            if (status.quota === 'available') {
                indicator.innerHTML = `
                    <div class="d-flex align-items-center">
                        <div class="connection-dot connected"></div>
                        <small class="text-success ms-2">Connected & Ready</small>
                    </div>
                    <i class="bi bi-check-circle-fill text-success"></i>
                `;
            } else {
                indicator.innerHTML = `
                    <div class="d-flex align-items-center">
                        <div class="connection-dot" style="background-color: #ffc107;"></div>
                        <small class="text-warning ms-2">Demo Mode</small>
                    </div>
                    <i class="bi bi-exclamation-triangle-fill text-warning"></i>
                `;
            }
        } else {
            indicator.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="connection-dot disconnected"></div>
                    <small class="text-danger ms-2">Disconnected</small>
                </div>
                <i class="bi bi-x-circle-fill text-danger"></i>
            `;
        }
    }

    updateStatusDetails(status, error = null) {
        const statusDetails = document.getElementById('statusDetails');
        
        if (error) {
            statusDetails.innerHTML = `
                <div class="quota-warning">
                    <h6><i class="bi bi-exclamation-triangle"></i> Connection Error</h6>
                    <p class="mb-2">Unable to connect to the server.</p>
                    <small>Error: ${error.message}</small>
                </div>
                <div class="mt-3">
                    <h6>Troubleshooting</h6>
                    <ul class="small mb-2">
                        <li>Check if the server is running</li>
                        <li>Verify the server port (3000)</li>
                        <li>Check network connection</li>
                    </ul>
                </div>
            `;
            return;
        }

        let detailsHTML = '<div class="status-detail-item">';
        detailsHTML += '<span>OpenAI Connection:</span>';
        detailsHTML += `<span class="badge ${status.openai === 'connected' ? 'bg-success' : 'bg-danger'} status-badge-sm">${status.openai}</span>`;
        detailsHTML += '</div>';

        detailsHTML += '<div class="status-detail-item">';
        detailsHTML += '<span>API Quota:</span>';
        detailsHTML += `<span class="badge ${status.quota === 'available' ? 'bg-success' : 'bg-warning'} status-badge-sm">${status.quota}</span>`;
        detailsHTML += '</div>';

        detailsHTML += '<div class="status-detail-item">';
        detailsHTML += '<span>Demo Mode:</span>';
        detailsHTML += `<span class="badge ${status.fallbackMode ? 'bg-primary' : 'bg-secondary'} status-badge-sm">${status.fallbackMode ? 'Enabled' : 'Disabled'}</span>`;
        detailsHTML += '</div>';

        if (status.quota === 'exceeded' || status.fallbackMode) {
            detailsHTML += `
                <div class="quota-warning">
                    <h6><i class="bi bi-exclamation-triangle"></i> OpenAI Quota Exceeded</h6>
                    <p class="mb-2">Your OpenAI API usage has exceeded the current quota limit.</p>
                    <small><strong>What's happening:</strong> The app is using demo mode with placeholder images and fallback prompt optimization.</small>
                </div>
                
                <div class="mt-3">
                    <h6>Quick Solutions</h6>
                    <div class="d-grid gap-2">
                        <a href="https://platform.openai.com/settings/organization/billing" target="_blank" class="btn btn-sm btn-outline-primary external-link">
                            <i class="bi bi-credit-card"></i> Add Credits to OpenAI Account
                        </a>
                        <a href="https://platform.openai.com/usage" target="_blank" class="btn btn-sm btn-outline-info external-link">
                            <i class="bi bi-graph-up"></i> View Usage Dashboard
                        </a>
                        <a href="https://platform.openai.com/docs/guides/rate-limits" target="_blank" class="btn btn-sm btn-outline-secondary external-link">
                            <i class="bi bi-book"></i> Rate Limits Guide
                        </a>
                    </div>
                </div>

                <div class="mt-3">
                    <h6>Demo Mode Features</h6>
                    <ul class="small mb-2">
                        <li>✅ Project & campaign management</li>
                        <li>✅ Prompt optimization (fallback)</li>
                        <li>✅ Demo image generation</li>
                        <li>✅ Reference library management</li>
                        <li>✅ Complete workflow testing</li>
                    </ul>
                </div>
            `;
        } else {
            detailsHTML += `
                <div class="demo-info">
                    <h6><i class="bi bi-check-circle"></i> Fully Operational</h6>
                    <p class="mb-1">OpenAI API is connected and ready for image generation.</p>
                    <small><strong>Model:</strong> GPT-4o-mini for prompts, DALL-E 3 for images</small>
                </div>
            `;
        }

        detailsHTML += `
            <div class="mt-3 pt-3 border-top">
                <h6>System Information</h6>
                <div class="small text-muted">
                    <div>Last checked: ${new Date(status.timestamp).toLocaleTimeString()}</div>
                    <div>Status: ${status.details}</div>
                </div>
            </div>
        `;

        statusDetails.innerHTML = detailsHTML;
    }

    // Project management
    async loadProjects() {
        try {
            const projects = await this.apiCall('/projects');
            this.renderProjects(projects);
        } catch (error) {
            this.showAlert('Failed to load projects', 'danger');
        }
    }

    renderProjects(projects) {
        const projectsList = document.getElementById('projectsList');
        
        if (projects.length === 0) {
            projectsList.innerHTML = '<div class="text-muted p-2">No projects yet</div>';
            return;
        }

        projectsList.innerHTML = projects.map(project => `
            <div class="list-group-item d-flex justify-content-between align-items-center" 
                 data-project="${project.name}" onclick="app.selectProject('${project.name}')">
                <div>
                    <div class="fw-medium">${project.name}</div>
                    <small class="text-muted">${new Date(project.updated).toLocaleDateString()}</small>
                </div>
                <i class="bi bi-chevron-right"></i>
            </div>
        `).join('');
    }

    async selectProject(projectName) {
        try {
            // Update UI state
            document.querySelectorAll('#projectsList .list-group-item').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelector(`[data-project="${projectName}"]`).classList.add('active');

            // Load project data
            this.currentProject = await this.apiCall(`/projects/${projectName}`);
            this.currentCampaign = null;
            this.currentRequest = null;

            // Show campaigns section and load campaigns
            document.getElementById('campaignsSection').style.display = 'block';
            document.getElementById('requestsSection').style.display = 'none';
            
            await this.loadCampaigns(projectName);
            this.updateBreadcrumb([this.currentProject.name]);
            this.showMainWorkArea();
        } catch (error) {
            this.showAlert('Failed to load project', 'danger');
        }
    }

    async loadCampaigns(projectName) {
        try {
            const campaigns = await this.apiCall(`/projects/${projectName}/campaigns`);
            this.renderCampaigns(campaigns);
        } catch (error) {
            this.showAlert('Failed to load campaigns', 'danger');
        }
    }

    renderCampaigns(campaigns) {
        const campaignsList = document.getElementById('campaignsList');
        
        if (campaigns.length === 0) {
            campaignsList.innerHTML = '<div class="text-muted p-2">No campaigns yet</div>';
            return;
        }

        campaignsList.innerHTML = campaigns.map(campaign => `
            <div class="list-group-item d-flex justify-content-between align-items-center" 
                 data-campaign="${campaign.name}" onclick="app.selectCampaign('${campaign.name}')">
                <div>
                    <div class="fw-medium">${campaign.name}</div>
                    <small class="text-muted">${campaign.description.substring(0, 50)}...</small>
                </div>
                <i class="bi bi-chevron-right"></i>
            </div>
        `).join('');
    }

    async selectCampaign(campaignName) {
        try {
            // Update UI state
            document.querySelectorAll('#campaignsList .list-group-item').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelector(`[data-campaign="${campaignName}"]`).classList.add('active');

            // Load campaign data
            this.currentCampaign = await this.apiCall(`/projects/${this.currentProject.name}/campaigns/${campaignName}`);
            this.currentRequest = null;

            // Show requests section and load requests
            document.getElementById('requestsSection').style.display = 'block';
            
            await this.loadRequests(this.currentProject.name, campaignName);
            await this.loadReferences(this.currentProject.name, campaignName);
            
            this.updateBreadcrumb([this.currentProject.name, this.currentCampaign.name]);
            this.updateContextDisplay();
            this.showMainWorkArea();
        } catch (error) {
            this.showAlert('Failed to load campaign', 'danger');
        }
    }

    async loadRequests(projectName, campaignName) {
        try {
            const requests = await this.apiCall(`/projects/${projectName}/campaigns/${campaignName}/requests`);
            this.renderRequests(requests);
        } catch (error) {
            this.showAlert('Failed to load requests', 'danger');
        }
    }

    renderRequests(requests) {
        const requestsList = document.getElementById('requestsList');
        
        if (requests.length === 0) {
            requestsList.innerHTML = '<div class="text-muted p-2">No requests yet</div>';
            return;
        }

        requestsList.innerHTML = requests.map(request => `
            <div class="list-group-item d-flex justify-content-between align-items-center" 
                 data-request="${request.id}" onclick="app.selectRequest('${request.id}')">
                <div class="flex-grow-1">
                    <div class="fw-medium">${request.rawPrompt.substring(0, 30)}...</div>
                    <small class="text-muted">${new Date(request.updated).toLocaleDateString()}</small>
                </div>
                <span class="badge status-badge status-${request.status.toLowerCase().replace(' ', '-')}">${request.status}</span>
            </div>
        `).join('');
    }

    async selectRequest(requestId) {
        try {
            // Update UI state
            document.querySelectorAll('#requestsList .list-group-item').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelector(`[data-request="${requestId}"]`).classList.add('active');

            // Load request data
            this.currentRequest = await this.apiCall(`/projects/${this.currentProject.name}/campaigns/${this.currentCampaign.name}/requests/${requestId}`);
            
            this.updateBreadcrumb([this.currentProject.name, this.currentCampaign.name, 'Request']);
            this.updateRequestEditor();
            this.clearResults();
            this.showMainWorkArea();
        } catch (error) {
            this.showAlert('Failed to load request', 'danger');
        }
    }

    // UI Updates
    updateBreadcrumb(items) {
        const breadcrumb = document.getElementById('breadcrumb');
        breadcrumb.innerHTML = items.map((item, index) => {
            if (index === items.length - 1) {
                return `<li class="breadcrumb-item active">${item}</li>`;
            } else {
                return `<li class="breadcrumb-item">${item}</li>`;
            }
        }).join('');
    }

    updateContextDisplay() {
        const contextDisplay = document.getElementById('contextDisplay');
        
        if (!this.currentProject || !this.currentCampaign) {
            contextDisplay.innerHTML = '';
            return;
        }

        contextDisplay.innerHTML = `
            <div class="context-card">
                <div class="row">
                    <div class="col-md-6">
                        <h6><i class="bi bi-folder"></i> Project Context</h6>
                        <p><strong>Name:</strong> ${this.currentProject.name}</p>
                        <p><strong>Style Guide:</strong> ${this.currentProject.styleGuide.substring(0, 100)}...</p>
                    </div>
                    <div class="col-md-6">
                        <h6><i class="bi bi-megaphone"></i> Campaign Context</h6>
                        <p><strong>Name:</strong> ${this.currentCampaign.name}</p>
                        <p><strong>Description:</strong> ${this.currentCampaign.description.substring(0, 100)}...</p>
                        ${this.currentCampaign.palette && this.currentCampaign.palette.length > 0 ? 
                            `<p><strong>Palette:</strong> ${this.currentCampaign.palette.join(', ')}</p>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    updateRequestEditor() {
        if (!this.currentRequest) {
            document.getElementById('rawPromptInput').value = '';
            document.getElementById('feedbackInput').value = '';
            document.getElementById('feedbackSection').style.display = 'none';
            return;
        }

        document.getElementById('rawPromptInput').value = this.currentRequest.rawPrompt;
        document.getElementById('feedbackInput').value = this.currentRequest.feedback || '';
        
        if (this.currentRequest.status === 'Needs Feedback') {
            document.getElementById('feedbackSection').style.display = 'block';
        } else {
            document.getElementById('feedbackSection').style.display = 'none';
        }
    }

    showMainWorkArea() {
        document.getElementById('welcomeScreen').style.display = 'none';
        document.getElementById('mainWorkArea').style.display = 'flex';
    }

    // References management
    async loadReferences(projectName, campaignName) {
        try {
            // Load both project and campaign level references
            const [projectApprovedImages, campaignReferences] = await Promise.all([
                this.apiCall(`/projects/${projectName}/approvedImages`),
                this.apiCall(`/projects/${projectName}/campaigns/${campaignName}/references`)
            ]);
            
            // Combine and mark levels
            this.projectReferences = projectApprovedImages.map(ref => ({...ref, level: 'project'}));
            this.campaignReferences = campaignReferences.map(ref => ({...ref, level: 'campaign'}));
            this.references = [...this.projectReferences, ...this.campaignReferences];
            
            this.renderReferences();
        } catch (error) {
            this.showAlert('Failed to load references', 'danger');
        }
    }

    renderReferences() {
        const referencesPanel = document.getElementById('referencesPanel');
        
        if (this.references.length === 0) {
            referencesPanel.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="bi bi-images"></i>
                    <p class="mb-0 mt-2">No references yet</p>
                </div>
            `;
            return;
        }

        // Group references by level
        const projectRefs = this.references.filter(ref => ref.level === 'project');
        const campaignRefs = this.references.filter(ref => ref.level === 'campaign');

        let referencesHTML = '';

        // Project-level references
        if (projectRefs.length > 0) {
            referencesHTML += `
                <div class="mb-3">
                    <h6 class="text-muted mb-2">
                        <i class="bi bi-folder"></i> Project References
                        <span class="reference-level-badge reference-level-project">PROJECT</span>
                    </h6>
                    ${projectRefs.map(ref => this.renderReferenceItem(ref)).join('')}
                </div>
            `;
        }

        // Campaign-level references
        if (campaignRefs.length > 0) {
            referencesHTML += `
                <div class="mb-3">
                    <h6 class="text-muted mb-2">
                        <i class="bi bi-megaphone"></i> Campaign References
                        <span class="reference-level-badge reference-level-campaign">CAMPAIGN</span>
                    </h6>
                    ${campaignRefs.map(ref => this.renderReferenceItem(ref)).join('')}
                </div>
            `;
        }

        referencesPanel.innerHTML = referencesHTML;
    }

    renderReferenceItem(ref) {
        return `
            <div class="reference-item ${ref.pinned ? 'pinned' : ''}" data-ref-id="${ref.requestId}" data-ref-level="${ref.level}">
                <div class="position-relative">
                    <img src="/${ref.imagePath}" alt="Reference" class="reference-image" 
                         onerror="this.src='data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="#f8f9fa"/><text x="50" y="50" text-anchor="middle" fill="#6c757d" font-family="Arial" font-size="12">No Image</text></svg>')}'">
                    <button class="pin-toggle ${ref.pinned ? 'pinned' : ''}" onclick="app.togglePin('${ref.requestId}', '${ref.level}')">
                        <i class="bi bi-pin${ref.pinned ? '-fill' : ''}"></i>
                    </button>
                </div>
                <div class="reference-content">
                    <div class="reference-prompt">${ref.finalPrompt}</div>
                    ${ref.caption ? `<small class="text-muted">${ref.caption}</small>` : ''}
                </div>
            </div>
        `;
    }

    async togglePin(requestId, level) {
        try {
            const refIndex = this.references.findIndex(ref => ref.requestId === requestId && ref.level === level);
            if (refIndex === -1) return;

            this.references[refIndex].pinned = !this.references[refIndex].pinned;
            
            if (level === 'project') {
                // Update project-level references
                const projectRefs = this.references.filter(ref => ref.level === 'project');
                await this.apiCall(`/projects/${this.currentProject.name}/approvedImages`, {
                    method: 'PUT',
                    body: JSON.stringify({ approvedImages: projectRefs })
                });
            } else {
                // Update campaign-level references
                const campaignRefs = this.references.filter(ref => ref.level === 'campaign');
                await this.apiCall(`/projects/${this.currentProject.name}/campaigns/${this.currentCampaign.name}/references`, {
                    method: 'PUT',
                    body: JSON.stringify({ references: campaignRefs })
                });
            }

            this.renderReferences();
        } catch (error) {
            this.showAlert('Failed to update pin status', 'danger');
        }
    }

    // Modal management
    showNewProjectModal() {
        const modal = new bootstrap.Modal(document.getElementById('newProjectModal'));
        document.getElementById('newProjectForm').reset();
        modal.show();
    }

    showNewCampaignModal() {
        if (!this.currentProject) {
            this.showAlert('Please select a project first', 'warning');
            return;
        }
        
        const modal = new bootstrap.Modal(document.getElementById('newCampaignModal'));
        document.getElementById('newCampaignForm').reset();
        modal.show();
    }

    showNewRequestModal() {
        if (!this.currentCampaign) {
            this.showAlert('Please select a campaign first', 'warning');
            return;
        }
        
        const modal = new bootstrap.Modal(document.getElementById('newRequestModal'));
        document.getElementById('newRequestForm').reset();
        modal.show();
    }

    // CRUD operations
    async createProject() {
        try {
            const name = document.getElementById('projectName').value.trim();
            const clientName = document.getElementById('clientName').value.trim();
            const description = document.getElementById('projectDescription').value.trim();
            const styleGuide = document.getElementById('styleGuide').value.trim();
            const references = document.getElementById('references').value.trim()
                .split('\n').filter(ref => ref.trim()).map(ref => ref.trim());

            // Client contact information
            const clientContact = {
                email: document.getElementById('clientEmail').value.trim(),
                phone: document.getElementById('clientPhone').value.trim(),
                company: document.getElementById('clientCompany').value.trim(),
                notes: document.getElementById('clientNotes').value.trim()
            };

            // Project dates
            const startDate = document.getElementById('projectStartDate').value;
            const endDate = document.getElementById('projectEndDate').value;

            if (!name || !clientName || !description || !styleGuide) {
                this.showAlert('Please fill in all required fields', 'warning');
                return;
            }

            // Create the project first
            const projectData = {
                name,
                clientName,
                clientContact,
                description,
                styleGuide,
                startDate,
                endDate,
                references
            };

            const project = await this.apiCall('/projects', {
                method: 'POST',
                body: JSON.stringify(projectData)
            });

            // Handle file uploads if any
            const fileInput = document.getElementById('projectReferenceImages');
            if (fileInput.files.length > 0) {
                await this.uploadProjectReferenceImages(project.name, fileInput.files);
            }

            bootstrap.Modal.getInstance(document.getElementById('newProjectModal')).hide();
            this.showAlert('Project created successfully', 'success');
            await this.loadProjects();
        } catch (error) {
            this.showAlert(error.message, 'danger');
        }
    }

    async createCampaign() {
        try {
            const name = document.getElementById('campaignName').value.trim();
            const description = document.getElementById('campaignDescription').value.trim();
            const campaignType = document.getElementById('campaignType').value;
            const recurrence = document.getElementById('campaignRecurrence').value;
            const targetAudience = document.getElementById('targetAudience').value.trim();
            
            const palette = document.getElementById('palette').value.trim()
                .split(',').filter(color => color.trim()).map(color => color.trim());
            const sloganTemplates = document.getElementById('sloganTemplates').value.trim()
                .split('\n').filter(slogan => slogan.trim()).map(slogan => slogan.trim());

            // Image requirements
            const imageRequirements = document.getElementById('imageRequirements').value.trim()
                .split('\n').filter(req => req.trim()).map(req => req.trim());

            // Image specifications
            const imageSpecifications = {
                aspectRatio: document.getElementById('aspectRatio').value.trim(),
                resolution: document.getElementById('resolution').value.trim(),
                format: document.getElementById('format').value.trim(),
                notes: document.getElementById('specNotes').value.trim()
            };

            // Campaign dates
            const startDate = document.getElementById('campaignStartDate').value;
            const endDate = document.getElementById('campaignEndDate').value;

            if (!name || !description) {
                this.showAlert('Please fill in all required fields', 'warning');
                return;
            }

            // Create the campaign first
            const campaignData = {
                name,
                description,
                campaignType,
                recurrence,
                targetAudience,
                imageRequirements,
                imageSpecifications,
                startDate,
                endDate,
                palette,
                sloganTemplates
            };

            const campaign = await this.apiCall(`/projects/${this.currentProject.name}/campaigns`, {
                method: 'POST',
                body: JSON.stringify(campaignData)
            });

            // Handle file uploads if any
            const fileInput = document.getElementById('campaignReferenceImages');
            if (fileInput.files.length > 0) {
                await this.uploadCampaignReferenceImages(this.currentProject.name, campaign.name, fileInput.files);
            }

            bootstrap.Modal.getInstance(document.getElementById('newCampaignModal')).hide();
            this.showAlert('Campaign created successfully', 'success');
            await this.loadCampaigns(this.currentProject.name);
        } catch (error) {
            this.showAlert(error.message, 'danger');
        }
    }

    async createRequest() {
        try {
            const rawPrompt = document.getElementById('requestPrompt').value.trim();

            if (!rawPrompt) {
                this.showAlert('Please enter a prompt', 'warning');
                return;
            }

            const request = await this.apiCall(`/projects/${this.currentProject.name}/campaigns/${this.currentCampaign.name}/requests`, {
                method: 'POST',
                body: JSON.stringify({ rawPrompt })
            });

            bootstrap.Modal.getInstance(document.getElementById('newRequestModal')).hide();
            this.showAlert('Request created successfully', 'success');
            await this.loadRequests(this.currentProject.name, this.currentCampaign.name);
        } catch (error) {
            this.showAlert(error.message, 'danger');
        }
    }

    async saveCurrentRequest() {
        if (!this.currentRequest) return;

        try {
            const rawPrompt = document.getElementById('rawPromptInput').value.trim();
            const feedback = document.getElementById('feedbackInput').value.trim();

            if (rawPrompt !== this.currentRequest.rawPrompt || feedback !== this.currentRequest.feedback) {
                await this.apiCall(`/projects/${this.currentProject.name}/campaigns/${this.currentCampaign.name}/requests/${this.currentRequest.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ rawPrompt, feedback })
                });

                this.currentRequest.rawPrompt = rawPrompt;
                this.currentRequest.feedback = feedback;
            }
        } catch (error) {
            this.showAlert('Failed to save request', 'danger');
        }
    }

    // Prompt preview and generation
    async showPromptPreview() {
        if (!this.currentRequest) {
            this.showAlert('Please select a request first', 'warning');
            return;
        }

        await this.saveCurrentRequest();
        
        // Build context for preview
        const context = {
            projectName: this.currentProject.name,
            styleGuide: this.currentProject.styleGuide,
            campaignName: this.currentCampaign.name,
            campaignDescription: this.currentCampaign.description,
            palette: this.currentCampaign.palette,
            sloganTemplates: this.currentCampaign.sloganTemplates
        };

        // Get pinned references
        const allReferences = this.references || [];
        const pinnedReferences = allReferences.filter(ref => ref.pinned);

        // Build prompt breakdown
        this.buildPromptBreakdown(context, pinnedReferences, this.currentRequest.rawPrompt, this.currentRequest.feedback);

        // Show the preview modal
        const modal = new bootstrap.Modal(document.getElementById('promptPreviewModal'));
        modal.show();
    }

    buildPromptBreakdown(context, pinnedReferences, rawPrompt, feedback) {
        const promptBreakdown = document.getElementById('promptBreakdown');
        let breakdownHTML = '';

        // Project context
        if (context.styleGuide) {
            breakdownHTML += `
                <div class="prompt-breakdown-item project">
                    <h6><i class="bi bi-folder"></i> Project Style Guide</h6>
                    <p class="mb-0">${context.styleGuide}</p>
                </div>
            `;
        }

        // Campaign context
        if (context.campaignDescription) {
            breakdownHTML += `
                <div class="prompt-breakdown-item campaign">
                    <h6><i class="bi bi-megaphone"></i> Campaign Context</h6>
                    <p class="mb-1"><strong>Description:</strong> ${context.campaignDescription}</p>
                    ${context.palette && context.palette.length > 0 ? 
                        `<p class="mb-0"><strong>Colors:</strong> ${context.palette.join(', ')}</p>` : ''}
                </div>
            `;
        }

        // Pinned references
        if (pinnedReferences && pinnedReferences.length > 0) {
            breakdownHTML += `
                <div class="prompt-breakdown-item references">
                    <h6><i class="bi bi-pin-angle"></i> Pinned References (${pinnedReferences.length})</h6>
                    <p class="mb-0">Style guidance from approved examples will be incorporated.</p>
                </div>
            `;
        }

        // User prompt
        breakdownHTML += `
            <div class="prompt-breakdown-item">
                <h6><i class="bi bi-pencil"></i> Your Prompt</h6>
                <p class="mb-0">${rawPrompt}</p>
            </div>
        `;

        // Feedback (if any)
        if (feedback && feedback.trim()) {
            breakdownHTML += `
                <div class="prompt-breakdown-item feedback">
                    <h6><i class="bi bi-chat-dots"></i> Feedback</h6>
                    <p class="mb-0">${feedback}</p>
                </div>
            `;
        }

        promptBreakdown.innerHTML = breakdownHTML;

        // Build the final optimized prompt preview (simplified version)
        let optimizedPrompt = rawPrompt;
        if (context.styleGuide) {
            optimizedPrompt += `, ${context.styleGuide.split(' ').slice(0, 10).join(' ')} style`;
        }
        if (context.palette && context.palette.length > 0) {
            optimizedPrompt += `, ${context.palette.slice(0, 3).join(', ')} colors`;
        }
        if (feedback && feedback.trim()) {
            optimizedPrompt += `, ${feedback.split(' ').slice(0, 15).join(' ')}`;
        }
        optimizedPrompt += ', high quality, professional';

        document.getElementById('finalPromptPreview').value = optimizedPrompt;
    }

    async proceedWithGeneration() {
        // Hide the preview modal
        const previewModal = bootstrap.Modal.getInstance(document.getElementById('promptPreviewModal'));
        if (previewModal) previewModal.hide();

        // Start the generation process
        await this.generateImage();
    }

    async generateImage() {
        if (!this.currentRequest) {
            this.showAlert('Please select a request first', 'warning');
            return;
        }

        const loadingModal = this.showLoading('Optimizing prompt...', 'Building context from project and campaign...');

        try {
            // Step 1: Show prompt optimization
            this.updateLoadingProgress(25, 'Optimizing prompt...', 'Enhancing with style guide and references...');
            
            // Step 2: Start generation
            this.updateLoadingProgress(50, 'Generating image...', 'Sending request to AI model...');

            const result = await this.apiCall(`/projects/${this.currentProject.name}/campaigns/${this.currentCampaign.name}/requests/${this.currentRequest.id}/generate`, {
                method: 'POST'
            });

            // Step 3: Processing result
            this.updateLoadingProgress(75, 'Processing result...', 'Downloading and saving image...');

            if (result.success) {
                this.updateLoadingProgress(100, 'Complete!', 'Image ready for review');
                
                // Short delay to show completion
                await new Promise(resolve => setTimeout(resolve, 500));
                
                if (result.metadata && result.metadata.demo) {
                    this.showAlert('Demo image generated! Click the status indicator for quota information.', 'info');
                } else {
                    this.showAlert('Image generated successfully!', 'success');
                }
                this.displayGenerationResult(result);
                await this.loadRequests(this.currentProject.name, this.currentCampaign.name);
            } else {
                this.showDetailedError('Image Generation Failed', result.error);
            }
        } catch (error) {
            this.showDetailedError('Generation Error', error.message);
        } finally {
            this.hideLoading();
        }
    }

    showDetailedError(title, errorMessage) {
        const isQuotaError = errorMessage.includes('quota') || errorMessage.includes('429') || errorMessage.includes('insufficient');
        
        let alertType = 'danger';
        let message = errorMessage;
        let additionalInfo = '';
        
        if (isQuotaError) {
            alertType = 'warning';
            message = 'OpenAI quota exceeded - using demo mode';
            additionalInfo = ' Click the status indicator (bottom left) for billing links and solutions.';
        }
        
        this.showAlert(`${title}: ${message}${additionalInfo}`, alertType);
        
        // Auto-update status to reflect current state
        setTimeout(() => {
            this.checkHealth();
        }, 1000);
    }

    async regenerateWithFeedback() {
        if (!this.currentRequest) return;

        const feedback = document.getElementById('feedbackInput').value.trim();
        if (!feedback) {
            this.showAlert('Please provide feedback before regenerating', 'warning');
            return;
        }

        await this.generateImage();
    }

    displayGenerationResult(result) {
        const imageResults = document.getElementById('imageResults');
        const isDemo = result.metadata && result.metadata.demo;
        
        const statusBadge = isDemo ? 
            '<span class="badge bg-primary me-2">DEMO</span>' : 
            '<span class="badge bg-success me-2">LIVE</span>';
        
        const resultHtml = `
            <div class="col-md-6 slide-in-up">
                <div class="image-result-card ${isDemo ? 'border-primary' : ''}">
                    <img src="/${result.imagePath}" alt="Generated Image" class="image-result" 
                         onclick="app.showImageModal('${result.imagePath}')">
                    <div class="image-actions">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <div>
                                ${statusBadge}
                                <small class="text-muted">Just generated</small>
                            </div>
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-approve" onclick="app.approveImage('${result.imagePath}', '${result.optimizedPrompt}')">
                                    <i class="bi bi-check"></i> Approve
                                </button>
                                <button class="btn btn-reject" onclick="app.rejectImage()">
                                    <i class="bi bi-x"></i> Reject
                                </button>
                            </div>
                        </div>
                        <div class="small text-muted">
                            <strong>Prompt:</strong> ${result.optimizedPrompt.substring(0, 100)}...
                        </div>
                        ${isDemo ? '<div class="small text-primary mt-1"><i class="bi bi-info-circle"></i> This is a demo placeholder. Add OpenAI credits for real images.</div>' : ''}
                    </div>
                </div>
            </div>
        `;

        imageResults.innerHTML = resultHtml + imageResults.innerHTML;
    }

    async approveImage(imagePath, finalPrompt) {
        try {
            const caption = prompt('Enter a caption for this image (optional):') || '';
            const level = confirm('Add to Project level (OK) or Campaign level (Cancel)?') ? 'project' : 'campaign';
            
            const endpoint = level === 'project' 
                ? `/projects/${this.currentProject.name}/approvedImages`
                : `/projects/${this.currentProject.name}/campaigns/${this.currentCampaign.name}/references`;

            await this.apiCall(endpoint, {
                method: 'POST',
                body: JSON.stringify({
                    requestId: this.currentRequest.id,
                    imagePath,
                    finalPrompt,
                    caption,
                    pinned: false
                })
            });

            const levelText = level === 'project' ? 'project' : 'campaign';
            this.showAlert(`Image approved and added to ${levelText} references!`, 'success');
            await this.loadReferences(this.currentProject.name, this.currentCampaign.name);
        } catch (error) {
            this.showAlert('Failed to approve image', 'danger');
        }
    }

    rejectImage() {
        document.getElementById('feedbackSection').style.display = 'block';
        document.getElementById('feedbackInput').focus();
        this.showAlert('Please provide feedback and regenerate', 'info');
    }

    showImageModal(imagePath) {
        // Create a simple image modal
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Generated Image</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center">
                        <img src="/${imagePath}" class="modal-image" alt="Generated Image">
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
        
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }

    clearResults() {
        document.getElementById('imageResults').innerHTML = '';
    }

    // File upload functions
    async uploadProjectReferenceImages(projectName, files) {
        for (const file of files) {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('name', file.name);
            formData.append('description', `Project reference image: ${file.name}`);

            try {
                await fetch(`/api/projects/${encodeURIComponent(projectName)}/referenceImages`, {
                    method: 'POST',
                    body: formData
                });
            } catch (error) {
                console.error('Failed to upload project reference image:', error);
                this.showAlert(`Failed to upload ${file.name}`, 'warning');
            }
        }
    }

    async uploadCampaignReferenceImages(projectName, campaignName, files) {
        for (const file of files) {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('name', file.name);
            formData.append('description', `Campaign reference image: ${file.name}`);

            try {
                await fetch(`/api/projects/${encodeURIComponent(projectName)}/campaigns/${encodeURIComponent(campaignName)}/referenceImages`, {
                    method: 'POST',
                    body: formData
                });
            } catch (error) {
                console.error('Failed to upload campaign reference image:', error);
                this.showAlert(`Failed to upload ${file.name}`, 'warning');
            }
        }
    }
}

// Initialize the application
const app = new ImageGenApp();