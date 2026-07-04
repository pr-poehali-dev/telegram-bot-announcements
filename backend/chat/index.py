import json
import os
import psycopg2
import psycopg2.extras


def handler(event: dict, context) -> dict:
    '''
    Business: Чат покупателя с продавцом по объявлению — список чатов, история и отправка сообщений.
    Args: event с httpMethod (GET список/история, POST отправка сообщения), queryStringParameters, body.
    Returns: HTTP-ответ со списком чатов, историей сообщений или результатом отправки.
    '''
    method = event.get('httpMethod', 'GET')

    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**cors, 'Access-Control-Max-Age': '86400'}, 'body': ''}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        chat_id = params.get('chat_id')

        if chat_id:
            cur.execute(f"SELECT * FROM messages WHERE chat_id = {int(chat_id)} ORDER BY created_at ASC")
            rows = cur.fetchall()
            result = []
            for r in rows:
                item = dict(r)
                if item.get('created_at'):
                    item['created_at'] = item['created_at'].isoformat()
                result.append(item)
            cur.close()
            conn.close()
            return {
                'statusCode': 200,
                'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps({'messages': result}),
            }

        cur.execute(
            "SELECT c.id, c.listing_id, c.seller_name, l.title AS listing_title, l.image_url, "
            "(SELECT text FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_text, "
            "(SELECT created_at FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_time, "
            "(SELECT COUNT(*) FROM messages m WHERE m.chat_id = c.id AND m.sender = 'seller' AND m.is_read = FALSE) AS unread "
            "FROM chats c LEFT JOIN listings l ON l.id = c.listing_id "
            "ORDER BY last_time DESC NULLS LAST"
        )
        rows = cur.fetchall()
        result = []
        for r in rows:
            item = dict(r)
            if item.get('last_time'):
                item['last_time'] = item['last_time'].isoformat()
            result.append(item)
        cur.close()
        conn.close()
        return {
            'statusCode': 200,
            'headers': {**cors, 'Content-Type': 'application/json'},
            'body': json.dumps({'chats': result}),
        }

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        action = body.get('action', 'send')

        if action == 'open':
            listing_id = int(body.get('listing_id'))
            seller_name = (body.get('seller_name') or 'Продавец').replace("'", "''")
            buyer_name = 'Вы'

            cur.execute(f"SELECT id FROM chats WHERE listing_id = {listing_id} AND buyer_name = '{buyer_name}'")
            existing = cur.fetchone()
            if existing:
                chat_id = existing['id']
            else:
                cur.execute(
                    f"INSERT INTO chats (listing_id, buyer_name, seller_name) "
                    f"VALUES ({listing_id}, '{buyer_name}', '{seller_name}') RETURNING id"
                )
                chat_id = cur.fetchone()['id']
                conn.commit()

            cur.close()
            conn.close()
            return {
                'statusCode': 200,
                'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps({'chat_id': chat_id}),
            }

        if action == 'send':
            chat_id = int(body.get('chat_id'))
            sender = (body.get('sender') or 'buyer').replace("'", "''")
            text = (body.get('text') or '').replace("'", "''")

            if not text.strip():
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {**cors, 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Пустое сообщение'}),
                }

            cur.execute(
                f"INSERT INTO messages (chat_id, sender, text) VALUES ({chat_id}, '{sender}', '{text}') RETURNING id"
            )
            new_id = cur.fetchone()['id']
            conn.commit()
            cur.close()
            conn.close()
            return {
                'statusCode': 200,
                'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps({'id': new_id, 'success': True}),
            }

    cur.close()
    conn.close()
    return {
        'statusCode': 405,
        'headers': {**cors, 'Content-Type': 'application/json'},
        'body': json.dumps({'error': 'Method not allowed'}),
    }
