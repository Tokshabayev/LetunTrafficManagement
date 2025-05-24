import http.server
import socketserver

PORT = 8000
DIRECTORY = "."

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving at http://localhost:{PORT}")
    httpd.serve_forever()

# ffmpeg -re -stream_loop -1 -i test.mp4 -an -c:v copy -f hls -hls_time 2 -hls_list_size 5 -hls_flags delete_segments hls_output/stream.m3u8
