import os
from flask import Flask, jsonify
from app.config import Config
from app.extensions import db, migrate, cors

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Ensure uploads storage directory exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config.get('FRONTEND_ORIGIN', '*')}})

    # Register API blueprints
    from app.api.auth import auth_bp
    from app.api.dashboard import dashboard_bp
    from app.api.patients import patients_bp
    from app.api.scans import scans_bp
    from app.api.calibration import calibration_bp
    from app.api.reports import reports_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(patients_bp)
    app.register_blueprint(scans_bp)
    app.register_blueprint(calibration_bp)
    app.register_blueprint(reports_bp)

    with app.app_context():
        # Ensure database tables exist
        db.create_all()

    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'service': 'HealSense API',
            'version': '1.0.0',
            'prototype_mode': app.config.get('DEMO_MODE', True)
        })

    # Global error handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Resource not found'}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({'error': 'Internal server error. Logged securely.'}), 500

    return app
