#!/usr/bin/env python3
"""
BharatFlow AI - ML API Server
Flask API to serve ML predictions to the Node.js backend
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from traffic_model import BharatFlowTrafficModel

app = Flask(__name__)
CORS(app)

# Global model instance
model = None

def initialize_model():
    """Initialize or load the ML model"""
    global model
    model = BharatFlowTrafficModel()
    
    # Try to load existing models
    if not model.load_models():
        print("Training new models...")
        model.train_models()
        model.save_models()
    
    print("ML Model ready for predictions")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'service': 'BharatFlow ML API'
    })

@app.route('/predict/congestion', methods=['POST'])
def predict_congestion():
    """Predict congestion level for an intersection"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Extract intersection data
        intersection_data = {
            'weather_factor': data.get('weather_factor', 1.0),
            'incident_count': data.get('incident_count', 0),
            'vehicle_density': data.get('vehicle_density', 50),
            'ns_queue_length': data.get('ns_queue_length', 0),
            'ew_queue_length': data.get('ew_queue_length', 0),
            'current_green_duration': data.get('current_green_duration', 150),
            'time_since_last_change': data.get('time_since_last_change', 75),
            'adjacent_congestion_avg': data.get('adjacent_congestion_avg', 30)
        }
        
        congestion_level = model.predict_congestion(intersection_data)
        
        return jsonify({
            'congestion_level': round(congestion_level, 1),
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/optimize/signal', methods=['POST'])
def optimize_signal():
    """Optimize signal timing for an intersection"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Extract intersection data
        intersection_data = {
            'weather_factor': data.get('weather_factor', 1.0),
            'incident_count': data.get('incident_count', 0),
            'vehicle_density': data.get('vehicle_density', 50),
            'ns_queue_length': data.get('ns_queue_length', 0),
            'ew_queue_length': data.get('ew_queue_length', 0),
            'current_green_duration': data.get('current_green_duration', 150),
            'time_since_last_change': data.get('time_since_last_change', 75),
            'adjacent_congestion_avg': data.get('adjacent_congestion_avg', 30)
        }
        
        optimal_duration = model.optimize_signal_timing(intersection_data)
        current_duration = intersection_data['current_green_duration']
        
        # Calculate confidence and reasoning
        difference = abs(optimal_duration - current_duration)
        confidence = max(0.6, min(0.95, 1.0 - (difference / 300)))
        
        if difference < 10:
            reasoning = "Current timing is near optimal"
        elif optimal_duration > current_duration:
            reasoning = f"Increase green time by {difference:.0f} frames to reduce queue buildup"
        else:
            reasoning = f"Decrease green time by {difference:.0f} frames to improve overall flow"
        
        return jsonify({
            'optimal_green_duration': optimal_duration,
            'current_duration': current_duration,
            'adjustment_needed': difference > 10,
            'confidence': round(confidence, 2),
            'reasoning': reasoning,
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/analyze/batch', methods=['POST'])
def analyze_batch():
    """Analyze multiple intersections at once"""
    try:
        data = request.get_json()
        intersections = data.get('intersections', [])
        
        if not intersections:
            return jsonify({'error': 'No intersections provided'}), 400
        
        results = []
        
        for intersection in intersections:
            intersection_data = {
                'weather_factor': intersection.get('weather_factor', 1.0),
                'incident_count': intersection.get('incident_count', 0),
                'vehicle_density': intersection.get('vehicle_density', 50),
                'ns_queue_length': intersection.get('ns_queue_length', 0),
                'ew_queue_length': intersection.get('ew_queue_length', 0),
                'current_green_duration': intersection.get('current_green_duration', 150),
                'time_since_last_change': intersection.get('time_since_last_change', 75),
                'adjacent_congestion_avg': intersection.get('adjacent_congestion_avg', 30)
            }
            
            congestion = model.predict_congestion(intersection_data)
            optimal_timing = model.optimize_signal_timing(intersection_data)
            
            results.append({
                'intersection_id': intersection.get('id', 'unknown'),
                'congestion_level': round(congestion, 1),
                'optimal_green_duration': optimal_timing,
                'current_duration': intersection_data['current_green_duration'],
                'needs_adjustment': abs(optimal_timing - intersection_data['current_green_duration']) > 10
            })
        
        return jsonify({
            'results': results,
            'total_analyzed': len(results),
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/retrain', methods=['POST'])
def retrain_model():
    """Retrain the model with new data (if provided)"""
    try:
        data = request.get_json()
        
        # For now, just retrain with synthetic data
        # In production, this would use real traffic data
        model.train_models()
        model.save_models()
        
        return jsonify({
            'message': 'Model retrained successfully',
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting BharatFlow ML API Server...")
    initialize_model()
    
    # Run on port 5000 (different from Node.js backend on 3001)
    app.run(host='0.0.0.0', port=5000, debug=True)