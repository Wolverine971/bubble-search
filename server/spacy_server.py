#!/usr/bin/env python
# spacy_server.py
"""
A simple spaCy server that provides entity recognition via HTTP.
"""
import spacy
import json
import argparse
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs

# Load spaCy model
print("Loading spaCy model...")
nlp = spacy.load("en_core_web_sm")
print("Model loaded successfully!")

class SpacyHandler(BaseHTTPRequestHandler):
    def _set_headers(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_OPTIONS(self):
        self._set_headers()
    
    def do_GET(self):
        self._set_headers()
        self.wfile.write(json.dumps({"status": "spaCy server is running"}).encode())
    
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length).decode('utf-8')
        
        try:
            # Try to parse as JSON
            try:
                data = json.loads(post_data)
                text = data.get('text', '')
            except json.JSONDecodeError:
                # If not JSON, try form data
                data = parse_qs(post_data)
                text = data.get('text', [''])[0]
            
            if not text:
                self._set_headers()
                self.wfile.write(json.dumps({"error": "No text provided"}).encode())
                return
            
            # Process with spaCy
            doc = nlp(text)
            
            # Extract entities
            entities = []
            for ent in doc.ents:
                entities.append({
                    "text": ent.text,
                    "label": ent.label_,
                    "start": ent.start_char,
                    "end": ent.end_char
                })
            
            # Extract sentences
            sentences = [sent.text for sent in doc.sents]
            
            # Create response
            response = {
                "entities": entities,
                "sentences": sentences,
                "text": text
            }
            
            self._set_headers()
            self.wfile.write(json.dumps(response).encode())
        
        except Exception as e:
            self._set_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

def run_server(port=5001):
    server_address = ('', port)
    httpd = HTTPServer(server_address, SpacyHandler)
    print(f"Starting spaCy server on port {port}...")
    httpd.serve_forever()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Run a spaCy server')
    parser.add_argument('--port', type=int, default=5001, help='Port to run the server on')
    args = parser.parse_args()
    
    run_server(args.port)