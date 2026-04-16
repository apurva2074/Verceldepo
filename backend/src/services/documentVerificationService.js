const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Document Verification Service
 * Integrates with Python AI model for document verification
 */
class DocumentVerificationService {
  constructor() {
    // Use relative path from backend/src/services to backend folder
    this.pythonScriptPath = path.join(__dirname, '../../AI_model.py');
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
      console.log("SCRIPT PATH:", this.pythonScriptPath);
      console.log("SCRIPT EXISTS:", fs.existsSync(this.pythonScriptPath));
      console.log("FILE PATH:", filePath);
      
      if (!fs.existsSync(this.pythonScriptPath)) {
        console.error("PYTHON SCRIPT DOES NOT EXIST:", this.pythonScriptPath);
        return reject({
          success: false,
          status: 'Rejected',
          message: 'AI model not available - script not found'
        });
      } else {
        console.log("Python script found at:", this.pythonScriptPath);
      }

      // Verify input file exists
      if (!fs.existsSync(filePath)) {
        console.error("INPUT FILE DOES NOT EXIST:", filePath);
        return reject({
          success: false,
          status: 'Rejected',
          message: 'Input file not found'
        });
      } else {
        console.log("Input file found at:", filePath);
      }

      // Create temporary folder for processing
      const tempFolder = path.join(__dirname, '../../../temp_documents');
      if (!fs.existsSync(tempFolder)) {
        fs.mkdirSync(tempFolder, { recursive: true });
      }

      // Copy file to temp folder
      const tempFileName = 'doc_' + Date.now() + '_' + path.basename(filePath);
      const tempFilePath = path.join(tempFolder, tempFileName);
      fs.copyFileSync(filePath, tempFilePath);

      // Execute Python script with full path
      const scriptPath = this.pythonScriptPath;
      
      console.log('Running: python ' + scriptPath + ' ' + tempFilePath);
      
      // Try multiple Python paths for Windows
      const pythonPaths = [
        'python',
        'C:\\Python39\\python.exe',
        'C:\\Python310\\python.exe',
        'C:\\Python311\\python.exe',
        'C:\\Python312\\python.exe',
        'C:\\Program Files\\Python39\\python.exe',
        'C:\\Program Files\\Python310\\python.exe',
        'C:\\Program Files\\Python311\\python.exe',
        'C:\\Program Files\\Python312\\python.exe'
      ];
      
      let pythonProcess;
      for (const pythonPath of pythonPaths) {
        try {
          console.log(`Trying Python path: ${pythonPath}`);
          pythonProcess = spawn(pythonPath, [scriptPath, tempFilePath], {
            cwd: path.dirname(scriptPath),
            stdio: ['pipe', 'pipe', 'pipe']
          });
          break;
        } catch (error) {
          console.log(`Failed to use Python path: ${pythonPath}`, error.message);
          continue;
        }
      }
      
      if (!pythonProcess) {
        return reject({
          success: false,
          status: 'Rejected',
          message: 'Python not found on system'
        });
      }

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        console.log("PYTHON OUTPUT:", output);
      });

      pythonProcess.stderr.on('data', (data) => {
        const error = data.toString();
        stderr += error;
        console.error("PYTHON ERROR:", error);
      });

      pythonProcess.on('close', (code) => {
        console.log("PYTHON EXIT CODE:", code);
        console.log("Python script execution completed with exit code:", code);
        
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
            message: 'AI verification failed: ' + (stderr || 'Unknown error')
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
