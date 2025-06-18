# File Storage System Plan

## Directory Structure

```
assets/
├── references/
│   ├── {projectName}/
│   │   ├── project/              # Project-level reference images
│   │   │   ├── {imageId}.{ext}
│   │   │   └── ...
│   │   └── campaigns/
│   │       └── {campaignName}/   # Campaign-level reference images
│   │           ├── {imageId}.{ext}
│   │           └── ...
├── generated/                    # Existing generated images
│   └── {project}/{campaign}/{request}/{timestamp}/
│       └── image.png
└── temp/                        # Temporary uploads
    └── {uploadId}.{ext}
```

## File Upload Specifications

### Supported Formats
- **Images**: JPEG, PNG, WebP, GIF
- **File Size Limit**: 10MB per file
- **Validation**: MIME type + file extension verification

### Upload Process
1. **Temporary Storage**: Files uploaded to `assets/temp/`
2. **Validation**: Check format, size, and security
3. **Processing**: Generate thumbnails if needed
4. **Final Storage**: Move to appropriate reference directory
5. **Metadata Update**: Update project/campaign JSON with file info

### Security Measures
- File type validation
- Sanitized file names
- Size limits
- Virus scanning (optional for future)

## API Endpoints

### Reference Image Management
- `POST /api/projects/{project}/referenceImages` - Upload project reference
- `POST /api/projects/{project}/campaigns/{campaign}/referenceImages` - Upload campaign reference
- `GET /api/projects/{project}/referenceImages` - List project references
- `GET /api/projects/{project}/campaigns/{campaign}/referenceImages` - List campaign references
- `DELETE /api/referenceImages/{imageId}` - Delete reference image
- `PUT /api/referenceImages/{imageId}` - Update reference metadata

### File Serving
- `GET /assets/references/...` - Serve reference images
- `GET /api/referenceImages/{imageId}/thumbnail` - Serve thumbnails