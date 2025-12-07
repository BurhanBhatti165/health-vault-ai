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


def call_openrouter(messages: List[Dict], model: str = "google/gemma-3-27b-it:free") -> str:
    """Call OpenRouter API"""
    payload = {
        "model": model,
        "messages": messages,
        "stream": False,
    }
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }
    
    resp = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=60)
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]


def extractor_agent(state: HealthVaultState) -> HealthVaultState:
    """Extract prescription data from image"""
    image_data_url = f"data:image/png;base64,{state['image_base64']}"
    
    messages = [{
        "role": "user",
        "content": [
            {
                "type": "text",
                "text": """You are a medical document analyzer. Carefully examine this medical document/prescription image and extract ALL visible information.

Return a JSON object with the following structure:
{
  "document_type": "prescription/lab_report/medical_certificate/etc",
  "diagnosis": "primary diagnosis or condition mentioned",
  "medicines": ["medicine name with dosage", "medicine name with dosage"],
  "doctor_name": "prescribing doctor's name if visible",
  "date": "date on document if visible",
  "instructions": "any special instructions or notes",
  "additional_findings": "any other relevant medical information"
}

If any field is not visible or not applicable, use "Not specified" or an empty array.
Return ONLY the JSON, no other text."""
            },
            {"type": "image_url", "image_url": {"url": image_data_url}}
        ]
    }]
    
    response = call_openrouter(messages)
    
    try:
        # Try to extract JSON from response
        if "```json" in response:
            json_str = response.split("```json")[1].split("```")[0].strip()
        elif "```" in response:
            json_str = response.split("```")[1].split("```")[0].strip()
        else:
            json_str = response.strip()
        
        extracted = json.loads(json_str)
        
        # Ensure required fields exist
        state["extracted_data"] = {
            "document_type": extracted.get("document_type", "Medical Document"),
            "diagnosis": extracted.get("diagnosis", "Not specified"),
            "medicines": extracted.get("medicines", []),
            "doctor_name": extracted.get("doctor_name", "Not specified"),
            "date": extracted.get("date", "Not specified"),
            "instructions": extracted.get("instructions", "Not specified"),
            "additional_findings": extracted.get("additional_findings", "Not specified"),
            "raw_text": response[:500]  # Keep first 500 chars of raw response
        }
    except Exception as e:
        # Fallback: use raw response as text
        state["extracted_data"] = {
            "document_type": "Medical Document",
            "diagnosis": "Unable to parse structured data",
            "medicines": [],
            "doctor_name": "Not specified",
            "date": "Not specified",
            "instructions": "Not specified",
            "additional_findings": response[:300] if response else "No data extracted",
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
