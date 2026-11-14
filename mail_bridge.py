#!/usr/bin/env python3
"""
MAB Group Executive Maritime Webmail Bridge
Provides full IMAP & SMTP bridge for kumail.syed@mabgrp.com
Handles Folders, Message Listing, Rich Reading, Attachments, Compose & Reply.
"""

import sys
import os
import json
import ssl
import email
from email.header import decode_header, make_header
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email.mime.application import MIMEApplication
from email.utils import formatdate, make_msgid, parseaddr
import imaplib
import smtplib
import base64
import time
from datetime import datetime

# Load .env file manually if exists
def load_env():
    env_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    if os.path.exists(env_file):
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, val = line.split('=', 1)
                    os.environ.setdefault(key.strip(), val.strip())

load_env()

MAIL_USER = os.environ.get('MAB_MAIL_USER', 'kumail.syed@mabgrp.com')
MAIL_PASS = os.environ.get('MAB_MAIL_PASS', 'S0HdO}SxO(ko')
IMAP_HOST = os.environ.get('MAB_IMAP_HOST', 'mail.mabgrp.com')
IMAP_PORT = int(os.environ.get('MAB_IMAP_PORT', 993))
SMTP_HOST = os.environ.get('MAB_SMTP_HOST', 'mail.mabgrp.com')
SMTP_PORT = int(os.environ.get('MAB_SMTP_PORT', 465))

def decode_mime_header(val):
    if not val:
        return ""
    try:
        decoded_pairs = decode_header(val)
        result = []
        for text, encoding in decoded_pairs:
            if isinstance(text, bytes):
                result.append(text.decode(encoding or 'utf-8', errors='replace'))
            else:
                result.append(str(text))
        return "".join(result)
    except Exception:
        return str(val)

def get_imap():
    ctx = ssl.create_default_context()
    mail = imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT, ssl_context=ctx)
    mail.login(MAIL_USER, MAIL_PASS)
    return mail

def get_smtp():
    ctx = ssl.create_default_context()
    server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=ctx, timeout=30)
    server.login(MAIL_USER, MAIL_PASS)
    return server

def normalize_folder_name(raw_name):
    clean = raw_name.strip('"')
    display_name = clean
    icon = "folder"
    sort_order = 10
    
    clean_lower = clean.lower()
    if clean_lower == "inbox":
        display_name = "Inbox"
        icon = "inbox"
        sort_order = 1
    elif "sent" in clean_lower:
        display_name = "Sent Messages"
        icon = "send"
        sort_order = 2
    elif "draft" in clean_lower:
        display_name = "Drafts"
        icon = "file-text"
        sort_order = 3
    elif "spam" in clean_lower or "junk" in clean_lower:
        display_name = "Spam / Junk"
        icon = "alert-octagon"
        sort_order = 4
    elif "trash" in clean_lower or "deleted" in clean_lower:
        display_name = "Trash"
        icon = "trash-2"
        sort_order = 5
    elif "archive" in clean_lower:
        display_name = "Archive"
        icon = "archive"
        sort_order = 6
        
    return {
        "id": clean,
        "name": clean,
        "displayName": display_name,
        "icon": icon,
        "sortOrder": sort_order
    }

def get_folders():
    mail = get_imap()
    try:
        status, folder_data = mail.list()
        folders = []
        if status == 'OK':
            for line in folder_data:
                if not line:
                    continue
                line_str = line.decode('utf-8', errors='ignore')
                # Parse format: (\Flags) "delimiter" "FolderName"
                parts = line_str.split(' "." ')
                if len(parts) >= 2:
                    raw_name = parts[-1].strip().strip('"')
                else:
                    parts = line_str.split(' "/" ')
                    raw_name = parts[-1].strip().strip('"') if len(parts) >= 2 else line_str
                
                info = normalize_folder_name(raw_name)
                
                # Fetch counts
                try:
                    mail.select(f'"{raw_name}"', readonly=True)
                    _, count_data = mail.search(None, 'ALL')
                    all_ids = count_data[0].split() if count_data and count_data[0] else []
                    info["totalCount"] = len(all_ids)
                    
                    _, unseen_data = mail.search(None, 'UNSEEN')
                    unseen_ids = unseen_data[0].split() if unseen_data and unseen_data[0] else []
                    info["unreadCount"] = len(unseen_ids)
                except Exception as ex:
                    info["totalCount"] = 0
                    info["unreadCount"] = 0
                
                folders.append(info)
                
        # Sort folders logically (Inbox, Sent, Drafts, Spam, Trash, Archive)
        folders.sort(key=lambda x: x["sortOrder"])
        return {"success": True, "folders": folders, "user": MAIL_USER}
    finally:
        try:
            mail.logout()
        except Exception:
            pass

def list_messages(folder='INBOX', page=1, limit=25, search_query=None):
    mail = get_imap()
    try:
        status, _ = mail.select(f'"{folder}"', readonly=True)
        if status != 'OK':
            return {"success": False, "error": f"Failed to select folder {folder}"}
        
        # Search criteria
        if search_query:
            status, search_data = mail.search(None, 'TEXT', f'"{search_query}"')
        else:
            status, search_data = mail.search(None, 'ALL')
            
        all_ids = search_data[0].split() if status == 'OK' and search_data[0] else []
        total_count = len(all_ids)
        
        # Latest first (reverse order)
        all_ids.reverse()
        
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paged_ids = all_ids[start_idx:end_idx]
        
        messages = []
        for msg_id_bytes in paged_ids:
            msg_id = msg_id_bytes.decode()
            try:
                # Fetch headers and flags without altering \Seen
                res, fetch_data = mail.fetch(msg_id, '(BODY.PEEK[HEADER.FIELDS (FROM TO CC BCC SUBJECT DATE MESSAGE-ID CONTENT-TYPE)] FLAGS)')
                if res != 'OK':
                    continue
                
                raw_headers = b''
                flags_str = ''
                for item in fetch_data:
                    if isinstance(item, tuple):
                        raw_headers += item[1]
                        if len(item) > 0 and isinstance(item[0], bytes):
                            flags_str += item[0].decode('utf-8', errors='ignore')
                    elif isinstance(item, bytes):
                        flags_str += item.decode('utf-8', errors='ignore')
                
                parsed_msg = email.message_from_bytes(raw_headers)
                
                subject = decode_mime_header(parsed_msg.get('Subject', '(No Subject)'))
                from_raw = decode_mime_header(parsed_msg.get('From', ''))
                to_raw = decode_mime_header(parsed_msg.get('To', ''))
                cc_raw = decode_mime_header(parsed_msg.get('Cc', ''))
                date_raw = parsed_msg.get('Date', '')
                msg_id_header = parsed_msg.get('Message-ID', '')
                content_type = parsed_msg.get('Content-Type', '')
                
                real_name, email_addr = parseaddr(from_raw)
                
                is_read = '\\Seen' in flags_str
                is_flagged = '\\Flagged' in flags_str
                has_attachment = 'multipart/mixed' in content_type.lower() or 'boundary=' in content_type.lower()
                
                messages.append({
                    "id": msg_id,
                    "subject": subject or "(No Subject)",
                    "from": from_raw,
                    "fromName": real_name or email_addr.split('@')[0] if email_addr else "Unknown",
                    "fromEmail": email_addr,
                    "to": to_raw,
                    "cc": cc_raw,
                    "date": date_raw,
                    "isRead": is_read,
                    "isFlagged": is_flagged,
                    "hasAttachment": has_attachment,
                    "messageIdHeader": msg_id_header
                })
            except Exception as e:
                continue
                
        return {
            "success": True,
            "folder": folder,
            "page": page,
            "limit": limit,
            "total": total_count,
            "totalPages": (total_count + limit - 1) // limit if limit > 0 else 1,
            "messages": messages
        }
    finally:
        try:
            mail.logout()
        except Exception:
            pass

def read_message(folder='INBOX', msg_id=None):
    if not msg_id:
        return {"success": False, "error": "Message ID is required"}
        
    mail = get_imap()
    try:
        # Select folder writable so we can mark as read
        mail.select(f'"{folder}"', readonly=False)
        
        status, fetch_data = mail.fetch(str(msg_id), '(RFC822)')
        if status != 'OK' or not fetch_data or not fetch_data[0]:
            return {"success": False, "error": f"Message {msg_id} not found"}
            
        raw_email = None
        for item in fetch_data:
            if isinstance(item, tuple) and len(item) >= 2 and isinstance(item[1], bytes):
                raw_email = item[1]
                break
                
        if not raw_email:
            return {"success": False, "error": "Unable to extract email payload"}
            
        msg = email.message_from_bytes(raw_email)
        
        subject = decode_mime_header(msg.get('Subject', '(No Subject)'))
        from_raw = decode_mime_header(msg.get('From', ''))
        to_raw = decode_mime_header(msg.get('To', ''))
        cc_raw = decode_mime_header(msg.get('Cc', ''))
        bcc_raw = decode_mime_header(msg.get('Bcc', ''))
        date_raw = msg.get('Date', '')
        msg_id_header = msg.get('Message-ID', '')
        reply_to = decode_mime_header(msg.get('Reply-To', ''))
        
        real_name, email_addr = parseaddr(from_raw)
        
        body_html = ""
        body_text = ""
        attachments = []
        
        part_index = 0
        for part in msg.walk():
            part_index += 1
            content_type = part.get_content_type()
            content_disposition = str(part.get("Content-Disposition", ""))
            
            filename = part.get_filename()
            if filename:
                filename = decode_mime_header(filename)
                
            is_attachment = "attachment" in content_disposition.lower() or (filename and "inline" not in content_disposition.lower())
            
            if is_attachment or filename:
                payload = part.get_payload(decode=True)
                size = len(payload) if payload else 0
                attachments.append({
                    "partIndex": part_index,
                    "filename": filename or f"attachment_{part_index}",
                    "contentType": content_type,
                    "size": size,
                    "sizeFormatted": f"{size / 1024:.1f} KB" if size < 1048576 else f"{size / 1048576:.2f} MB"
                })
            else:
                if content_type == "text/html":
                    try:
                        payload = part.get_payload(decode=True)
                        charset = part.get_content_charset() or 'utf-8'
                        body_html += payload.decode(charset, errors='replace')
                    except Exception:
                        pass
                elif content_type == "text/plain":
                    try:
                        payload = part.get_payload(decode=True)
                        charset = part.get_content_charset() or 'utf-8'
                        body_text += payload.decode(charset, errors='replace')
                    except Exception:
                        pass
                        
        # Mark as read
        try:
            mail.store(str(msg_id), '+FLAGS', '\\Seen')
        except Exception:
            pass
            
        return {
            "success": True,
            "id": str(msg_id),
            "folder": folder,
            "subject": subject,
            "from": from_raw,
            "fromName": real_name or email_addr.split('@')[0] if email_addr else "Unknown",
            "fromEmail": email_addr,
            "to": to_raw,
            "cc": cc_raw,
            "bcc": bcc_raw,
            "date": date_raw,
            "replyTo": reply_to or email_addr,
            "messageIdHeader": msg_id_header,
            "bodyHtml": body_html,
            "bodyText": body_text,
            "attachments": attachments
        }
    finally:
        try:
            mail.logout()
        except Exception:
            pass

def get_attachment(folder='INBOX', msg_id=None, part_index=None, filename=None):
    if not msg_id:
        return {"success": False, "error": "Message ID required"}
        
    mail = get_imap()
    try:
        mail.select(f'"{folder}"', readonly=True)
        status, fetch_data = mail.fetch(str(msg_id), '(RFC822)')
        if status != 'OK' or not fetch_data:
            return {"success": False, "error": "Failed to fetch message"}
            
        raw_email = None
        for item in fetch_data:
            if isinstance(item, tuple) and len(item) >= 2 and isinstance(item[1], bytes):
                raw_email = item[1]
                break
                
        msg = email.message_from_bytes(raw_email)
        curr_part = 0
        for part in msg.walk():
            curr_part += 1
            part_fn = part.get_filename()
            if part_fn:
                part_fn = decode_mime_header(part_fn)
                
            matches_index = (part_index is not None and int(part_index) == curr_part)
            matches_name = (filename and part_fn and filename.strip().lower() == part_fn.strip().lower())
            
            if matches_index or matches_name or (part_fn and not filename and part_index is None):
                payload = part.get_payload(decode=True)
                if payload:
                    b64_data = base64.b64encode(payload).decode('utf-8')
                    return {
                        "success": True,
                        "filename": part_fn or f"attachment_{curr_part}",
                        "contentType": part.get_content_type() or "application/octet-stream",
                        "size": len(payload),
                        "dataBase64": b64_data
                    }
                    
        return {"success": False, "error": "Attachment part not found"}
    finally:
        try:
            mail.logout()
        except Exception:
            pass

def send_email(to, subject, body_text="", body_html="", cc="", bcc="", attachments=None, in_reply_to=None, references=None):
    if not to:
        return {"success": False, "error": "Recipient 'To' address is mandatory"}
        
    msg = MIMEMultipart("mixed")
    msg["From"] = f"Kumail Rizvi <{MAIL_USER}>"
    msg["To"] = to
    if cc:
        msg["Cc"] = cc
    msg["Subject"] = subject
    msg["Date"] = formatdate(localtime=True)
    msg["Message-ID"] = make_msgid(domain="mabgrp.com")
    
    if in_reply_to:
        msg["In-Reply-To"] = in_reply_to
    if references:
        msg["References"] = references
        
    # Body container
    body_container = MIMEMultipart("alternative")
    if body_text:
        body_container.attach(MIMEText(body_text, "plain", "utf-8"))
    if body_html:
        body_container.attach(MIMEText(body_html, "html", "utf-8"))
    elif body_text:
        # Fallback HTML with clean maritime styling
        styled_html = f"<div style='font-family:Arial,sans-serif;font-size:14px;color:#1e293b;line-height:1.6;'>{body_text.replace(chr(10), '<br>')}</div>"
        body_container.attach(MIMEText(styled_html, "html", "utf-8"))
        
    msg.attach(body_container)
    
    # Process attachments
    # Attachments can be list of dicts: {"filename": "quote.pdf", "dataBase64": "...", "contentType": "application/pdf"}
    # Or local file paths
    if attachments and isinstance(attachments, list):
        for att in attachments:
            try:
                if isinstance(att, dict) and "dataBase64" in att:
                    raw_data = base64.b64decode(att["dataBase64"])
                    fname = att.get("filename", "attachment")
                    ctype = att.get("contentType", "application/octet-stream")
                    part = MIMEApplication(raw_data, Name=fname)
                    part["Content-Disposition"] = f'attachment; filename="{fname}"'
                    msg.attach(part)
                elif isinstance(att, str) and os.path.exists(att):
                    with open(att, "rb") as f:
                        raw_data = f.read()
                    fname = os.path.basename(att)
                    part = MIMEApplication(raw_data, Name=fname)
                    part["Content-Disposition"] = f'attachment; filename="{fname}"'
                    msg.attach(part)
            except Exception as e:
                print(f"Warning: Failed to attach file {att}: {e}", file=sys.stderr)
                
    # Build recipient list
    all_recipients = [addr.strip() for addr in to.split(",") if addr.strip()]
    if cc:
        all_recipients.extend([addr.strip() for addr in cc.split(",") if addr.strip()])
    if bcc:
        all_recipients.extend([addr.strip() for addr in bcc.split(",") if addr.strip()])
        
    # Dispatch via SMTP SSL
    smtp_server = get_smtp()
    try:
        smtp_server.sendmail(MAIL_USER, all_recipients, msg.as_string())
    finally:
        try:
            smtp_server.quit()
        except Exception:
            pass
            
    # Append to INBOX.Sent folder in IMAP so user has full audit trail
    try:
        mail = get_imap()
        try:
            raw_msg = msg.as_bytes()
            mail.append('"INBOX.Sent"', '\\Seen', imaplib.Time2Internaldate(time.time()), raw_msg)
        finally:
            mail.logout()
    except Exception as e:
        print(f"Notice: Email dispatched successfully via SMTP, but could not append to Sent folder: {e}", file=sys.stderr)
        
    return {
        "success": True,
        "message": "Email dispatched successfully",
        "recipients": all_recipients,
        "subject": subject,
        "sentAt": datetime.now().isoformat()
    }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No action specified. Use folders, list, read, attachment, or send"}))
        sys.exit(1)
        
    action = sys.argv[1].lower()
    
    try:
        if action == "folders":
            res = get_folders()
            print(json.dumps(res))
            
        elif action == "list":
            folder = 'INBOX'
            page = 1
            limit = 25
            query = None
            
            i = 2
            while i < len(sys.argv):
                arg = sys.argv[i]
                if arg == "--folder" and i + 1 < len(sys.argv):
                    folder = sys.argv[i + 1]
                    i += 2
                elif arg == "--page" and i + 1 < len(sys.argv):
                    page = int(sys.argv[i + 1])
                    i += 2
                elif arg == "--limit" and i + 1 < len(sys.argv):
                    limit = int(sys.argv[i + 1])
                    i += 2
                elif arg == "--search" and i + 1 < len(sys.argv):
                    query = sys.argv[i + 1]
                    i += 2
                else:
                    i += 1
                    
            res = list_messages(folder=folder, page=page, limit=limit, search_query=query)
            print(json.dumps(res))
            
        elif action == "read":
            folder = 'INBOX'
            msg_id = None
            
            i = 2
            while i < len(sys.argv):
                arg = sys.argv[i]
                if arg == "--folder" and i + 1 < len(sys.argv):
                    folder = sys.argv[i + 1]
                    i += 2
                elif arg == "--id" and i + 1 < len(sys.argv):
                    msg_id = sys.argv[i + 1]
                    i += 2
                else:
                    i += 1
                    
            res = read_message(folder=folder, msg_id=msg_id)
            print(json.dumps(res))
            
        elif action == "attachment":
            folder = 'INBOX'
            msg_id = None
            part_index = None
            filename = None
            
            i = 2
            while i < len(sys.argv):
                arg = sys.argv[i]
                if arg == "--folder" and i + 1 < len(sys.argv):
                    folder = sys.argv[i + 1]
                    i += 2
                elif arg == "--id" and i + 1 < len(sys.argv):
                    msg_id = sys.argv[i + 1]
                    i += 2
                elif arg == "--index" and i + 1 < len(sys.argv):
                    part_index = int(sys.argv[i + 1])
                    i += 2
                elif arg == "--filename" and i + 1 < len(sys.argv):
                    filename = sys.argv[i + 1]
                    i += 2
                else:
                    i += 1
                    
            res = get_attachment(folder=folder, msg_id=msg_id, part_index=part_index, filename=filename)
            print(json.dumps(res))
            
        elif action == "send":
            # Can read payload from JSON string arg or stdin
            if len(sys.argv) >= 3 and sys.argv[2] == "--json" and len(sys.argv) >= 4:
                payload = json.loads(sys.argv[3])
            elif not sys.stdin.isatty():
                payload = json.loads(sys.stdin.read())
            else:
                payload = {}
                
            res = send_email(
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
            print(json.dumps(res))
            
        else:
            print(json.dumps({"error": f"Unknown action '{action}'"}))
            sys.exit(1)
            
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
