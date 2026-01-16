import json
import os
import smtplib
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def handler(event: dict, context) -> dict:
    """Отправка кода верификации на email или телефон"""
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        data = json.loads(event.get('body', '{}'))
        contact_type = data.get('contactType')
        contact = data.get('contact')
        code = data.get('code')
        
        if not all([contact_type, contact, code]):
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Missing required fields'})
            }
        
        if contact_type == 'email':
            result = send_email(contact, code)
        else:
            result = send_sms(contact, code)
        
        if result['success']:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Code sent successfully'})
            }
        else:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': result['error']})
            }
            
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }


def send_email(to_email: str, code: str) -> dict:
    """Отправка кода на email"""
    try:
        smtp_password = os.environ.get('SMTP_PASSWORD')
        
        if not smtp_password:
            return {'success': True, 'message': 'Demo mode - check console for code', 'code': code}
        
        smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
        smtp_port = int(os.environ.get('SMTP_PORT', '587'))
        smtp_user = os.environ.get('SMTP_USER', 'noreply@poehali.dev')
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = 'Код верификации'
        msg['From'] = f'Система верификации <{smtp_user}>'
        msg['To'] = to_email
        
        html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #9b87f5; text-align: center;">🔐 Код верификации</h2>
                    <p style="font-size: 16px; color: #333;">Ваш код подтверждения:</p>
                    <div style="background-color: #f0ebff; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; color: #9b87f5; letter-spacing: 5px;">{code}</span>
                    </div>
                    <p style="font-size: 14px; color: #666;">Введите этот код в форму для завершения верификации.</p>
                    <p style="font-size: 12px; color: #999; margin-top: 30px;">Если вы не запрашивали этот код, просто проигнорируйте это письмо.</p>
                </div>
            </body>
        </html>
        """
        
        part = MIMEText(html, 'html')
        msg.attach(part)
        
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
        
        return {'success': True}
        
    except Exception as e:
        return {'success': False, 'error': str(e)}


def send_sms(phone: str, code: str) -> dict:
    """Отправка кода через SMS"""
    try:
        api_key = os.environ.get('SMS_API_KEY', 'demo')
        
        if api_key == 'demo':
            return {'success': True, 'message': 'SMS demo mode - код не отправлен'}
        
        phone_clean = ''.join(filter(str.isdigit, phone))
        
        message = f'Ваш код верификации: {code}'
        
        url = 'https://smsc.ru/sys/send.php'
        params = {
            'login': api_key.split(':')[0] if ':' in api_key else api_key,
            'psw': api_key.split(':')[1] if ':' in api_key else '',
            'phones': phone_clean,
            'mes': message,
            'fmt': 3
        }
        
        response = requests.get(url, params=params, timeout=10)
        result = response.json()
        
        if result.get('error'):
            return {'success': False, 'error': result.get('error_code', 'SMS sending failed')}
        
        return {'success': True}
        
    except Exception as e:
        return {'success': False, 'error': str(e)}