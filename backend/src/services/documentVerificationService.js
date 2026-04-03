const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Document Verification Service
 * Integrates with Python AI model for document verification
 */
class DocumentVerificationService {
  constructor() {
    this.pythonScriptPath = path.join(__dirname, '../../../AI_model (1).py');
  }

  /**
   * Verify document using Python AI model
   * @param {string} filePath - Path to the document file
   * @returns {Promise<Object>} - Verification result
   */
  async verifyDocument(filePath) {
    return new Promise((resolve, reject) => {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return reject({
          success: false,
          status: 'Rejected',
          message: 'File not found'
        });
      }

      // Check if Python script exists
      if (!fs.existsSync(this.pythonScriptPath)) {
        return reject({
          success: false,
          status: 'Rejected',
          message: 'AI model not available'
        });
      }

      // Create temporary folder for processing
      const tempFolder = path.join(__dirname, '../../../temp_documents');
      if (!fs.existsSync(tempFolder)) {
        fs.mkdirSync(tempFolder, { recursive: true });
      }

      // Copy file to temp folder
      const tempFileName = `doc_${Date.now()}_${path.basename(filePath)}`;
      const tempFilePath = path.join(tempFolder, tempFileName);
      fs.copyFileSync(filePath, tempFilePath);

      // Execute Python script
      const pythonProcess = spawn('python', [this.pythonScriptPath, tempFilePath], {
        cwd: path.dirname(this.pythonScriptPath),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        // Clean up temp file
        try {
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
          }
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }

        if (code !== 0) {
          console.error('Python script error:', stderr);
          return reject({
            success: false,
            status: 'Rejected',
            message: 'Document verification failed'
          });
        }

        try {
          // Parse Python output
          const result = this.parsePythonOutput(stdout);
          resolve({
            success: true,
            ...result
          });
        } catch (parseError) {
          console.error('Parse error:', parseError);
          reject({
            success: false,
            status: 'Needs Review',
            message: 'Unable to process document'
          });
        }
      });

      pythonProcess.on('error', (error) => {
        // Clean up temp file
        try {
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
          }
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }

        console.error('Python process error:', error);
        reject({
          success: false,
          status: 'Rejected',
          message: 'Verification service unavailable'
        });
      });
    });
  }

  /**
   * Parse Python script output
   * @param {string} output - Raw Python output
   * @returns {Object} - Parsed result
   */
  parsePythonOutput(output) {
    // Expected output format:
    // Document: filename
    // Status  : Approved|Rejected|Needs Review
    // Reason  : reason message
    
    const lines = output.trim().split('\n');
    let status = 'Needs Review';
    let message = 'Document processed';

    for (const line of lines) {
      if (line.includes('Status  :')) {
        const statusMatch = line.match(/Status\s*:\s*(.+)/);
        if (statusMatch) {
          status = statusMatch[1].trim();
        }
      } else if (line.includes('Reason  :')) {
        const reasonMatch = line.match(/Reason\s*:\s*(.+)/);
        if (reasonMatch) {
          message = reasonMatch[1].trim();
        }
      }
    }

    return {
      status: status,
      message: message
    };
  }

  /**
   * Batch verify multiple documents
   * @param {string[]} filePaths - Array of file paths
   * @returns {Promise<Object[]>} - Array of verification results
   */
  async verifyMultipleDocuments(filePaths) {
    const results = [];
    
    for (const filePath of filePaths) {
      try {
        const result = await this.verifyDocument(filePath);
        results.push({
          filePath,
          ...result
        });
      } catch (error) {
        results.push({
          filePath,
          success: false,
          status: 'Rejected',
          message: error.message || 'Verification failed'
        });
      }
    }

    return results;
  }
}

module.exports = DocumentVerificationService;
