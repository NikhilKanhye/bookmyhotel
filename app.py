from flask import Flask, jsonify
import os
import pymysql

app = Flask(__name__)

def get_db_connection():
    return pymysql.connect(
        host=os.environ.get('DB_HOST'),
        port=int(os.environ.get('DB_PORT', 4000)),
        user=os.environ.get('DB_USER'),
        password=os.environ.get('DB_PASSWORD'),
        database=os.environ.get('DB_NAME'),
        connect_timeout=30,
        ssl={'ca': '/etc/ssl/certs/ca-certificates.crt'},
        cursorclass=pymysql.cursors.DictCursor
    )

@app.route('/')
def home():
    return jsonify({"message": "BookMyHotel API is running!"})

@app.route('/api/db-test')
def db_test():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT 1 as test')
        result = cursor.fetchone()
        conn.close()
        return jsonify({"message": "Database connected!", "result": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/hotels')
def hotels():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM hotels')
        hotels = cursor.fetchall()
        conn.close()
        return jsonify(hotels)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)