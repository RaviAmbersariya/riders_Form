"""
Rider Insurance Registration API
Flask backend for rider form registration and management
Uses SQLite for local storage (can be changed to PostgreSQL)
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import json
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Database configuration
DB_PATH = os.getenv('DB_PATH', 'riders.db')

# ========================================
# DATABASE INITIALIZATION
# ========================================

def init_db():
    """Initialize SQLite database with riders table"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS riders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            brand_name TEXT NOT NULL,
            store_name TEXT NOT NULL,
            employee_no TEXT UNIQUE NOT NULL,
            employee_name TEXT NOT NULL,
            employee_email TEXT,
            employee_phone TEXT,
            employee_gender TEXT,
            employee_dob TEXT,
            pan_number TEXT,
            employee_address TEXT,
            employee_city TEXT,
            employee_state TEXT,
            employee_pincode TEXT,
            nominee_name TEXT,
            nominee_gender TEXT,
            nominee_dob TEXT,
            nominee_relationship TEXT,
            profile_photo TEXT,
            insurance_status TEXT,
            insurance_policy_number TEXT,
            insurance_provider TEXT,
            insurance_start_date TEXT,
            insurance_end_date TEXT,
            coverage_amount TEXT,
            insurance_eligibility_status TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()
    print(f"Database initialized at {DB_PATH}")

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# ========================================
# UTILITY FUNCTIONS
# ========================================

def dict_from_row(row):
    """Convert sqlite3.Row to dict"""
    if row is None:
        return None
    return dict(row)

def sanitize_input(data):
    """Sanitize input data"""
    if isinstance(data, str):
        return data.strip()
    return data

# ========================================
# API ROUTES - STATS
# ========================================

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get dashboard statistics"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Total riders
        cursor.execute('SELECT COUNT(*) as count FROM riders')
        total_riders = cursor.fetchone()['count']
        
        # Active riders
        cursor.execute('SELECT COUNT(*) as count FROM riders WHERE insurance_status = "active"')
        active_riders = cursor.fetchone()['count']
        
        # Pending insurance
        cursor.execute('SELECT COUNT(*) as count FROM riders WHERE insurance_status = "pending"')
        pending_insurance = cursor.fetchone()['count']
        
        # Completed insurance
        cursor.execute('SELECT COUNT(*) as count FROM riders WHERE insurance_status = "completed"')
        completed_insurance = cursor.fetchone()['count']
        
        conn.close()
        
        return jsonify({
            'success': True,
            'total_riders': total_riders,
            'active_riders': active_riders,
            'pending_insurance': pending_insurance,
            'completed_insurance': completed_insurance,
            'expiring_policies': 0,
            'recently_activated': 0
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========================================
# API ROUTES - RIDERS CRUD
# ========================================

@app.route('/api/riders', methods=['GET'])
def get_all_riders():
    """Get all riders"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM riders ORDER BY created_at DESC LIMIT 100')
        rows = cursor.fetchall()
        riders = [dict_from_row(row) for row in rows]
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data': riders,
            'count': len(riders)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/riders/<int:rider_id>', methods=['GET'])
def get_rider(rider_id):
    """Get specific rider by ID"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM riders WHERE id = ?', (rider_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row is None:
            return jsonify({'error': 'Rider not found'}), 404
        
        return jsonify({
            'success': True,
            'data': dict_from_row(row)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/riders', methods=['POST'])
def create_rider():
    """Create new rider"""
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO riders (
                brand_name, store_name, employee_no, employee_name, employee_email,
                employee_phone, employee_gender, employee_dob, pan_number,
                employee_address, employee_city, employee_state, employee_pincode,
                nominee_name, nominee_gender, nominee_dob, nominee_relationship,
                insurance_status, insurance_policy_number, insurance_provider,
                insurance_start_date, insurance_end_date, coverage_amount,
                insurance_eligibility_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('brandName'),
            data.get('storeName'),
            data.get('employeeNo'),
            data.get('employeeName'),
            data.get('employeeEmail'),
            data.get('employeePhone'),
            data.get('employeeGender'),
            data.get('employeeDOB'),
            data.get('panNumber'),
            data.get('employeeAddress'),
            data.get('employeeCity'),
            data.get('employeeState'),
            data.get('employeePinCode'),
            data.get('nomineeName'),
            data.get('nomineeGender'),
            data.get('nomineeDOB'),
            data.get('nomineeRelationship'),
            data.get('insuranceStatus'),
            data.get('insurancePolicyNumber'),
            data.get('insuranceProvider'),
            data.get('insuranceStartDate'),
            data.get('insuranceEndDate'),
            data.get('coverageAmount'),
            data.get('insuranceEligibilityStatus')
        ))
        
        conn.commit()
        rider_id = cursor.lastrowid
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Rider created successfully',
            'id': rider_id
        }), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Employee number already exists'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/riders/<int:rider_id>', methods=['PUT'])
def update_rider(rider_id):
    """Update existing rider"""
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE riders SET
                brand_name = ?, store_name = ?, employee_name = ?, employee_email = ?,
                employee_phone = ?, employee_gender = ?, employee_dob = ?, pan_number = ?,
                employee_address = ?, employee_city = ?, employee_state = ?, employee_pincode = ?,
                nominee_name = ?, nominee_gender = ?, nominee_dob = ?, nominee_relationship = ?,
                insurance_status = ?, insurance_policy_number = ?, insurance_provider = ?,
                insurance_start_date = ?, insurance_end_date = ?, coverage_amount = ?,
                insurance_eligibility_status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (
            data.get('brandName'),
            data.get('storeName'),
            data.get('employeeName'),
            data.get('employeeEmail'),
            data.get('employeePhone'),
            data.get('employeeGender'),
            data.get('employeeDOB'),
            data.get('panNumber'),
            data.get('employeeAddress'),
            data.get('employeeCity'),
            data.get('employeeState'),
            data.get('employeePinCode'),
            data.get('nomineeName'),
            data.get('nomineeGender'),
            data.get('nomineeDOB'),
            data.get('nomineeRelationship'),
            data.get('insuranceStatus'),
            data.get('insurancePolicyNumber'),
            data.get('insuranceProvider'),
            data.get('insuranceStartDate'),
            data.get('insuranceEndDate'),
            data.get('coverageAmount'),
            data.get('insuranceEligibilityStatus'),
            rider_id
        ))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'error': 'Rider not found'}), 404
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Rider updated successfully'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/riders/<int:rider_id>', methods=['DELETE'])
def delete_rider(rider_id):
    """Delete rider"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM riders WHERE id = ?', (rider_id,))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'error': 'Rider not found'}), 404
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Rider deleted successfully'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========================================
# API ROUTES - SEARCH
# ========================================

@app.route('/api/search', methods=['POST'])
def search_riders():
    """Search riders by various criteria"""
    try:
        data = request.get_json()
        search_term = data.get('query', '').lower()
        status_filter = data.get('status', 'all')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if search_term:
            query = '''
                SELECT * FROM riders
                WHERE (employee_name LIKE ? OR employee_email LIKE ? OR employee_no LIKE ?)
            '''
            params = [f'%{search_term}%', f'%{search_term}%', f'%{search_term}%']
            
            if status_filter != 'all':
                query += ' AND insurance_status = ?'
                params.append(status_filter)
            
            query += ' ORDER BY created_at DESC'
            cursor.execute(query, params)
        else:
            if status_filter != 'all':
                cursor.execute('SELECT * FROM riders WHERE insurance_status = ? ORDER BY created_at DESC', (status_filter,))
            else:
                cursor.execute('SELECT * FROM riders ORDER BY created_at DESC')
        
        rows = cursor.fetchall()
        riders = [dict_from_row(row) for row in rows]
        conn.close()
        
        return jsonify({
            'success': True,
            'data': riders,
            'count': len(riders)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========================================
# STATIC FILE ROUTES
# ========================================

@app.route('/', methods=['GET'])
def serve_index():
    """Serve index.html"""
    return send_from_directory(os.getcwd(), 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files (CSS, JS, HTML)"""
    # Prevent serving API routes as static files
    if filename.startswith('api/'):
        return jsonify({'error': 'Not Found'}), 404
    
    file_path = os.path.join(os.getcwd(), filename)
    if os.path.isfile(file_path):
        return send_from_directory(os.getcwd(), filename)
    return jsonify({'error': f'File not found: {filename}'}), 404

# ========================================
# HEALTH CHECK
# ========================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'timestamp': datetime.now().isoformat()})

# ========================================
# ERROR HANDLERS
# ========================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# ========================================
# APPLICATION STARTUP
# ========================================

if __name__ == '__main__':
    # Initialize database
    init_db()
    
    # Run Flask server
    port = int(os.getenv('FLASK_PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'True').lower() in ('true', '1', 'yes')
    
    print(f"Starting Rider Insurance API on http://localhost:{port}")
    print(f"Database: {DB_PATH}")
    app.run(host='0.0.0.0', port=port, debug=debug)
