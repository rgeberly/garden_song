#!/usr/bin/env python3
"""Run the game locally:  python3 serve.py   then open http://localhost:8000
Pass --no-browser to skip opening a browser window."""
import http.server, os, sys, webbrowser
os.chdir(os.path.dirname(os.path.abspath(__file__)))
PORT=8000
class H(http.server.SimpleHTTPRequestHandler):
    timeout=15   # a connection that goes quiet can't hold a thread forever
    def end_headers(self):
        self.send_header('Cache-Control','no-store'); super().end_headers()
    # Only log failed requests; a log line per file can fill a tool's output pipe and stall the server
    def log_request(self,code='-',size='-'):
        if isinstance(code,int) and code>=400: super().log_request(code,size)
    # Byte ranges, like GitHub Pages: audio can only start partway (the title theme at
    # 0:16) when the server will send part of the file
    def send_head(self):
        rng=self.headers.get('Range'); path=self.translate_path(self.path)
        if not rng or not rng.startswith('bytes=') or not os.path.isfile(path): return super().send_head()
        size=os.path.getsize(path); a,_,z=rng[6:].split(',')[0].partition('-')
        start=int(a) if a else max(0,size-int(z)); end=min(size-1,int(z)) if a and z else size-1
        if start>=size: self.send_error(416); return None
        f=open(path,'rb'); f.seek(start); self._left=end-start+1
        self.send_response(206)
        self.send_header('Content-Type',self.guess_type(path))
        self.send_header('Content-Range','bytes %d-%d/%d'%(start,end,size))
        self.send_header('Content-Length',str(self._left)); self.send_header('Accept-Ranges','bytes')
        self.end_headers(); return f
    def copyfile(self,src,dst):
        left=getattr(self,'_left',None)
        if left is None: return super().copyfile(src,dst)
        while left>0:
            buf=src.read(min(65536,left))
            if not buf: break
            dst.write(buf); left-=len(buf)
        self._left=None
print('Serving on http://localhost:%d  (Ctrl+C to stop)'%PORT)
if '--no-browser' not in sys.argv: webbrowser.open('http://localhost:%d'%PORT)
# Threaded so one idle browser connection can't block every other request, with
# room for a browser asking for dozens of files at once (the default queue is 5)
class Server(http.server.ThreadingHTTPServer):
    request_queue_size=128
    daemon_threads=True
Server(('',PORT),H).serve_forever()
