#!/usr/bin/env python3
"""Run the game locally:  python3 serve.py   then open http://localhost:8000
Pass --no-browser to skip opening a browser window."""
import http.server, os, sys, webbrowser
os.chdir(os.path.dirname(os.path.abspath(__file__)))
PORT=8000
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control','no-store'); super().end_headers()
    # Only log failed requests; a log line per file can fill a tool's output pipe and stall the server
    def log_request(self,code='-',size='-'):
        if isinstance(code,int) and code>=400: super().log_request(code,size)
print('Serving on http://localhost:%d  (Ctrl+C to stop)'%PORT)
if '--no-browser' not in sys.argv: webbrowser.open('http://localhost:%d'%PORT)
# Threaded so one idle browser connection can't block every other request
http.server.ThreadingHTTPServer(('',PORT),H).serve_forever()
