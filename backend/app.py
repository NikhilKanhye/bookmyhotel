from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
import pymysql
from datetime import datetime, timedelta
import stripe
import requests
import secrets
import json

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'
CORS(app)
bcrypt = Bcrypt(app)

# ==================== STRIPE CONFIGURATION ====================
# Use environment variables for security
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY', '')
STRIPE_PUBLISHABLE_KEY = os.environ.get('STRIPE_PUBLISHABLE_KEY', '')

# ==================== CURRENCY CONFIGURATION ====================
CURRENCY_API_URL = "https://api.frankfurter.app/latest"

# ==================== LANGUAGE CONFIGURATION ====================
LANGUAGES = {
    'en': {'name': 'English', 'flag': '🇬🇧'},
    'fr': {'name': 'Français', 'flag': '🇫🇷'},
    'es': {'name': 'Español', 'flag': '🇪🇸'},
    'de': {'name': 'Deutsch', 'flag': '🇩🇪'},
    'hi': {'name': 'हिन्दी', 'flag': '🇮🇳'}
}

TRANSLATIONS = {
    'en': {
        'welcome': 'Welcome to BookMyHotel',
        'search_hotels': 'Search Hotels',
        'login': 'Login',
        'register': 'Register',
        'logout': 'Logout',
        'home': 'Home',
        'hotels': 'Hotels',
        'contact': 'Contact',
        'my_bookings': 'My Bookings',
        'dashboard': 'Dashboard',
        'manage_hotels': 'Manage Hotels',
        'promotions': 'Promotions',
        'messages': 'Messages',
        'welcome_back': 'Welcome back',
        'book_now': 'Book Now',
        'view_details': 'View Details',
        'no_hotels': 'No hotels found',
        'loading': 'Loading...'
    },
    'fr': {
        'welcome': 'Bienvenue à BookMyHotel',
        'search_hotels': 'Rechercher des hôtels',
        'login': 'Se connecter',
        'register': "S'inscrire",
        'logout': 'Se déconnecter',
        'home': 'Accueil',
        'hotels': 'Hôtels',
        'contact': 'Contact',
        'my_bookings': 'Mes réservations',
        'dashboard': 'Tableau de bord',
        'manage_hotels': 'Gérer les hôtels',
        'promotions': 'Promotions',
        'messages': 'Messages',
        'welcome_back': 'Bon retour',
        'book_now': 'Réserver maintenant',
        'view_details': 'Voir les détails',
        'no_hotels': 'Aucun hôtel trouvé',
        'loading': 'Chargement...'
    }
}

import os

def get_db_connection():
    return pymysql.connect(
        host=os.environ.get('DB_HOST'),
        port=int(os.environ.get('DB_PORT', 4000)),
        user=os.environ.get('DB_USER'),
        password=os.environ.get('DB_PASSWORD'),
        database=os.environ.get('DB_NAME'),
        connect_timeout=30,  # Add this
        cursorclass=pymysql.cursors.DictCursor
    )
    

def get_translations(lang='en'):
    return TRANSLATIONS.get(lang, TRANSLATIONS['en'])

# ==================== HOME ====================
@app.route('/')
def home():
    return jsonify({'message': 'BookMyHotel API is running!'})

# ==================== LANGUAGE ====================
@app.route('/api/languages', methods=['GET'])
def get_languages():
    return jsonify(LANGUAGES), 200

@app.route('/api/translations/<string:lang>', methods=['GET'])
def get_translations_api(lang):
    return jsonify(get_translations(lang)), 200

# ==================== CURRENCY ====================
@app.route('/api/currencies', methods=['GET'])
def get_currencies():
    try:
        response = requests.get(CURRENCY_API_URL)
        data = response.json()
        rates = data.get('rates', {})
        popular = ['USD', 'EUR', 'GBP', 'INR', 'AED', 'SGD', 'THB', 'JPY', 'AUD', 'CAD']
        result = {currency: rates.get(currency, 1) for currency in popular if currency in rates}
        result['USD'] = 1.0
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== USERS ====================
@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id, name, email, role, language FROM users WHERE id = %s AND deleted_at IS NULL', (user_id,))
    user = cursor.fetchone()
    conn.close()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user), 200

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM users WHERE email = %s AND deleted_at IS NULL', (data['email'],))
    if cursor.fetchone():
        conn.close()
        return jsonify({'error': 'User already exists'}), 400
    
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    
    cursor.execute(
        '''INSERT INTO users (name, email, password, phone, role, consent_given, consent_date, language) 
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s)''',
        (data['name'], data['email'], hashed_password, data.get('phone', ''), 'customer', 
         data.get('consent_given', False), datetime.now() if data.get('consent_given') else None, 
         data.get('language', 'en'))
    )
    conn.commit()
    conn.close()
    return jsonify({'message': 'User registered successfully'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM users WHERE email = %s AND deleted_at IS NULL', (data['email'],))
    user = cursor.fetchone()
    conn.close()
    
    if not user or not bcrypt.check_password_hash(user['password'], data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Update last login
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE users SET last_login = %s WHERE id = %s', (datetime.now(), user['id']))
    conn.commit()
    conn.close()
    
    return jsonify({
        'message': 'Login successful',
        'user_id': user['id'],
        'name': user['name'],
        'email': user['email'],
        'role': user['role'],
        'language': user.get('language', 'en')
    }), 200

# ==================== PASSWORD RESET ====================
@app.route('/api/request-reset', methods=['POST'])
def request_reset():
    data = request.get_json()
    email = data.get('email')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE email = %s AND deleted_at IS NULL', (email,))
    user = cursor.fetchone()
    
    if not user:
        conn.close()
        return jsonify({'error': 'Email not found'}), 404
    
    # Generate reset token
    reset_token = secrets.token_urlsafe(32)
    expiry = datetime.now() + timedelta(hours=1)
    
    cursor.execute(
        'UPDATE users SET reset_token = %s, reset_token_expiry = %s WHERE id = %s',
        (reset_token, expiry, user['id'])
    )
    conn.commit()
    conn.close()
    
    return jsonify({
        'message': 'Password reset link sent to your email',
        'reset_token': reset_token,
        'reset_url': f'http://localhost:3000/reset-password?token={reset_token}'
    }), 200

@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('new_password')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        'SELECT * FROM users WHERE reset_token = %s AND reset_token_expiry > %s AND deleted_at IS NULL',
        (token, datetime.now())
    )
    user = cursor.fetchone()
    
    if not user:
        conn.close()
        return jsonify({'error': 'Invalid or expired token'}), 400
    
    hashed_password = bcrypt.generate_password_hash(new_password).decode('utf-8')
    cursor.execute(
        'UPDATE users SET password = %s, reset_token = NULL, reset_token_expiry = NULL WHERE id = %s',
        (hashed_password, user['id'])
    )
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Password reset successfully'}), 200

# ==================== GDPR - DELETE ACCOUNT ====================
@app.route('/api/delete-account', methods=['POST'])
def delete_account():
    data = request.get_json()
    user_id = data.get('user_id')
    password = data.get('password')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE id = %s AND deleted_at IS NULL', (user_id,))
    user = cursor.fetchone()
    
    if not user or not bcrypt.check_password_hash(user['password'], password):
        conn.close()
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Soft delete - GDPR compliance
    cursor.execute('UPDATE users SET deleted_at = %s WHERE id = %s', (datetime.now(), user_id))
    cursor.execute('UPDATE bookings SET deleted_at = %s WHERE user_id = %s', (datetime.now(), user_id))
    cursor.execute('UPDATE reviews SET deleted_at = %s WHERE user_id = %s', (datetime.now(), user_id))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Account deleted successfully'}), 200

# ==================== HOTELS ====================
@app.route('/api/hotels', methods=['GET'])
def get_hotels():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM hotels WHERE deleted_at IS NULL')
    hotels = cursor.fetchall()
    conn.close()
    return jsonify(hotels)

@app.route('/api/hotels/<int:hotel_id>', methods=['GET'])
def get_hotel(hotel_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM hotels WHERE id = %s AND deleted_at IS NULL', (hotel_id,))
    hotel = cursor.fetchone()
    if not hotel:
        return jsonify({'error': 'Hotel not found'}), 404
    
    cursor.execute('SELECT * FROM rooms WHERE hotel_id = %s', (hotel_id,))
    rooms = cursor.fetchall()
    
    for room in rooms:
        cursor.execute('''
            SELECT * FROM bookings 
            WHERE room_id = %s 
            AND status != 'cancelled'
            AND deleted_at IS NULL
            AND check_out > CURDATE()
        ''', (room['id'],))
        active_booking = cursor.fetchone()
        room['is_available'] = 0 if active_booking else 1
    
    room_types = {}
    for room in rooms:
        room['price_per_night'] = float(room['price_per_night']) if room['price_per_night'] else 0
        
        if room['room_type'] not in room_types:
            room_types[room['room_type']] = {
                'type': room['room_type'],
                'total': 0,
                'available': 0,
                'price_per_night': room['price_per_night'],
                'capacity': room['capacity'],
                'description': room['description']
            }
        room_types[room['room_type']]['total'] += 1
        if room['is_available']:
            room_types[room['room_type']]['available'] += 1
    
    cursor.execute('SELECT * FROM reviews WHERE hotel_id = %s AND deleted_at IS NULL', (hotel_id,))
    reviews = cursor.fetchall()
    conn.close()
    
    hotel['rooms'] = rooms
    hotel['room_types'] = list(room_types.values())
    hotel['reviews'] = reviews
    return jsonify(hotel)

@app.route('/api/hotels/search', methods=['GET'])
def search_hotels():
    city = request.args.get('city', '')
    conn = get_db_connection()
    cursor = conn.cursor()
    if city:
        cursor.execute('SELECT * FROM hotels WHERE city LIKE %s AND deleted_at IS NULL', (f'%{city}%',))
    else:
        cursor.execute('SELECT * FROM hotels WHERE deleted_at IS NULL')
    hotels = cursor.fetchall()
    conn.close()
    return jsonify(hotels)

# ==================== BOOKINGS ====================
@app.route('/api/bookings', methods=['POST'])
def book_room():
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM rooms WHERE id = %s', (data['room_id'],))
    room = cursor.fetchone()
    if not room:
        conn.close()
        return jsonify({'error': 'Room not found'}), 404
    
    check_in = datetime.strptime(data['check_in'], '%Y-%m-%d')
    check_out = datetime.strptime(data['check_out'], '%Y-%m-%d')
    
    cursor.execute('''
        SELECT * FROM bookings 
        WHERE room_id = %s 
        AND status != 'cancelled'
        AND deleted_at IS NULL
        AND (
            (check_in <= %s AND check_out > %s) OR
            (check_in < %s AND check_out >= %s) OR
            (check_in >= %s AND check_out <= %s)
        )
    ''', (data['room_id'], check_out, check_in, check_out, check_in, check_in, check_out))
    
    if cursor.fetchone():
        conn.close()
        return jsonify({'error': 'Room is already booked for these dates'}), 400
    
    nights = (check_out - check_in).days
    if nights <= 0:
        conn.close()
        return jsonify({'error': 'Invalid dates'}), 400
    
    total_price = float(nights * room['price_per_night'])
    
    cursor.execute(
        '''INSERT INTO bookings (user_id, hotel_id, room_id, check_in, check_out, guests, total_price, status)
           VALUES (%s, %s, %s, %s, %s, %s, %s, 'confirmed')''',
        (data['user_id'], data['hotel_id'], data['room_id'], check_in, check_out, data.get('guests', 1), total_price)
    )
    
    booking_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Booking confirmed successfully', 'booking_id': booking_id, 'total_price': total_price}), 201

@app.route('/api/bookings/user/<int:user_id>', methods=['GET'])
def get_user_bookings(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT b.id, b.room_id, b.check_in, b.check_out, b.guests, b.total_price, b.status, b.created_at,
               h.name as hotel_name, r.room_type
        FROM bookings b
        JOIN hotels h ON b.hotel_id = h.id
        JOIN rooms r ON b.room_id = r.id
        WHERE b.user_id = %s AND b.status != 'cancelled' AND b.deleted_at IS NULL
        ORDER BY b.created_at DESC
    ''', (user_id,))
    
    bookings = cursor.fetchall()
    conn.close()
    
    for booking in bookings:
        if booking['check_in']:
            booking['check_in'] = booking['check_in'].strftime('%Y-%m-%d')
        if booking['check_out']:
            booking['check_out'] = booking['check_out'].strftime('%Y-%m-%d')
    
    return jsonify(bookings), 200

# ==================== BOOKING CANCELLATION WITH REFUND ====================
@app.route('/api/bookings/<int:booking_id>', methods=['DELETE'])
def cancel_booking(booking_id):
    data = request.get_json() or {}
    user_id = data.get('user_id')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM bookings WHERE id = %s AND deleted_at IS NULL', (booking_id,))
    booking = cursor.fetchone()
    if not booking:
        conn.close()
        return jsonify({'error': 'Booking not found'}), 404
    
    if user_id and booking['user_id'] != user_id:
        conn.close()
        return jsonify({'error': 'Unauthorized'}), 403
    
    room_id = booking['room_id']
    
    # Calculate refund based on cancellation policy
    check_in = booking['check_in']
    today = datetime.now().date()
    days_until_check_in = (check_in - today).days
    
    refund_percentage = 0
    refund_message = ""
    
    if days_until_check_in >= 7:
        refund_percentage = 100
        refund_message = "Full refund (100%) - cancelled 7+ days before check-in"
    elif days_until_check_in >= 3:
        refund_percentage = 50
        refund_message = "50% refund - cancelled 3-6 days before check-in"
    elif days_until_check_in >= 1:
        refund_percentage = 25
        refund_message = "25% refund - cancelled 1-2 days before check-in"
    else:
        refund_percentage = 0
        refund_message = "No refund - cancelled on check-in day or after"
    
    refund_amount = booking['total_price'] * (refund_percentage / 100)
    
    # Update booking status
    cursor.execute('UPDATE bookings SET status = "cancelled" WHERE id = %s', (booking_id,))
    
    # Make room available again
    cursor.execute('UPDATE rooms SET is_available = 1 WHERE id = %s', (room_id,))
    
    conn.commit()
    conn.close()
    
    return jsonify({
        'message': 'Booking cancelled successfully',
        'refund_percentage': refund_percentage,
        'refund_amount': refund_amount,
        'refund_message': refund_message
    }), 200

# ==================== REVIEWS ====================
@app.route('/api/reviews', methods=['POST'])
def submit_review():
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM users WHERE id = %s AND deleted_at IS NULL', (data['user_id'],))
    if not cursor.fetchone():
        conn.close()
        return jsonify({'error': 'User not found'}), 404
    
    cursor.execute('SELECT * FROM bookings WHERE user_id = %s AND hotel_id = %s AND status != "cancelled" AND deleted_at IS NULL', (data['user_id'], data['hotel_id']))
    booking = cursor.fetchone()
    if not booking:
        conn.close()
        return jsonify({'error': 'You must book this hotel to review it'}), 400
    
    cursor.execute('SELECT * FROM reviews WHERE user_id = %s AND hotel_id = %s AND deleted_at IS NULL', (data['user_id'], data['hotel_id']))
    if cursor.fetchone():
        conn.close()
        return jsonify({'error': 'You already reviewed this hotel'}), 400
    
    cursor.execute(
        'INSERT INTO reviews (user_id, hotel_id, booking_id, rating, comment) VALUES (%s, %s, %s, %s, %s)',
        (data['user_id'], data['hotel_id'], booking['id'], data['rating'], data.get('comment', ''))
    )
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Review submitted successfully'}), 201

# ==================== PROMOTIONS ====================
@app.route('/api/promotions', methods['GET'])
def get_promotions():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT p.*, h.name as hotel_name FROM promotions p JOIN hotels h ON p.hotel_id = h.id')
    promotions = cursor.fetchall()
    conn.close()
    return jsonify(promotions), 200

@app.route('/api/promotions', methods=['POST'])
def add_promotion():
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO promotions (hotel_id, title, description, discount_percentage, start_date, end_date)
        VALUES (%s, %s, %s, %s, %s, %s)
    ''', (
        data['hotel_id'],
        data['title'],
        data.get('description', ''),
        data['discount_percentage'],
        data['start_date'],
        data['end_date']
    ))
    
    conn.commit()
    conn.close()
    return jsonify({'message': 'Promotion added successfully'}), 201

# ==================== CONTACT ====================
@app.route('/api/contact', methods=['POST'])
def send_contact_message():
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS contact_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL,
            hotel_id INT,
            subject VARCHAR(200),
            message TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (hotel_id) REFERENCES hotels(id)
        )
    ''')
    
    cursor.execute('''
        INSERT INTO contact_messages (name, email, hotel_id, subject, message)
        VALUES (%s, %s, %s, %s, %s)
    ''', (
        data['name'],
        data['email'],
        data.get('hotel_id'),
        data['subject'],
        data['message']
    ))
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Contact message sent successfully'}), 200

@app.route('/api/admin/contact-messages', methods=['GET'])
def get_contact_messages():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT cm.*, h.name as hotel_name 
        FROM contact_messages cm
        LEFT JOIN hotels h ON cm.hotel_id = h.id
        ORDER BY cm.created_at DESC
    ''')
    messages = cursor.fetchall()
    conn.close()
    return jsonify(messages), 200

@app.route('/api/admin/contact-messages/<int:message_id>', methods=['DELETE'])
def delete_contact_message(message_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM contact_messages WHERE id = %s', (message_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Message deleted successfully'}), 200

# ==================== ADMIN ====================
@app.route('/api/admin/dashboard', methods=['GET'])
def get_dashboard_stats():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL')
    total_users = cursor.fetchone()
    
    cursor.execute('SELECT COUNT(*) as total FROM hotels WHERE deleted_at IS NULL')
    total_hotels = cursor.fetchone()
    
    cursor.execute('SELECT COUNT(*) as total FROM bookings WHERE status != "cancelled" AND deleted_at IS NULL')
    total_bookings = cursor.fetchone()
    
    cursor.execute('SELECT SUM(total_price) as revenue FROM bookings WHERE status = "confirmed" AND deleted_at IS NULL')
    revenue = cursor.fetchone()
    
    cursor.execute('SELECT SUM(DATEDIFF(check_out, check_in)) as total_nights FROM bookings WHERE status = "confirmed" AND deleted_at IS NULL')
    total_nights = cursor.fetchone()
    
    cursor.execute('''
        SELECT b.id, b.check_in, b.check_out, b.total_price, b.status, b.guests,
               u.name as user_name, h.name as hotel_name,
               DATEDIFF(b.check_out, b.check_in) as nights
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        JOIN hotels h ON b.hotel_id = h.id
        WHERE b.status != 'cancelled' AND b.deleted_at IS NULL
        ORDER BY b.created_at DESC
        LIMIT 5
    ''')
    recent_bookings = cursor.fetchall()
    
    cursor.execute('''
        SELECT h.id, h.name, COUNT(b.id) as booking_count,
               SUM(DATEDIFF(b.check_out, b.check_in)) as total_nights,
               SUM(b.total_price) as revenue
        FROM hotels h
        LEFT JOIN bookings b ON h.id = b.hotel_id AND b.status != 'cancelled' AND b.deleted_at IS NULL
        GROUP BY h.id
        ORDER BY booking_count DESC
    ''')
    bookings_by_hotel = cursor.fetchall()
    
    conn.close()
    
    revenue_amount = float(revenue['revenue']) if revenue['revenue'] else 0
    total_nights_amount = float(total_nights['total_nights']) if total_nights['total_nights'] else 0
    avg_daily_rate = revenue_amount / total_nights_amount if total_nights_amount > 0 else 0
    
    return jsonify({
        'total_users': total_users['total'],
        'total_hotels': total_hotels['total'],
        'total_bookings': total_bookings['total'],
        'total_revenue': revenue_amount,
        'total_nights': total_nights_amount,
        'avg_daily_rate': avg_daily_rate,
        'recent_bookings': recent_bookings,
        'bookings_by_hotel': bookings_by_hotel
    }), 200

@app.route('/api/admin/users', methods=['GET'])
def get_all_users():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id, name, email, phone, role, created_at, consent_given FROM users WHERE deleted_at IS NULL')
    users = cursor.fetchall()
    conn.close()
    return jsonify(users), 200

@app.route('/api/admin/hotels', methods=['GET'])
def get_all_hotels_admin():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM hotels WHERE deleted_at IS NULL')
    hotels = cursor.fetchall()
    conn.close()
    return jsonify(hotels), 200

@app.route('/api/admin/hotels', methods=['POST'])
def add_hotel_admin():
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO hotels (name, address, city, country, star_rating, description, phone, email, image_url)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    ''', (
        data['name'],
        data.get('address', ''),
        data['city'],
        data['country'],
        data.get('star_rating', 3),
        data.get('description', ''),
        data.get('phone', ''),
        data.get('email', ''),
        data.get('image_url', '')
    ))
    
    conn.commit()
    conn.close()
    return jsonify({'message': 'Hotel added successfully'}), 201

@app.route('/api/admin/hotels/<int:hotel_id>', methods=['PUT'])
def update_hotel_admin(hotel_id):
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        UPDATE hotels 
        SET name = %s, address = %s, city = %s, country = %s, 
            star_rating = %s, description = %s, phone = %s, email = %s, image_url = %s
        WHERE id = %s
    ''', (
        data['name'],
        data.get('address', ''),
        data['city'],
        data['country'],
        data.get('star_rating', 3),
        data.get('description', ''),
        data.get('phone', ''),
        data.get('email', ''),
        data.get('image_url', ''),
        hotel_id
    ))
    
    conn.commit()
    conn.close()
    return jsonify({'message': 'Hotel updated successfully'}), 200

@app.route('/api/admin/hotels/<int:hotel_id>', methods=['DELETE'])
def delete_hotel_admin(hotel_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM rooms WHERE hotel_id = %s', (hotel_id,))
    cursor.execute('DELETE FROM hotels WHERE id = %s', (hotel_id,))
    
    conn.commit()
    conn.close()
    return jsonify({'message': 'Hotel deleted successfully'}), 200

@app.route('/api/admin/rooms/<int:room_id>', methods=['PUT'])
def update_room_availability(room_id):
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('UPDATE rooms SET is_available = %s WHERE id = %s', (data['is_available'], room_id))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Room availability updated successfully'}), 200

@app.route('/api/bookings/date/<string:date>', methods=['GET'])
def get_bookings_by_date(date):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT b.id, b.check_in, b.check_out, b.total_price, b.status, b.guests,
               u.name as user_name, h.name as hotel_name, r.room_type
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        JOIN hotels h ON b.hotel_id = h.id
        JOIN rooms r ON b.room_id = r.id
        WHERE b.status != 'cancelled' AND b.deleted_at IS NULL
        AND (b.check_in <= %s AND b.check_out >= %s)
    ''', (date, date))
    
    bookings = cursor.fetchall()
    conn.close()
    
    for booking in bookings:
        if booking['check_in']:
            booking['check_in'] = booking['check_in'].strftime('%Y-%m-%d')
        if booking['check_out']:
            booking['check_out'] = booking['check_out'].strftime('%Y-%m-%d')
    
    return jsonify(bookings), 200

@app.route('/api/debug-bookings', methods=['GET'])
def debug_bookings():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM bookings ORDER BY id DESC LIMIT 10')
    bookings = cursor.fetchall()
    conn.close()
    return jsonify(bookings), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)