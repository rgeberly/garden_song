#!/usr/bin/env python3
"""Run the game locally:  python3 serve.py   then open http://localhost:8000
Pass --no-browser to skip opening a browser window.
The song editor is at http://localhost:8000/tools/song-editor.html"""
import http.server, os, sys, json, subprocess, webbrowser
os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0,'tools'); import songs_data
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
    # The song editor (tools/song-editor.html) saves through here: only from this computer
    def do_POST(self):
        if self.client_address[0] not in ('127.0.0.1','::1','::ffff:127.0.0.1'): self.send_error(403); return
        try:
            body=json.loads(self.rfile.read(int(self.headers.get('Content-Length') or 0)) or b'{}')
            name=str(body.get('song',''))
            data=songs_data.load_data()
            if name not in data: raise ValueError('no song called "%s"'%name)
            if self.path=='/api/song-save':
                if name in songs_data.PARTS: raise ValueError('%s is made of other songs: edit those'%name)
                notes=songs_data.clean_notes(body['n'],data[name]['len'])
                edits=songs_data.load_edits(); edits[name]=notes; songs_data.save_edits(edits)
                songs_data.set_notes(data,name,notes); songs_data.save_data(data)
            elif self.path=='/api/song-reset':
                # forget the hand edits and read the recording again (takes a little while)
                edits=songs_data.load_edits(); edits.pop(name,None); songs_data.save_edits(edits)
                r=subprocess.run([sys.executable,os.path.join('tools','build_songs.py'),name],capture_output=True,text=True)
                if r.returncode: raise ValueError((r.stderr or r.stdout).strip().splitlines()[-1])
                data=songs_data.load_data()
            else: self.send_error(404); return
            self.reply(200,{'ok':True,'song':data[name],'data':data})
        except Exception as e:
            self.reply(400,{'ok':False,'error':str(e)})
    def reply(self,code,obj):
        b=json.dumps(obj).encode()
        self.send_response(code); self.send_header('Content-Type','application/json')
        self.send_header('Content-Length',str(len(b))); self.end_headers(); self.wfile.write(b)
print('Serving on http://localhost:%d  (Ctrl+C to stop)'%PORT)
if '--no-browser' not in sys.argv: webbrowser.open('http://localhost:%d'%PORT)
# Threaded so one idle browser connection can't block every other request, with
# room for a browser asking for dozens of files at once (the default queue is 5)
class Server(http.server.ThreadingHTTPServer):
    request_queue_size=128
    daemon_threads=True
Server(('',PORT),H).serve_forever()
