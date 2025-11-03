# Gemini Stylist Application

## Overview
Gemini Stylist is a web application that lets users upload a photo of themselves and input a style prompt (e.g., "dark and casual outfit for fall"). The app uses Google Gemini API to recommend a top and bottom from a predefined clothing inventory and then generates an image of the person wearing the selected outfit.

The project consists of a **Python backend** for AI processing and a **frontend** for user interaction.

## Features
- Upload a photo of a person
- Input a natural language prompt describing the desired outfit
- Get AI-recommended top and bottom clothing items from inventory
- Generate and display an image of the person wearing the selected outfit
- Returns the generated image as base64 for frontend display

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd project/backend

2. Create a virtual environment
python -m venv venv
venv\Scripts\activate      # Windows
# OR
source venv/bin/activate   # macOS/Linux

3. Install dependencies:
pip install flask flask-cors pillow google-genai


## How it works

- Frontend sends style prompt and person image to Flask backend
- Backend calls Google Gemini API to choose top and bottom items from inventory
- Backend generates a new image of the person wearing the selected outfit
- Backend returns the image as base64; frontend displays it
