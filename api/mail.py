import sys
import os
import json
import urllib.parse
from http.server import BaseHTTPRequestHandler

# Ensure mail_bridge in root can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import mail_bridge

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)
        action = params.get('action', ['folders'])[0]

        try:
            if action == 'folders':
                res = mail_bridge.get_folders()
            elif action == 'list':
                folder = params.get('folder', ['INBOX'])[0]
                page = int(params.get('page', ['1'])[0])
                limit = int(params.get('limit', ['25'])[0])
                search = params.get('search', [None])[0]
                res = mail_bridge.list_messages(folder=folder, page=page, limit=limit, search_query=search)
            elif action == 'read':
                folder = params.get('folder', ['INBOX'])[0]
                msg_id = params.get('id', [None])[0]
                res = mail_bridge.read_message(folder=folder, msg_id=msg_id)
            elif action == 'attachment':
                folder = params.get('folder', ['INBOX'])[0]
                msg_id = params.get('id', [None])[0]
                index = params.get('index', [None])[0]
                filename = params.get('filename', [None])[0]
                res = mail_bridge.get_attachment(folder=folder, msg_id=msg_id, part_index=index, filename=filename)
            else:
                res = {"success": False, "error": f"Unknown action '{action}'"}
                
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(res).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode('utf-8'))

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        try:
            payload = json.loads(body) if body else {}
            res = mail_bridge.send_email(
                to=payload.get("to", ""),
                subject=payload.get("subject", ""),
                body_text=payload.get("bodyText", ""),
                body_html=payload.get("bodyHtml", ""),
                cc=payload.get("cc", ""),
                bcc=payload.get("bcc", ""),
                attachments=payload.get("attachments", []),
                in_reply_to=payload.get("inReplyTo", None),
                references=payload.get("references", None)
            )
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(res).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode('utf-8'))
