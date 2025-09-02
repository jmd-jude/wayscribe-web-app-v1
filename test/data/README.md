# Test Data Directory

This directory contains test files required for application functionality.

## Important Files

### 05-versions-space.pdf
**DO NOT DELETE** - This PDF is required for pdf-parse module initialization and path resolution. The pdf-parse library has known issues with worker file paths that require a PDF to be present during module loading. Without this test file, PDF upload functionality may fail in production.

Technical details:
- pdf-parse bundles worker files that must be accessible relative to the module
- The server.js code includes a workaround (`process.chdir`) for these path issues
- This test PDF ensures the workaround functions correctly during deployment
