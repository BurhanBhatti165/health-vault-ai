"""
HealthVault LangGraph Service for Node.js Backend
Accepts JSON input via stdin and returns JSON output
"""
import sys
import json
import base64
from typing import TypedDict, List, Dict, Any
from langgraph.graph import StateGraph, END
import requests

# Configuration
OPENROUTER_API_KEY = "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"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


class HealthVaultState(TypedDict):
    image_base64: str
    extracted_data: Dict[str, Any]
    patient_history: List[Dict[str, Any]]
    final_summary: str


def call_openrouter(messages: List[Dict], model: str = "google/gemini-pro-1.5:free") -> str:
    """Call OpenRouter API with vision support"""
    payload = {
        "model": model,
        "messages": messages,
        "stream": False,
    }
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }
    
    try:
        resp = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=60)
        resp.raise_for_status()
        data = resp.json()
        
        # Check if response has the expected structure
        if "choices" in data and len(data["choices"]) > 0:
            return data["choices"][0]["message"]["content"]
        else:
            return f"Error: Unexpected API response structure: {json.dumps(data)}"
    except requests.exceptions.RequestException as e:
        return f"Error calling OpenRouter API: {str(e)}"
    except Exception as e:
        return f"Error processing API response: {str(e)}"


def extractor_agent(state: HealthVaultState) -> HealthVaultState:
    """Extract prescription data from image"""
    try:
        image_data_url = f"data:image/png;base64,{state['image_base64']}"
        
        messages = [{
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": """Analyze this medical document image and extract information. Return ONLY a JSON object (no other text):

{
  "document_type": "prescription or lab_report or medical_certificate",
  "diagnosis": "condition or diagnosis mentioned",
  "medicines": ["medicine 1 with dosage", "medicine 2 with dosage"],
  "doctor_name": "doctor's name if visible",
  "date": "date if visible",
  "instructions": "any instructions",
  "additional_findings": "other relevant info"
}

Use "Not specified" for missing fields. Return ONLY valid JSON."""
                },
                {"type": "image_url", "image_url": {"url": image_data_url}}
            ]
        }]
        
        response = call_openrouter(messages)
        
        # Check if response contains error
        if response.startswith("Error:"):
            raise Exception(response)
        
        # Try to extract JSON from response
        json_str = response.strip()
        
        # Remove markdown code blocks if present
        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0].strip()
        elif "```" in json_str:
            json_str = json_str.split("```")[1].split("```")[0].strip()
        
        # Remove any leading/trailing text
        if "{" in json_str and "}" in json_str:
            start = json_str.index("{")
            end = json_str.rindex("}") + 1
            json_str = json_str[start:end]
        
        extracted = json.loads(json_str)
        
        # Ensure required fields exist with proper defaults
        state["extracted_data"] = {
            "document_type": extracted.get("document_type", "Medical Document"),
            "diagnosis": extracted.get("diagnosis", "Not specified"),
            "medicines": extracted.get("medicines", []) if isinstance(extracted.get("medicines"), list) else [],
            "doctor_name": extracted.get("doctor_name", "Not specified"),
            "date": extracted.get("date", "Not specified"),
            "instructions": extracted.get("instructions", "Not specified"),
            "additional_findings": extracted.get("additional_findings", "Not specified"),
            "raw_text": response[:500]  # Keep first 500 chars of raw response
        }
        
    except Exception as e:
        # Fallback: create a basic structure with error info
        state["extracted_data"] = {
            "document_type": "Medical Document",
            "diagnosis": "Extraction failed - please try Gemini Vision method",
            "medicines": [],
            "doctor_name": "Not specified",
            "date": "Not specified",
            "instructions": "Not specified",
            "additional_findings": f"Error: {str(e)[:200]}",
            "error": str(e)
        }
    
    return state


def profiler_agent(state: HealthVaultState) -> HealthVaultState:
    """Update patient history"""
    new_record = {
        "diagnosis": state["extracted_data"].get("diagnosis", "Unknown"),
        "medicines": state["extracted_data"].get("medicines", [])
    }
    
    state["patient_history"].append(new_record)
    return state


def summarizer_agent(state: HealthVaultState) -> HealthVaultState:
    """Generate medical summary"""
    history_text = "PATIENT MEDICAL HISTORY:\n\n"
    
    for i, record in enumerate(state["patient_history"], 1):
        history_text += f"Record {i}:\n"
        history_text += f"  Diagnosis: {record.get('diagnosis', 'Not specified')}\n"
        
        medicines = record.get('medicines', [])
        if medicines:
            history_text += f"  Medicines: {', '.join(medicines)}\n"
        
        if 'date' in record:
            history_text += f"  Date: {record['date']}\n"
        
        history_text += "\n"
    
    messages = [{
        "role": "user",
        "content": f"""You are a medical assistant. Based on the patient's medical history below, write a concise professional summary (3-4 sentences) for the doctor.

{history_text}

Focus on:
1. Current medical conditions and diagnoses
2. Prescribed medications and treatment plan
3. Any patterns or trends in the medical history
4. Key points the doctor should be aware of

Write in a professional medical tone."""
    }]
    
    state["final_summary"] = call_openrouter(messages)
    return state


def create_graph():
    """Create the workflow graph"""
    workflow = StateGraph(HealthVaultState)
    workflow.add_node("extractor", extractor_agent)
    workflow.add_node("profiler", profiler_agent)
    workflow.add_node("summarizer", summarizer_agent)
    workflow.set_entry_point("extractor")
    workflow.add_edge("extractor", "profiler")
    workflow.add_edge("profiler", "summarizer")
    workflow.add_edge("summarizer", END)
    return workflow.compile()


def main():
    """Main entry point - reads JSON from stdin, outputs JSON to stdout"""
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        
        # Create graph
        app = create_graph()
        
        # Run workflow
        initial_state = {
            "image_base64": input_data["image_base64"],
            "extracted_data": {},
            "patient_history": input_data.get("patient_history", []),
            "final_summary": ""
        }
        
        final_state = app.invoke(initial_state)
        
        # Output result as JSON
        result = {
            "success": True,
            "extracted_data": final_state["extracted_data"],
            "patient_history": final_state["patient_history"],
            "final_summary": final_state["final_summary"]
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(error_result))
        sys.exit(1)


if __name__ == "__main__":
    main()
