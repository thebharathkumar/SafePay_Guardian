import logging
from flask import Flask, request, Response, render_template, abort
from werkzeug.exceptions import BadRequest

# Import the main functions from your scripts
# Make sure mt103_transformer.py and nacha_transformer.py are in the same folder
try:
    from mt103_transformer import transform_mt103_to_iso20022
    from nacha_transformer import transform_nacha_to_iso20022
except ImportError as e:
    print(f"FATAL ERROR: Could not import transformer scripts: {e}")
    print("Please make sure 'mt103_transformer.py' and 'nacha_transformer.py' are in the same directory as app.py")
    exit(1)


# --- Flask App Setup ---

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
app.logger.setLevel(logging.INFO)

# --- Routes ---

@app.route('/')
def index():
    """Serves the main HTML test page."""
    # This will look for 'test_transformer.html' in a folder named 'templates'
    # For simplicity, you can just open your 'test_transformer.html' file directly
    # in your browser, and it will still work (it will just fail to connect).
    
    # A better way: create a 'templates' folder, put 'test_transformer.html' inside it,
    # and then just go to http://127.0.0.1:5000/ in your browser.
    try:
        return render_template('test_transformer.html')
    except Exception:
        return "Please create a 'templates' folder and put 'test_transformer.html' inside it."


@app.route('/transform/mt103', methods=['POST'])
def handle_mt103():
    """API endpoint to transform MT103."""
    app.logger.info("Received request for MT103 transformation")
    try:
        # Get raw text data from the request body
        mt103_text = request.data.decode('utf-8')
        if not mt103_text:
            raise BadRequest("No MT103 data provided in request body")
        
        # Call your existing function
        xml_output = transform_mt103_to_iso20022(mt103_text)
        
        # Return the result as XML
        return Response(xml_output, mimetype='application/xml')
        
    except Exception as e:
        app.logger.error(f"MT103 Transformation Failed: {str(e)}")
        # Return a 400 Bad Request error with the exception message
        abort(400, description=f"Transformation Error: {str(e)}")


@app.route('/transform/nacha', methods=['POST'])
def handle_nacha():
    """API endpoint to transform NACHA."""
    app.logger.info("Received request for NACHA transformation")
    try:
        # Get raw text data from the request body
        nacha_text = request.data.decode('utf-8')
        if not nacha_text:
            raise BadRequest("No NACHA data provided in request body")

        # Call your existing function
        xml_output = transform_nacha_to_iso20022(nacha_text)
        
        # Return the result as XML
        return Response(xml_output, mimetype='application/xml')

    except Exception as e:
        app.logger.error(f"NACHA Transformation Failed: {str(e)}")
        # Return a 400 Bad Request error with the exception message
        abort(400, description=f"Transformation Error: {str(e)}")


# --- Run the App ---

if __name__ == '__main__':
    app.run(debug=True, port=5000)