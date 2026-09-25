import os
import json
import urllib.request
import urllib.error
import ssl

try:
    from groq import Groq
except ImportError:
    Groq = None

def get_api_keys(request=None):
    """
    Extract Google Gemini and Groq API keys from request headers/body or environment variables.
    """
    gemini_key = ""
    if request:
        # Check header variants
        gemini_key = (
            request.headers.get("X-Gemini-API-Key")
            or request.headers.get("X-Google-API-Key")
            or request.META.get("HTTP_X_GEMINI_API_KEY")
            or request.META.get("HTTP_X_GOOGLE_API_KEY")
            or (request.data.get("gemini_api_key") if hasattr(request, "data") and isinstance(request.data, dict) else "")
            or (request.data.get("google_api_key") if hasattr(request, "data") and isinstance(request.data, dict) else "")
            or ""
        )
        if gemini_key:
            gemini_key = str(gemini_key).strip()

    if not gemini_key:
        gemini_key = (
            os.environ.get("GEMINI_API_KEY")
            or os.environ.get("GOOGLE_API_KEY")
            or os.environ.get("GOOGLE_SOURCE_API_KEY")
            or ""
        ).strip()

    groq_key = ""
    if request:
        groq_key = (
            request.headers.get("X-Groq-API-Key")
            or request.META.get("HTTP_X_GROQ_API_KEY")
            or ""
        )
        if groq_key:
            groq_key = str(groq_key).strip()
    if not groq_key:
        groq_key = os.environ.get("GROQ_API_KEY", "").strip()

    return gemini_key, groq_key


def call_gemini(prompt: str, api_key: str, model: str = "gemini-3.1-flash-lite", json_mode: bool = True, system_instruction: str = ""):
    """
    Direct REST call to Google Gemini API (gemini-3.1-flash-lite, gemini-3.5-flash, gemini-3.7-flash, etc.)
    """
    if not api_key:
        return None

    models_to_try = [model, "gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-3.1-pro-preview", "gemini-3.7-flash", "gemini-3.8-flash", "gemini-flash-latest"]
    seen = set()
    models_to_try = [m for m in models_to_try if not (m in seen or seen.add(m))]

    for m in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={api_key}"
        
        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ]
        }
        
        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        if json_mode:
            payload["generationConfig"] = {
                "responseMimeType": "application/json",
                "temperature": 0.4
            }
        else:
            payload["generationConfig"] = {
                "temperature": 0.7
            }

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE

            with urllib.request.urlopen(req, context=ctx, timeout=25) as response:
                res_body = response.read().decode("utf-8")
                res_json = json.loads(res_body)
                
                candidates = res_json.get("candidates", [])
                if candidates:
                    content = candidates[0].get("content", {})
                    parts = content.get("parts", [])
                    if parts:
                        return parts[0].get("text", "")
        except urllib.error.HTTPError as he:
            err_msg = he.read().decode("utf-8", errors="ignore")
            print(f"Gemini API [{m}] HTTP Error {he.code}: {err_msg}")
            continue
        except Exception as ex:
            print(f"Gemini API [{m}] Error: {ex}")
            continue

    return None


def generate_ai_response(prompt: str, request=None, json_mode: bool = True, system_instruction: str = ""):
    """
    Main entry point for AI text & JSON generation:
    1. Google Gemini API (First priority)
    2. Groq Llama-3 API (Fallback)
    3. Returns None if both unavailable
    """
    gemini_key, groq_key = get_api_keys(request)

    # 1. Try Google Gemini
    if gemini_key:
        try:
            raw_text = call_gemini(prompt, gemini_key, json_mode=json_mode, system_instruction=system_instruction)
            if raw_text:
                if json_mode:
                    clean = raw_text.strip()
                    if clean.startswith("```json"):
                        clean = clean[7:]
                    elif clean.startswith("```"):
                        clean = clean[3:]
                    if clean.endswith("```"):
                        clean = clean[:-3]
                    return json.loads(clean.strip())
                return raw_text
        except Exception as e:
            print("Gemini response parse error:", e)

    # 2. Try Groq
    if groq_key and Groq:
        try:
            client = Groq(api_key=groq_key)
            kwargs = {
                "messages": [{"role": "user", "content": prompt}],
                "model": "llama-3.3-70b-versatile"
            }
            if json_mode:
                kwargs["response_format"] = {"type": "json_object"}
            
            chat_completion = client.chat.completions.create(**kwargs)
            content = chat_completion.choices[0].message.content
            if json_mode:
                return json.loads(content)
            return content
        except Exception as e:
            print("Groq execution error:", e)

    return None


def verify_gemini_key(api_key: str):
    """
    Validates a Google Gemini API Key by making a lightweight test ping.
    """
    if not api_key:
        return {"valid": False, "error": "No API key provided."}
    
    test_prompt = "Reply with JSON: {\"status\": \"ok\", \"model\": \"gemini\"}"
    res = call_gemini(test_prompt, api_key.strip(), json_mode=True)
    if res:
        try:
            data = json.loads(res.strip())
            return {"valid": True, "message": "Google Gemini API key verified successfully!", "details": data}
        except Exception:
            return {"valid": True, "message": "Google Gemini API key verified successfully!"}
    return {"valid": False, "error": "Invalid API key or unauthorized request from Google Generative AI."}
