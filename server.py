import http.server
import socketserver
import json
import os
import urllib.parse

PORT = 8000
DIRECTORY = os.path.abspath(os.path.dirname(__file__))

# Load the default sales data
sales_data_file = os.path.join(DIRECTORY, "sales_data_default.json")
try:
    with open(sales_data_file, "r") as f:
        default_sales_data = json.load(f)
except Exception as e:
    print(f"Warning: Could not load {sales_data_file}: {e}")
    default_sales_data = []

# In-memory store
current_sales_data = list(default_sales_data)

class BIHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        if parsed_url.path == '/api/sales':
            response_bytes = json.dumps(current_sales_data).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(response_bytes)))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(response_bytes)
            return
        
        # Default behavior for static files
        super().do_GET()

    def do_POST(self):
        global current_sales_data
        parsed_url = urllib.parse.urlparse(self.path)
        
        if parsed_url.path == '/api/sales':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                if isinstance(data, list):
                    current_sales_data = data
                    response_bytes = json.dumps({"success": True, "count": len(current_sales_data)}).encode('utf-8')
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Content-Length', str(len(response_bytes)))
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(response_bytes)
                else:
                    self.send_error(400, "Body must be a JSON array")
            except Exception as e:
                self.send_error(400, f"Invalid JSON: {str(e)}")
            return

        if parsed_url.path == '/api/sales/reset':
            current_sales_data = list(default_sales_data)
            response_bytes = json.dumps({"success": True, "count": len(current_sales_data)}).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(response_bytes)))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(response_bytes)
            return

        self.send_error(404, "Endpoint not found")

# Avoid "Address already in use" errors on restart
socketserver.TCPServer.allow_reuse_address = True

if __name__ == '__main__':
    print(f"Starting G-Analytic BI server at http://localhost:{PORT}")
    print("Press Ctrl+C to stop.")
    with socketserver.TCPServer(("", PORT), BIHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopping server...")
