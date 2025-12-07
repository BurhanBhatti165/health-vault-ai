"""
HealthVault LangGraph Workflow
3 Agents: Extractor -> Profiler -> Summarizer
"""
import os
import base64
import json
from typing import TypedDict, List, Dict, Any
from langgraph.graph import StateGraph, END
import requests

# Configuration
OPENROUTER_API_KEY = "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"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# Mock patient database (in-memory)
PATIENT_DATABASE = {}


# Define the Graph State
class HealthVaultState(TypedDict):
    image_path: str
    extracted_data: Dict[str, Any]
    patient_history: List[Dict[str, Any]]
    final_summary: str
    patient_id: str


# Helper function to call OpenRouter API
def call_openrouter(messages: List[Dict], model: str = "google/gemma-3-27b-it:free") -> str:
    """Call OpenRouter API with messages"""
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
        return data["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"API Error: {e}")
        return f"Error: {str(e)}"


# Agent 1: Extractor - Extract prescription data from image
def extractor_agent(state: HealthVaultState) -> HealthVaultState:
    """Extract diagnosis and medicines from prescription image"""
    print("\n🔍 EXTRACTOR AGENT: Processing prescription image...")
    
    image_path = state["image_path"]
    
    # Read and encode image
    try:
        with open(image_path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode("ascii")
            image_data_url = f"data:image/png;base64,{b64}"
    except FileNotFoundError:
        print(f"❌ Image not found: {image_path}")
        state["extracted_data"] = {"error": "Image not found"}
        return state
    
    # Call vision model to extract data
    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": """Extract the following information from this prescription image and return ONLY a valid JSON object:
{
  "diagnosis": "the medical condition/diagnosis",
  "medicines": ["medicine 1", "medicine 2", "medicine 3"]
}
Do not include any other text, just the JSON."""
                },
                {
                    "type": "image_url",
                    "image_url": {"url": image_data_url}
                }
            ]
        }
    ]
    
    response = call_openrouter(messages)
    
    # Parse JSON response
    try:
        # Try to extract JSON from response
        if "```json" in response:
            json_str = response.split("```json")[1].split("```")[0].strip()
        elif "```" in response:
            json_str = response.split("```")[1].split("```")[0].strip()
        else:
            json_str = response.strip()
        
        extracted_data = json.loads(json_str)
        print(f"✅ Extracted: {extracted_data}")
    except json.JSONDecodeError:
        # Fallback: create structured data from text
        extracted_data = {
            "diagnosis": "Unable to parse",
            "medicines": ["Data extraction failed"],
            "raw_response": response
        }
        print(f"⚠️ JSON parse failed, using fallback")
    
    state["extracted_data"] = extracted_data
    return state


# Agent 2: Profiler - Update patient history
def profiler_agent(state: HealthVaultState) -> HealthVaultState:
    """Add extracted data to patient's medical history"""
    print("\n📋 PROFILER AGENT: Updating patient history...")
    
    patient_id = state.get("patient_id", "default_patient")
    extracted_data = state["extracted_data"]
    
    # Initialize patient history if not exists
    if patient_id not in PATIENT_DATABASE:
        PATIENT_DATABASE[patient_id] = []
    
    # Add new record to history
    new_record = {
        "diagnosis": extracted_data.get("diagnosis", "Unknown"),
        "medicines": extracted_data.get("medicines", []),
        "timestamp": "2024-12-07"  # In real app, use datetime.now()
    }
    
    PATIENT_DATABASE[patient_id].append(new_record)
    
    # Get full history
    patient_history = PATIENT_DATABASE[patient_id]
    state["patient_history"] = patient_history
    
    print(f"✅ Updated history for patient {patient_id}")
    print(f"   Total records: {len(patient_history)}")
    
    return state


# Agent 3: Summarizer - Create medical summary
def summarizer_agent(state: HealthVaultState) -> HealthVaultState:
    """Generate a summary of patient's medical status"""
    print("\n📝 SUMMARIZER AGENT: Creating medical summary...")
    
    patient_history = state["patient_history"]
    patient_id = state.get("patient_id", "default_patient")
    
    # Build context from history
    history_text = f"Patient ID: {patient_id}\n\n"
    history_text += f"Total medical records: {len(patient_history)}\n\n"
    
    for i, record in enumerate(patient_history, 1):
        history_text += f"Record {i}:\n"
        history_text += f"  Diagnosis: {record['diagnosis']}\n"
        history_text += f"  Medicines: {', '.join(record['medicines'])}\n"
        history_text += f"  Date: {record['timestamp']}\n\n"
    
    # Call LLM to generate summary
    messages = [
        {
            "role": "user",
            "content": f"""You are a medical assistant. Based on the following patient history, write a concise 2-3 sentence summary for the doctor:

{history_text}

Focus on: current diagnosis, prescribed medications, and any patterns in the medical history."""
        }
    ]
    
    summary = call_openrouter(messages, model="google/gemma-3-27b-it:free")
    
    state["final_summary"] = summary
    print(f"✅ Summary generated")
    
    return state


# Build the LangGraph workflow
def create_healthvault_graph():
    """Create and compile the HealthVault workflow graph"""
    
    # Initialize the graph
    workflow = StateGraph(HealthVaultState)
    
    # Add the three agent nodes
    workflow.add_node("extractor", extractor_agent)
    workflow.add_node("profiler", profiler_agent)
    workflow.add_node("summarizer", summarizer_agent)
    
    # Define the flow: extractor -> profiler -> summarizer -> END
    workflow.set_entry_point("extractor")
    workflow.add_edge("extractor", "profiler")
    workflow.add_edge("profiler", "summarizer")
    workflow.add_edge("summarizer", END)
    
    # Compile the graph
    app = workflow.compile()
    
    return app


# Main function to run the workflow
def run_healthvault_workflow(image_path: str, patient_id: str = "patient_001"):
    """
    Run the complete HealthVault workflow
    
    Args:
        image_path: Path to prescription image
        patient_id: Unique patient identifier
    """
    print("=" * 60)
    print("🏥 HEALTHVAULT LANGGRAPH WORKFLOW")
    print("=" * 60)
    
    # Create the graph
    app = create_healthvault_graph()
    
    # Initial state
    initial_state = {
        "image_path": image_path,
        "extracted_data": {},
        "patient_history": [],
        "final_summary": "",
        "patient_id": patient_id
    }
    
    # Run the workflow
    final_state = app.invoke(initial_state)
    
    # Display results
    print("\n" + "=" * 60)
    print("📊 FINAL RESULTS")
    print("=" * 60)
    print(f"\n🔍 Extracted Data:")
    print(json.dumps(final_state["extracted_data"], indent=2))
    print(f"\n📋 Patient History ({len(final_state['patient_history'])} records):")
    for i, record in enumerate(final_state["patient_history"], 1):
        print(f"  {i}. {record['diagnosis']} - {', '.join(record['medicines'])}")
    print(f"\n📝 Medical Summary:")
    print(final_state["final_summary"])
    print("\n" + "=" * 60)
    
    return final_state


# Example usage
if __name__ == "__main__":
    # Test with a prescription image
    image_path = "prescription.png"
    
    if os.path.exists(image_path):
        # Run workflow for first time
        print("\n🔄 Running workflow - First prescription")
        result1 = run_healthvault_workflow(image_path, patient_id="patient_001")
        
        # Simulate adding another prescription for the same patient
        print("\n\n🔄 Running workflow - Second prescription (same patient)")
        result2 = run_healthvault_workflow(image_path, patient_id="patient_001")
        
    else:
        print(f"❌ Image not found: {image_path}")
        print("Please place a prescription.png file in the current directory")
