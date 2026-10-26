import os
from app import create_app
from app.extensions import db
from app.seed import seed_database

app = create_app()

with app.app_context():
    try:
        db.create_all()
        # Auto-seed if in dev/demo mode
        if app.config.get('DEMO_MODE', True):
            seed_database(app)
    except Exception as e:
        print(f"Warning during DB initialization or seeding: {e}")

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'true').lower() in ('1', 'true', 'yes')
    print(f"Starting HealSense Backend API on http://127.0.0.1:{port} (Debug: {debug})")
    app.run(host='0.0.0.0', port=port, debug=debug)
