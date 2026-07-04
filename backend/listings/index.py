import json
import os
import psycopg2
import psycopg2.extras


def handler(event: dict, context) -> dict:
    '''
    Business: Управление объявлениями барахолки — список и создание.
    Args: event с httpMethod (GET список, POST создание), body с данными объявления.
    Returns: HTTP-ответ со списком объявлений или созданным объявлением.
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
        category = params.get('category')
        search = params.get('search')

        query = 'SELECT * FROM listings'
        conditions = []
        if category and category != 'Все':
            safe_cat = category.replace("'", "''")
            conditions.append(f"category = '{safe_cat}'")
        if search:
            safe_search = search.replace("'", "''")
            conditions.append(f"(title ILIKE '%{safe_search}%' OR description ILIKE '%{safe_search}%')")
        if conditions:
            query += ' WHERE ' + ' AND '.join(conditions)
        query += ' ORDER BY created_at DESC'

        cur.execute(query)
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
            'body': json.dumps({'listings': result}),
        }

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        title = (body.get('title') or '').replace("'", "''")
        description = (body.get('description') or '').replace("'", "''")
        price = int(body.get('price') or 0)
        category = (body.get('category') or 'Услуги').replace("'", "''")
        location = (body.get('location') or '').replace("'", "''")
        image_url = (body.get('image_url') or '').replace("'", "''")
        author_name = (body.get('author_name') or 'Аноним').replace("'", "''")

        if not title:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Название обязательно'}),
            }

        cur.execute(
            f"INSERT INTO listings (title, description, price, category, location, image_url, author_name) "
            f"VALUES ('{title}', '{description}', {price}, '{category}', '{location}', '{image_url}', '{author_name}') "
            f"RETURNING id"
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
