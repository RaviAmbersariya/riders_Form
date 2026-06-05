from db_conn import get_connection
from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

def fetch_all_riders():
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, brand_name, store_name, employee_no, employee_name, 
                           employee_email, employee_mobile, employee_gender, employee_dob,
                           employee_pan, employee_address, employee_city, employee_state,
                           employee_pin_code, nominee_name, nominee_gender, nominee_dob,
                           nominee_relationship, insurance_status, created_at
                    FROM rider_insurance_details 
                    ORDER BY created_at DESC
                """)
                rows = cur.fetchall()
                riders = []
                for row in rows:
                    riders.append({
                        'id': row[0],
                        'brand_name': row[1],
                        'store_name': row[2],
                        'employee_no': row[3],
                        'employee_name': row[4],
                        'employee_email': row[5],
                        'employee_phone': row[6],
                        'employee_gender': row[7],
                        'employee_dob': str(row[8]) if row[8] else None,
                        'pan_number': row[9],
                        'employee_address': row[10],
                        'employee_city': row[11],
                        'employee_state': row[12],
                        'employee_pin_code': row[13],
                        'nominee_name': row[14],
                        'nominee_gender': row[15],
                        'nominee_dob': str(row[16]) if row[16] else None,
                        'nominee_relationship': row[17],
                        'insurance_status': row[18],
                        'created_at': str(row[19]) if row[19] else None
                    })
                return riders
    except Exception as e:
        print(f"Error fetching riders: {e}")
        return []

def fetch_rider_by_id(rider_id):
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, brand_name, store_name, employee_no, employee_name, 
                           employee_email, employee_mobile, employee_gender, employee_dob,
                           employee_pan, employee_address, employee_city, employee_state,
                           employee_pin_code, nominee_name, nominee_gender, nominee_dob,
                           nominee_relationship, insurance_status, created_at
                    FROM rider_insurance_details 
                    WHERE id = %s
                """, (rider_id,))
                row = cur.fetchone()
                if row:
                    return {
                        'id': row[0],
                        'brand_name': row[1],
                        'store_name': row[2],
                        'employee_no': row[3],
                        'employee_name': row[4],
                        'employee_email': row[5],
                        'employee_phone': row[6],
                        'employee_gender': row[7],
                        'employee_dob': str(row[8]) if row[8] else None,
                        'pan_number': row[9],
                        'employee_address': row[10],
                        'employee_city': row[11],
                        'employee_state': row[12],
                        'employee_pin_code': row[13],
                        'nominee_name': row[14],
                        'nominee_gender': row[15],
                        'nominee_dob': str(row[16]) if row[16] else None,
                        'nominee_relationship': row[17],
                        'insurance_status': row[18],
                        'created_at': str(row[19]) if row[19] else None
                    }
                return None
    except Exception as e:
        print(f"Error fetching rider: {e}")
        return None

def save_rider(data):
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO rider_insurance_details 
                    (brand_name, store_name, employee_no, employee_name, employee_email,
                     employee_mobile, employee_gender, employee_dob, employee_pan,
                     employee_address, employee_city, employee_state, employee_pin_code,
                     nominee_name, nominee_gender, nominee_dob, nominee_relationship,
                     insurance_status, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (
                    data.get('brandName'),
                    data.get('storeName'),
                    data.get('employeeNo'),
                    data.get('employeeName'),
                    data.get('employeeEmail'),
                    data.get('employeePhone'),
                    data.get('employeeGender').lower() if data.get('employeeGender') else None,
                    data.get('employeeDOB'),
                    data.get('panNumber'),
                    data.get('employeeAddress'),
                    data.get('employeeCity'),
                    data.get('employeeState'),
                    data.get('employeePinCode'),
                    data.get('nomineeName'),
                    data.get('nomineeGender').lower() if data.get('nomineeGender') else None,
                    data.get('nomineeDOB'),
                    data.get('nomineeRelationship'),
                    data.get('insuranceStatus', 'pending'),
                    datetime.now()
                ))
                rider_id = cur.fetchone()[0]
                conn.commit()
                return rider_id
    except Exception as e:
        print(f"Error saving rider: {e}")
        return None

def update_rider(rider_id, data):
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE rider_insurance_details 
                    SET brand_name = %s, store_name = %s, employee_no = %s, 
                        employee_name = %s, employee_email = %s, employee_mobile = %s,
                        employee_gender = %s, employee_dob = %s, employee_pan = %s,
                        employee_address = %s, employee_city = %s, employee_state = %s,
                        employee_pin_code = %s, nominee_name = %s, nominee_gender = %s,
                        nominee_dob = %s, nominee_relationship = %s, insurance_status = %s
                    WHERE id = %s
                """, (
                    data.get('brandName'),
                    data.get('storeName'),
                    data.get('employeeNo'),
                    data.get('employeeName'),
                    data.get('employeeEmail'),
                    data.get('employeePhone'),
                    data.get('employeeGender').lower() if data.get('employeeGender') else None,
                    data.get('employeeDOB'),
                    data.get('panNumber'),
                    data.get('employeeAddress'),
                    data.get('employeeCity'),
                    data.get('employeeState'),
                    data.get('employeePinCode'),
                    data.get('nomineeName'),
                    data.get('nomineeGender').lower() if data.get('nomineeGender') else None,
                    data.get('nomineeDOB'),
                    data.get('nomineeRelationship'),
                    data.get('insuranceStatus', 'pending'),
                    rider_id
                ))
                conn.commit()
                return True
    except Exception as e:
        print(f"Error updating rider: {e}")
        return False

def delete_rider(rider_id):
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM rider_insurance_details WHERE id = %s", (rider_id,))
                conn.commit()
                return True
    except Exception as e:
        print(f"Error deleting rider: {e}")
        return False

def get_rider_count_by_status(status):
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT COUNT(*) FROM rider_insurance_details WHERE insurance_status = %s",
                    (status,)
                )
                count = cur.fetchone()[0]
                return count
    except Exception as e:
        print(f"Error getting rider count: {e}")
        return 0

def get_total_rider_count():
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) FROM rider_insurance_details")
                count = cur.fetchone()[0]
                return count
    except Exception as e:
        print(f"Error getting total rider count: {e}")
        return 0

def get_expiring_policies_count():
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT COUNT(*) FROM rider_insurance_details 
                    WHERE insurance_status = 'active'
                """)
                count = cur.fetchone()[0]
                return count
    except Exception as e:
        print(f"Error getting expiring policies count: {e}")
        return 0

def get_recently_activated_count():
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                seven_days_ago = datetime.now() - timedelta(days=7)
                cur.execute("""
                    SELECT COUNT(*) FROM rider_insurance_details 
                    WHERE insurance_status = 'active' AND created_at >= %s
                """, (seven_days_ago,))
                count = cur.fetchone()[0]
                return count
    except Exception as e:
        print(f"Error getting recently activated count: {e}")
        return 0

@app.route('/api/riders', methods=['GET'])
def get_riders():
    riders = fetch_all_riders()
    return jsonify(riders)

@app.route('/api/riders/<rider_id>', methods=['GET'])
def get_rider(rider_id):
    rider = fetch_rider_by_id(rider_id)
    if rider:
        return jsonify(rider)
    return jsonify({'error': 'Rider not found'}), 404

@app.route('/api/riders', methods=['POST'])
def create_rider():
    try:
        data = request.get_json()
        rider_id = save_rider(data)
        if rider_id:
            return jsonify({'id': rider_id, 'message': 'Rider created successfully'}), 201
        return jsonify({'error': 'Error creating rider'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/riders/<rider_id>', methods=['PUT'])
def update_rider_route(rider_id):
    try:
        data = request.get_json()
        if update_rider(rider_id, data):
            return jsonify({'message': 'Rider updated successfully'})
        return jsonify({'error': 'Error updating rider'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/riders/<rider_id>', methods=['DELETE'])
def delete_rider_route(rider_id):
    try:
        if delete_rider(rider_id):
            return jsonify({'message': 'Rider deleted successfully'})
        return jsonify({'error': 'Error deleting rider'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    try:
        total_riders = get_total_rider_count()
        active_riders = get_rider_count_by_status('active')
        pending_riders = get_rider_count_by_status('pending')
        completed_riders = get_rider_count_by_status('active')
        expiring_policies = get_expiring_policies_count()
        recently_activated = get_recently_activated_count()
        
        stats = {
            'total_riders': total_riders,
            'active_riders': active_riders,
            'pending_riders': pending_riders,
            'completed_riders': completed_riders,
            'expiring_policies': expiring_policies,
            'recently_activated': recently_activated
        }
        
        return jsonify(stats)
    except Exception as e:
        print(f"Error getting stats: {e}")
        return jsonify({
            'total_riders': 0,
            'active_riders': 0,
            'pending_riders': 0,
            'completed_riders': 0,
            'expiring_policies': 0,
            'recently_activated': 0
        })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'message': 'API is running'})

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print('🚀 Starting Onsurity Rider Insurance API...')
    print('📡 API running on http://127.0.0.1:5000')
    print('📚 API Documentation:')
    print('   GET /api/riders - Get all riders')
    print('   POST /api/riders - Create new rider')
    print('   PUT /api/riders/<id> - Update rider')
    print('   DELETE /api/riders/<id> - Delete rider')
    print('   GET /api/stats - Get dashboard statistics')
    print('   GET /health - Health check')
    app.run(debug=True, host='127.0.0.1', port=5000)
