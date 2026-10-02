# LogiGenAI – Final LB1 Package

A logistics GenAI application prototype with dynamic Demo Mode.

## Four modules
1. Shipment Analysis
2. Documentation Verification
3. Exception Assistant
4. Customer Email Generator

## Evaluation
Includes a five-criterion quality-check panel for factuality, relevance, completeness, assumption control and human verification.

## Fastest way to run
Double-click `START_DEMO.bat`. It will create a local virtual environment if needed, install dependencies, and start the Flask server. Then open `http://127.0.0.1:5000`.

## Manual run
`python -m venv .venv`
`\.venv\Scripts\activate`
`pip install -r requirements.txt`
`python app.py`

## Demo Mode
`FORCE_DEMO_MODE=true` is the safe default and does not call the external API. Demo outputs are deterministic but dynamically use the user's typed shipment values.

## Optional live integration
Set `FORCE_DEMO_MODE=false` and provide an API key and model in `.env` only when a working API account is available.

## Academic honesty
The demonstration outputs are simulated prototype outputs. They should not be presented as real-time carrier, customs, rate or ETA data.
