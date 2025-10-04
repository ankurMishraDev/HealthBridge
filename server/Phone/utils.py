import json
import logging

logger = logging.getLogger(__name__)

def extract_json(text: str) -> dict:
    """Best-effort extraction of a JSON object from model output."""
    if not text:
        return {"raw": ""}
    try:
        return json.loads(text)
    except Exception:
        pass
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        candidate = text[start:end + 1]
        try:
            return json.loads(candidate)
        except Exception:
            pass
    return {"raw": text.strip()}

def validate_mood_scores(summary_obj: dict) -> dict:
    """Validate and correct mood scores to ensure they're within valid ranges."""
    if not isinstance(summary_obj, dict):
        return summary_obj
    
    # Define validation rules for each score field
    score_fields = {
        'mood_percentage': (0, 100),  # 0-100 scale (no negative values)
        'energy_level': (0, 100),
        'stress_level': (0, 100),
        'cognitive_score': (0, 100),
        'emotional_score': (0, 100),
        'anxiety_level': (0, 100),
        'physical_activity_minutes': (0, None),  # No upper limit for minutes
    }
    
    # Validate and clamp scores
    for field, (min_val, max_val) in score_fields.items():
        if field in summary_obj and summary_obj[field] is not None:
            try:
                score = float(summary_obj[field])
                
                # Apply minimum constraint
                if score < min_val:
                    logger.warning(f"Clamping {field} from {score} to {min_val} (minimum)")
                    score = min_val
                
                # Apply maximum constraint if specified
                if max_val is not None and score > max_val:
                    logger.warning(f"Clamping {field} from {score} to {max_val} (maximum)")
                    score = max_val
                
                # Round to nearest integer for percentage scores
                if field.endswith('_level') or field.endswith('_score') or field.endswith('_percentage'):
                    summary_obj[field] = round(score)
                else:
                    summary_obj[field] = score
                    
            except (ValueError, TypeError):
                logger.warning(f"Invalid {field} value: {summary_obj[field]}, setting to 0")
                summary_obj[field] = 0
    
    # Special validation for sleep duration (should be reasonable)
    if 'sleep_duration_hours' in summary_obj and summary_obj['sleep_duration_hours'] is not None:
        try:
            hours = float(summary_obj['sleep_duration_hours'])
            if hours < 0:
                summary_obj['sleep_duration_hours'] = 0
            elif hours > 24:  # Cap at 24 hours
                summary_obj['sleep_duration_hours'] = 24
        except (ValueError, TypeError):
            summary_obj['sleep_duration_hours'] = None
    
    return summary_obj

def ensure_dir(path: str):
    import os
    os.makedirs(path, exist_ok=True)

def pick_summarizer_model(live_or_text_model: str) -> str:
    """
    Map Live/native-audio models to a compatible text model for generateContent.
    Falls back to the original if it's already a text model.
    """
    m = (live_or_text_model or "").lower()

    # Common live/native-audio identifiers
    if "live" in m or "native-audio" in m or "realtime" in m:
        # Prefer a modern Flash text model available in Vertex region
        # Adjust these if you have specific allowlists in your project/region
        if "2.5" in m or "2-5" in m:
            return "gemini-2.0-flash-exp"      # good general fast text model
        if "2.0" in m or "2-" in m:
            return "gemini-2.0-flash-exp"
        # Fallback
        return "gemini-1.5-flash"

    # If the provided model is already a text model, keep it
    return live_or_text_model or "gemini-1.5-flash"