#!/usr/bin/env python3
"""
Rent Prediction Server Startup Script
This script starts the Flask API server for rent prediction
"""

import sys
import os
import subprocess
import time

def check_and_install_dependencies():
    """Check if required dependencies are installed, install if not"""
    print("Checking dependencies...")
    
    try:
        import pandas
        import numpy
        import sklearn
        import joblib
        import flask
        print("✓ All dependencies are installed")
        return True
    except ImportError as e:
        print(f"✗ Missing dependency: {e}")
        print("Installing dependencies...")
        
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
            print("✓ Dependencies installed successfully")
            return True
        except subprocess.CalledProcessError:
            print("✗ Failed to install dependencies")
            print("Please run: pip install -r requirements.txt")
            return False

def start_server():
    """Start the rent prediction server"""
    print("Starting Rent Prediction Server...")
    print("=" * 50)
    
    # Check dependencies first
    if not check_and_install_dependencies():
        sys.exit(1)
    
    # Import and start the server
    try:
        from rent_prediction_model import create_prediction_api
        
        # Create Flask app
        app = create_prediction_api()
        
        print("✓ Model trained and loaded successfully")
        print("✓ Server starting on http://localhost:5001")
        print("=" * 50)
        print("Available endpoints:")
        print("  POST /predict - Predict rent for property")
        print("  GET  /areas   - Get available Mumbai areas")
        print("  GET  /health  - Health check")
        print("  GET  /info    - Model information")
        print("=" * 50)
        print("Press Ctrl+C to stop the server")
        print()
        
        # Start the server
        app.run(host='0.0.0.0', port=5001, debug=False)
        
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except Exception as e:
        print(f"✗ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    start_server()
