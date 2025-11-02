import base64
import io
import os
import json
import time
from typing import Dict, Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from PIL import Image
from google import genai
from google.genai import types

#
# ---------- CONFIG ----------
#

MY_API_KEY = "AIzaSyCIJ33QNaJ-a4q6DFw7q3OCPgqOOfY9rCM"  # move this to env in production
BASE_CLOSET_PATH = "/Users/senay/Downloads/gemini-ai-fashion-stylist/"

# Your inventory
INVENTORY_DATA = {
    "components/icons/Tops/hoodie1.jpg": {
        "clothing_type": "hoodie",
        "color": "Red",
        "material": "Wool Blend",
        "season_suitability": "Winter, Fall",
        "description": "Red, light weight, baggy, colorful."
    },
    "components/icons/Clothes/Tops/hoodie2.jpg": {
        "clothing_type": "hoodie",
        "color": "Brown",
        "material": "Polyester",
        "season_suitability": "Fall, Spring",
        "description": "Brown, medium weight, baggy, striped."
    },
    "components/icons/Clothes/Tops/jacket1.jpg": {
        "clothing_type": "jacket",
        "color": "Black",
        "material": "Suede",
        "season_suitability": "Winter, Fall",
        "description": "Black, sporty, trendy."
    },
    "components/icons/Clothes/Tops/sweater1.jpg": {
        "clothing_type": "sweater",
        "color": "Grey",
        "material": "Wool Blend",
        "season_suitability": "Winter, Fall",
        "description": "Grey, light weight, textured, professional."
    },
    "components/icons/Clothes/Tops/polo1.jpg": {
        "clothing_type": "polo shirt",
        "color": "Black",
        "material": "Wool Blend",
        "season_suitability": "Spring, Summer",
        "description": "Black, light weight, professional."
    },
    "components/icons/Clothes/Tops/polo2.jpg": {
        "clothing_type": "polo shirt",
        "color": "Green",
        "material": "Wool Blend",
        "season_suitability": "Spring, Summer",
        "description": "Green, striped, casual."
    },
    "components/icons/ClothesTops/polo3.jpg": {
        "clothing_type": "polo shirt",
        "color": "Blue",
        "material": "Wool Blend",
        "season_suitability": "Spring, Summer",
        "description": "Blue, plain, business casual."
    },
    "components/icons/Clothes/Bottoms/jeans1.jpg": {
        "clothing_type": "Jeans",
        "color": "Black",
        "material": "Denim",
        "season_suitability": "Winter, Fall, Spring, Summer",
        "description": "Tight fit, washed, casual."
    },
    "components/icons/Clothes/Bottoms/jeans2.jpg": {
        "clothing_type": "Jeans",
        "color": "Blue",
        "material": "Denim",
        "season_suitability": "Fall, Spring, Summer",
        "description": "trousers for cold days."
    },
    "components/icons/Clothes/Bottoms/jeans3.jpg": {
        "clothing_type": "Jeans",
        "color": "Black",
        "material": "Denim",
        "season_suitability": "Winter, Fall, Spring, Summer",
        "description": "Slim fit, professional."
    }
}

# Gemini schema for outfit selection
OUTFIT_SCHEMA = types.Schema(
    type=types.Type.OBJECT,
    properties={
        "best_top_path": types.Schema(
            type=types.Type.STRING,
            description="The EXACT file path (key) of the single best item suitable for a Top layer (like a shirt, sweater, or jacket) from the inventory."
        ),
        "best_bottom_path": types.Schema(
            type=types.Type.STRING,
            description="The EXACT file path (key) of the single best item suitable for a Bottom layer (like trousers, shorts, or a skirt) from the inventory."
        )
    },
    required=["best_top_path", "best_bottom_path"]
)

#
# ---------- HELPERS ----------
#

def call_api_with_retry(fn, max_retries=5):
    for attempt in range(max_retries):
        try:
            return fn()
        except (genai.errors.APIError, json.JSONDecodeError) as e:
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt
                print(f"[Gemini retry] {e} ... sleeping {wait_time}s")
                time.sleep(wait_time)
            else:
                raise

def decode_base64_image(b64_str: str) -> Image.Image:
    """
    Turn a base64 string like "data:image/png;base64,AAAA..." OR just "AAAA..." into a PIL.Image.
    """
    if "," in b64_str:
        _, b64_data = b64_str.split(",", 1)
    else:
        b64_data = b64_str
    img_bytes = base64.b64decode(b64_data)
    return Image.open(io.BytesIO(img_bytes)).convert("RGBA")

def encode_base64_image(pil_img: Image.Image) -> str:
    """
    Convert PIL.Image -> base64 PNG string (no data: prefix, you can add it in frontend).
    """
    buffered = io.BytesIO()
    pil_img.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode("utf-8")

#
# ---------- CORE STEPS ----------
#

def recommend_outfit(user_request: str, client: genai.Client) -> Dict[str, Any]:
    """
    Ask Gemini which top/bottom to use from INVENTORY_DATA.
    Returns dict with { best_top_path, best_bottom_path }.
    """
    inventory_json_string = json.dumps(INVENTORY_DATA, indent=2)

    system_instruction = (
        "You are an expert personal stylist. Your task is to recommend one Top item "
        "and one Bottom item from the provided INVENTORY. You MUST respond with a single "
        "JSON object that strictly adheres to the provided schema and contains ONLY the two file paths. "
        "The selected items MUST be compatible with the user's request (e.g., season, occasion) "
        "and be color-coordinated. Do not include any additional text or summaries."
    )

    user_prompt = (
        f"The user's request is: '{user_request}'\n\n"
        f"INVENTORY (Keys are file paths/IDs and values are metadata):\n"
        f"{inventory_json_string}\n\n"
        f"Please select the single best Top and single best Bottom to form a cohesive outfit and provide ONLY the structured output."
    )

    def api_call():
        contents = [
            types.Content(role="user", parts=[
                types.Part.from_text(text=system_instruction),
                types.Part.from_text(text=user_prompt),
            ]),
        ]

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=OUTFIT_SCHEMA,
            ),
        )
        # Gemini should send valid JSON text back under response.text
        return json.loads(response.text.strip())

    return call_api_with_retry(api_call)


def generate_outfit_image_on_person(
    client: genai.Client,
    person_img: Image.Image,
    top_path: str,
    bottom_path: str,
) -> Image.Image:
    """
    Take the person photo and the 2 clothing items, call Gemini image model,
    return the generated PIL image.
    """

    # load clothing images from disk using the chosen inventory paths
    clothes_img_full = os.path.join(BASE_CLOSET_PATH, top_path)
    pants_img_full = os.path.join(BASE_CLOSET_PATH, bottom_path)

    if not os.path.exists(clothes_img_full):
        raise FileNotFoundError(f"top not found: {clothes_img_full}")
    if not os.path.exists(pants_img_full):
        raise FileNotFoundError(f"bottom not found: {pants_img_full}")

    clothes_img = Image.open(clothes_img_full)
    pants_img = Image.open(pants_img_full)

    img_prompt = (
        "There is an image of a person and images of additional clothes. "
        "Generate an image of the person wearing the clothes provided. "
        "Replace BOTH the top and the bottom from what the person is currently wearing. "
        "Keep the same person, upright, full body centered, natural lighting."
    )

    # ⚠ depends on Gemini multimodal API format you're using.
    # This mirrors your original usage.
    response = client.models.generate_content(
        model="gemini-2.5-flash-image",
        contents=[img_prompt, person_img, clothes_img, pants_img],
    )

    # Walk the parts until we find inline_data (the image result)
    for part in response.candidates[0].content.parts:
        if getattr(part, "inline_data", None) is not None:
            pil_out = Image.open(io.BytesIO(part.inline_data.data))
            return pil_out

    # Fallback: no image returned
    raise RuntimeError("No generated image returned from Gemini.")


#
# ---------- FASTAPI LAYER ----------
#

app = FastAPI()

class StylizeRequest(BaseModel):
    prompt: str                   # "I want a dark and casual outfit for fall"
    person_image_b64: str         # base64 of uploaded person image

class StylizeResponse(BaseModel):
    result_image_b64: str         # base64 of final styled image
    best_top_path: str
    best_bottom_path: str

@app.post("/style", response_model=StylizeResponse)
def style_endpoint(body: StylizeRequest):
    """
    1. take text prompt + base64 person img from frontend
    2. pick best clothes from inventory
    3. generate new picture wearing them
    4. return final image as base64
    """
    try:
        # init Gemini client
        client = genai.Client(api_key=MY_API_KEY)

        # decode person image from base64
        person_img = decode_base64_image(body.person_image_b64)

        # step 1: recommend outfit
        outfit = recommend_outfit(body.prompt, client)
        best_top = outfit.get("best_top_path")
        best_bottom = outfit.get("best_bottom_path")

        if not best_top or not best_bottom:
            raise HTTPException(status_code=500, detail="Gemini did not return outfit paths.")

        # step 2: generate styled image
        styled_img = generate_outfit_image_on_person(
            client,
            person_img,
            best_top,
            best_bottom,
        )

        # step 3: encode result back to base64
        styled_b64 = encode_base64_image(styled_img)

        return StylizeResponse(
            result_image_b64=styled_b64,
            best_top_path=best_top,
            best_bottom_path=best_bottom,
        )

    except FileNotFoundError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except genai.errors.APIError as e:
        raise HTTPException(status_code=502, detail=f"Gemini API error: {e}")
    except Exception as e:
        # catch-all to avoid FastAPI default HTML error dump
        raise HTTPException(status_code=500, detail=f"Server error: {e}")