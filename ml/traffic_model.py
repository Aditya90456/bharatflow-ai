#!/usr/bin/env python3
"""
BharatFlow AI - Traffic Prediction Model
Advanced ML model for traffic flow prediction and optimization
Designed for Indian metropolitan traffic patterns (Left-Hand Traffic)
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import json
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

class BharatFlowTrafficModel:
    """
    ML model for predicting traffic congestion and optimizing signal timing
    Specifically tuned for Indian traffic patterns and Left-Hand Traffic (LHT)
    """
    
    def __init__(self):
        self.congestion_model = None
        self.signal_optimizer = None
        self.scaler = StandardScaler()
        self.feature_columns = [
            'hour', 'day_of_week', 'is_rush_hour', 'is_weekend',
            'weather_factor', 'incident_count', 'vehicle_density',
            'ns_queue_length', 'ew_queue_length', 'current_green_duration',
            'time_since_last_change', 'adjacent_congestion_avg'
        ]
        
    def generate_synthetic_data(self, n_samples=10000):
        """
        Generate synthetic traffic data based on Indian traffic patterns
        """
        np.random.seed(42)
        
        # Time-based features
        hours = np.random.randint(0, 24, n_samples)
        days = np.random.randint(0, 7, n_samples)
        
        # Rush hour patterns (Indian cities: 8-11 AM, 6-9 PM)
        is_rush_hour = ((hours >= 8) & (hours <= 11)) | ((hours >= 18) & (hours <= 21))
        is_weekend = days >= 5
        
        # Weather factor (monsoon impact in India)
        weather_factor = np.random.normal(1.0, 0.3, n_samples)
        weather_factor = np.clip(weather_factor, 0.5, 2.0)  # 0.5 = clear, 2.0 = heavy rain
        
        # Incident patterns
        incident_count = np.random.poisson(0.5, n_samples)
        
        # Vehicle density (higher during rush hours)
        base_density = np.random.normal(50, 15, n_samples)
        rush_multiplier = np.where(is_rush_hour, 1.8, 1.0)
        weekend_multiplier = np.where(is_weekend, 0.7, 1.0)
        vehicle_density = base_density * rush_multiplier * weekend_multiplier * weather_factor
        vehicle_density = np.clip(vehicle_density, 10, 200)
        
        # Queue lengths (LHT patterns - right turns are easier)
        ns_queue_base = np.random.exponential(8, n_samples)
        ew_queue_base = np.random.exponential(6, n_samples)  # Slightly less due to LHT
        
        # Current signal timing
        current_green_duration = np.random.normal(150, 30, n_samples)
        current_green_duration = np.clip(current_green_duration, 60, 300)
        
        # Time since last signal change
        time_since_last_change = np.random.exponential(75, n_samples)
        
        # Adjacent intersection congestion
        adjacent_congestion_avg = np.random.normal(30, 10, n_samples)
        adjacent_congestion_avg = np.clip(adjacent_congestion_avg, 0, 100)
        
        # Calculate queue lengths based on factors
        congestion_factor = (vehicle_density / 100) * weather_factor * (1 + incident_count * 0.3)
        ns_queue_length = ns_queue_base * congestion_factor
        ew_queue_length = ew_queue_base * congestion_factor * 0.85  # LHT advantage
        
        # Target: Congestion level (0-100%)
        congestion_level = (
            (ns_queue_length + ew_queue_length) / 2 * 2.5 +
            vehicle_density * 0.3 +
            incident_count * 15 +
            (weather_factor - 1) * 20 +
            adjacent_congestion_avg * 0.2
        )
        congestion_level = np.clip(congestion_level, 0, 100)
        
        # Target: Optimal green duration
        optimal_green = 150 + (ns_queue_length - ew_queue_length) * 2
        optimal_green = np.clip(optimal_green, 60, 300)
        
        # Create DataFrame
        data = pd.DataFrame({
            'hour': hours,
            'day_of_week': days,
            'is_rush_hour': is_rush_hour.astype(int),
            'is_weekend': is_weekend.astype(int),
            'weather_factor': weather_factor,
            'incident_count': incident_count,
            'vehicle_density': vehicle_density,
            'ns_queue_length': ns_queue_length,
            'ew_queue_length': ew_queue_length,
            'current_green_duration': current_green_duration,
            'time_since_last_change': time_since_last_change,
            'adjacent_congestion_avg': adjacent_congestion_avg,
            'congestion_level': congestion_level,
            'optimal_green_duration': optimal_green
        })
        
        return data
    
    def train_models(self, data=None):
        """
        Train both congestion prediction and signal optimization models
        """
        if data is None:
            print("Generating synthetic training data...")
            data = self.generate_synthetic_data()
        
        # Prepare features
        X = data[self.feature_columns]
        y_congestion = data['congestion_level']
        y_optimal_green = data['optimal_green_duration']
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Split data
        X_train, X_test, y_cong_train, y_cong_test = train_test_split(
            X_scaled, y_congestion, test_size=0.2, random_state=42
        )
        _, _, y_green_train, y_green_test = train_test_split(
            X_scaled, y_optimal_green, test_size=0.2, random_state=42
        )
        
        # Train congestion prediction model
        print("Training congestion prediction model...")
        self.congestion_model = GradientBoostingRegressor(
            n_estimators=100, learning_rate=0.1, max_depth=6, random_state=42
        )
        self.congestion_model.fit(X_train, y_cong_train)
        
        # Train signal optimization model
        print("Training signal optimization model...")
        self.signal_optimizer = RandomForestRegressor(
            n_estimators=100, max_depth=8, random_state=42
        )
        self.signal_optimizer.fit(X_train, y_green_train)
        
        # Evaluate models
        cong_pred = self.congestion_model.predict(X_test)
        green_pred = self.signal_optimizer.predict(X_test)
        
        print(f"Congestion Model - MAE: {mean_absolute_error(y_cong_test, cong_pred):.2f}, R²: {r2_score(y_cong_test, cong_pred):.3f}")
        print(f"Signal Optimizer - MAE: {mean_absolute_error(y_green_test, green_pred):.2f}, R²: {r2_score(y_green_test, green_pred):.3f}")
        
        return self
    
    def predict_congestion(self, intersection_data):
        """
        Predict congestion level for a given intersection
        """
        if self.congestion_model is None:
            raise ValueError("Model not trained. Call train_models() first.")
        
        features = self._extract_features(intersection_data)
        features_scaled = self.scaler.transform([features])
        
        congestion = self.congestion_model.predict(features_scaled)[0]
        return max(0, min(100, congestion))
    
    def optimize_signal_timing(self, intersection_data):
        """
        Recommend optimal green light duration
        """
        if self.signal_optimizer is None:
            raise ValueError("Model not trained. Call train_models() first.")
        
        features = self._extract_features(intersection_data)
        features_scaled = self.scaler.transform([features])
        
        optimal_duration = self.signal_optimizer.predict(features_scaled)[0]
        return max(60, min(300, int(optimal_duration)))
    
    def _extract_features(self, intersection_data):
        """
        Extract features from intersection data for prediction
        """
        now = datetime.now()
        hour = now.hour
        day_of_week = now.weekday()
        
        # Rush hour detection (Indian patterns)
        is_rush_hour = int((8 <= hour <= 11) or (18 <= hour <= 21))
        is_weekend = int(day_of_week >= 5)
        
        return [
            hour,
            day_of_week,
            is_rush_hour,
            is_weekend,
            intersection_data.get('weather_factor', 1.0),
            intersection_data.get('incident_count', 0),
            intersection_data.get('vehicle_density', 50),
            intersection_data.get('ns_queue_length', 0),
            intersection_data.get('ew_queue_length', 0),
            intersection_data.get('current_green_duration', 150),
            intersection_data.get('time_since_last_change', 75),
            intersection_data.get('adjacent_congestion_avg', 30)
        ]
    
    def save_models(self, filepath_prefix='bharatflow_model'):
        """
        Save trained models to disk
        """
        if self.congestion_model is None or self.signal_optimizer is None:
            raise ValueError("Models not trained yet.")
        
        joblib.dump(self.congestion_model, f'{filepath_prefix}_congestion.pkl')
        joblib.dump(self.signal_optimizer, f'{filepath_prefix}_signal.pkl')
        joblib.dump(self.scaler, f'{filepath_prefix}_scaler.pkl')
        
        # Save feature columns
        with open(f'{filepath_prefix}_features.json', 'w') as f:
            json.dump(self.feature_columns, f)
        
        print(f"Models saved with prefix: {filepath_prefix}")
    
    def load_models(self, filepath_prefix='bharatflow_model'):
        """
        Load trained models from disk
        """
        try:
            self.congestion_model = joblib.load(f'{filepath_prefix}_congestion.pkl')
            self.signal_optimizer = joblib.load(f'{filepath_prefix}_signal.pkl')
            self.scaler = joblib.load(f'{filepath_prefix}_scaler.pkl')
            
            with open(f'{filepath_prefix}_features.json', 'r') as f:
                self.feature_columns = json.load(f)
            
            print(f"Models loaded from: {filepath_prefix}")
            return True
        except FileNotFoundError:
            print("Model files not found. Train models first.")
            return False

def main():
    """
    Example usage and model training
    """
    print("BharatFlow AI - Traffic Prediction Model")
    print("=" * 50)
    
    # Initialize model
    model = BharatFlowTrafficModel()
    
    # Train models
    model.train_models()
    
    # Save models
    model.save_models()
    
    # Example prediction
    sample_intersection = {
        'weather_factor': 1.2,  # Light rain
        'incident_count': 1,
        'vehicle_density': 85,
        'ns_queue_length': 12,
        'ew_queue_length': 8,
        'current_green_duration': 150,
        'time_since_last_change': 90,
        'adjacent_congestion_avg': 45
    }
    
    congestion = model.predict_congestion(sample_intersection)
    optimal_timing = model.optimize_signal_timing(sample_intersection)
    
    print(f"\nExample Prediction:")
    print(f"Predicted Congestion: {congestion:.1f}%")
    print(f"Optimal Green Duration: {optimal_timing} frames")
    
    # Feature importance
    if hasattr(model.congestion_model, 'feature_importances_'):
        importance = model.congestion_model.feature_importances_
        feature_importance = list(zip(model.feature_columns, importance))
        feature_importance.sort(key=lambda x: x[1], reverse=True)
        
        print(f"\nTop 5 Most Important Features:")
        for feature, imp in feature_importance[:5]:
            print(f"  {feature}: {imp:.3f}")

if __name__ == "__main__":
    main()