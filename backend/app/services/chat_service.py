import os
import re
import datetime
import json
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, AsyncIterator, Tuple
from sqlalchemy.orm import Session

from app.models.vessel import Vessel
from app.services.data_tools import TOOL_REGISTRY, load_reports_for_vessel

# ── LLM Provider Abstractions ───────────────────────────────────────────────

class LLMProvider(ABC):
    @abstractmethod
    def generate_stream(self, system_prompt: str, history: List[Dict[str, str]], context: str) -> AsyncIterator[str]:
        """Generate response chunks asynchronously."""
        pass


class GeminiProvider(LLMProvider):
    """Implementation for google-genai SDK."""
    def __init__(self, api_key: str, model_name: str):
        self.api_key = api_key
        self.model_name = model_name

    async def generate_stream(self, system_prompt: str, history: List[Dict[str, str]], context: str) -> AsyncIterator[str]:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=self.api_key)

        # Build contents from history and context
        contents = []
        
        # Inject context at the top of the conversation
        contents.append(f"CURRENT DATABASE DATA CONTEXT:\n{context}\n\nPlease use this context to answer the user's questions.")
        
        for msg in history:
            role = "user" if msg["role"] == "user" else "model"
            contents.append(types.Content(
                role=role,
                parts=[types.Part.from_text(text=msg["content"])]
            ))

        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0.1,
        )

        response = await client.aio.models.generate_content_stream(
            model=self.model_name,
            contents=contents,
            config=config
        )

        async for chunk in response:
            if chunk.text:
                yield chunk.text


class OpenAIProvider(LLMProvider):
    """Implementation for OpenAI SDK."""
    def __init__(self, api_key: str, model_name: str):
        self.api_key = api_key
        self.model_name = model_name

    async def generate_stream(self, system_prompt: str, history: List[Dict[str, str]], context: str) -> AsyncIterator[str]:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=self.api_key)

        messages = [{"role": "system", "content": f"{system_prompt}\n\nDATA CONTEXT:\n{context}"}]
        for msg in history:
            messages.append({"role": msg["role"], "content": msg["content"]})

        response = await client.chat.completions.create(
            model=self.model_name,
            messages=messages,
            stream=True,
            temperature=0.1,
        )

        async for chunk in response:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content


def get_llm_provider() -> LLMProvider:
    """Factory function to get LLM provider based on env config."""
    provider_name = os.getenv("AI_PROVIDER", "gemini").lower()
    api_key = os.getenv("AI_API_KEY", "")
    model_name = os.getenv("AI_MODEL", "gemini-2.5-flash")

    if not api_key or "placeholder" in api_key:
        # Fallback dummy provider for testing without API keys
        class DummyProvider(LLMProvider):
            async def generate_stream(self, system_prompt: str, history: List[Dict[str, str]], context: str) -> AsyncIterator[str]:
                yield "VPRO AI Assistant (Demo Mode)\n\n"
                yield "It looks like the `AI_API_KEY` is not configured or is a placeholder.\n\n"
                yield "**Here is the data context retrieved from the database:**\n\n"
                yield f"```json\n{context[:500]}...\n```\n\n"
                yield "To enable real AI answers, please configure `AI_API_KEY` and `AI_PROVIDER` in your `backend/.env` file."
        return DummyProvider()

    if provider_name == "gemini":
        return GeminiProvider(api_key, model_name)
    elif provider_name == "openai":
        return OpenAIProvider(api_key, model_name)
    else:
        raise ValueError(f"Unsupported AI provider: {provider_name}")


# ── Intent Detector & Context Builder ────────────────────────────────────────

class QueryIntent:
    def __init__(self, vessel_id: Optional[int] = None, start_date: Optional[datetime.date] = None, end_date: Optional[datetime.date] = None, tools: List[str] = None):
        self.vessel_id = vessel_id
        self.start_date = start_date
        self.end_date = end_date
        self.tools = tools or []


def detect_intent(db: Session, message: str, session_vessel_id: Optional[int] = None) -> QueryIntent:
    """
    Parses user message to extract:
    - vessel_id (falls back to session_vessel_id or the first vessel in the DB)
    - date range (start_date, end_date)
    - list of data tools to execute
    """
    text = message.lower()
    
    # 1. Detect Vessel
    vessel_id = session_vessel_id
    if not vessel_id:
        vessels = db.query(Vessel).all()
        # Look for vessel name matches
        for v in vessels:
            if v.vessel_name.lower() in text:
                vessel_id = v.id
                break
        # Fallback to first vessel if none detected
        if not vessel_id and vessels:
            vessel_id = vessels[0].id

    # 2. Detect Date Range
    start_date, end_date = None, None
    
    # Get available date bounds for the vessel to contextualize relative date queries
    if vessel_id:
        reports = load_reports_for_vessel(db, vessel_id)
        if reports:
            min_db_date = reports[0].report_date
            max_db_date = reports[-1].report_date
            
            # Simple month name parser (e.g., "April", "in July")
            months = {
                "january": 1, "jan": 1, "february": 2, "feb": 2, "march": 3, "mar": 3,
                "april": 4, "apr": 4, "may": 5, "june": 6, "jun": 6, "july": 7, "jul": 7,
                "august": 8, "aug": 8, "september": 9, "sep": 9, "sept": 9,
                "october": 10, "oct": 10, "november": 11, "nov": 11, "december": 12, "dec": 12
            }
            
            detected_month = None
            for m_name, m_val in months.items():
                # Word boundary match for month names
                if re.search(r'\b' + m_name + r'\b', text):
                    detected_month = m_val
                    break
            
            if detected_month:
                # Find appropriate year: match within database report dates range
                year = max_db_date.year
                if min_db_date.year != max_db_date.year:
                    # If DB spans multiple years, check if user specified a year
                    year_match = re.search(r'\b(20\d{2})\b', text)
                    if year_match:
                        year = int(year_match.group(1))
                
                # Set bounds to start and end of that month
                start_date = datetime.date(year, detected_month, 1)
                if detected_month == 12:
                    end_date = datetime.date(year + 1, 1, 1) - datetime.timedelta(days=1)
                else:
                    end_date = datetime.date(year, detected_month + 1, 1) - datetime.timedelta(days=1)
            
            # Match "last week" / "past week"
            elif "last week" in text or "past week" in text:
                end_date = max_db_date
                start_date = max_db_date - datetime.timedelta(days=7)
                
            # Match "last 15 days" / "past 15 days"
            elif "15 days" in text:
                end_date = max_db_date
                start_date = max_db_date - datetime.timedelta(days=15)

            # Default to full date range of DB if none specified
            else:
                start_date = min_db_date
                end_date = max_db_date

    # 3. Detect Metrics / Select Tools
    tools = []
    
    # Define keywords maps
    keyword_tool_map = {
        "fuel": ["fuel_analytics", "rob_analytics"],
        "lsfo": ["fuel_analytics", "rob_analytics"],
        "hsfo": ["fuel_analytics", "rob_analytics"],
        "mgo": ["fuel_analytics", "rob_analytics"],
        "bunker": ["fuel_analytics", "rob_analytics"],
        "rob": ["rob_analytics"],
        "weather": ["weather_analytics"],
        "wind": ["weather_analytics"],
        "beaufort": ["weather_analytics"],
        "speed": ["voyage_summary"],
        "rpm": ["voyage_summary"],
        "distance": ["voyage_summary"],
        "slip": ["voyage_summary"],
        "steaming": ["voyage_summary"],
        "insight": ["operational_insights"],
        "anomaly": ["operational_insights"],
        "warning": ["operational_insights"],
        "timeline": ["operational_timeline"],
        "events": ["operational_timeline"],
        "recent": ["recent_reports"],
        "report": ["recent_reports"],
        "noon": ["recent_reports"],
    }
    
    for keyword, tool_names in keyword_tool_map.items():
        if keyword in text:
            for t in tool_names:
                if t not in tools:
                    tools.append(t)
                    
    # If no specific tools selected, load general summaries
    if not tools:
        tools = ["vessel_summary", "voyage_summary", "fuel_analytics", "operational_insights"]

    # Always include vessel_summary to provide name/context
    if "vessel_summary" not in tools:
        tools.insert(0, "vessel_summary")

    return QueryIntent(vessel_id=vessel_id, start_date=start_date, end_date=end_date, tools=tools)


def build_data_context(db: Session, intent: QueryIntent) -> str:
    """
    Executes selected tools and formats results as a structured JSON/markdown context block.
    """
    if not intent.vessel_id:
        return "No vessel data found in the system database."

    context_parts = []
    
    # Include metadata about the query bounds
    meta_info = {
        "vessel_id": intent.vessel_id,
        "query_start_date": intent.start_date.isoformat() if intent.start_date else None,
        "query_end_date": intent.end_date.isoformat() if intent.end_date else None,
        "metrics_retrieved": intent.tools
    }
    context_parts.append(f"## metadata_info\n{json.dumps(meta_info, indent=2)}")

    for tool_name in intent.tools:
        if tool_name in TOOL_REGISTRY:
            tool_fn = TOOL_REGISTRY[tool_name]
            try:
                # Call tool with DB and bounds
                data = tool_fn(db, intent.vessel_id, intent.start_date, intent.end_date)
                context_parts.append(f"## {tool_name}\n{json.dumps(data, indent=2)}")
            except Exception as e:
                context_parts.append(f"## {tool_name}\n{{\"error\": \"Failed to retrieve data: {str(e)}\"}}")

    return "\n\n".join(context_parts)


# ── System Prompt ────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are VPRO AI, a maritime operations assistant for the Vessel Performance & Route Optimization platform (VPRO).
You analyze structured vessel operational data including daily noon reports, fuel consumption, weather conditions, and voyage performance metrics.

Rules:
1. ONLY reference data provided in the CURRENT DATABASE DATA CONTEXT. Never hallucinate values or make up reports.
2. Use correct maritime terminology (e.g., Beaufort scale/Bf, LSFO/HSFO/MGO fuel types, ROB (Remaining On Board), NM (Nautical Miles), MT (Metric Tons)).
3. Always explain your calculations clearly when answering.
4. When citing metrics (e.g., average speed or total fuel), specify the date range/period the reports cover.
5. If the requested data does not exist in the context, clearly state that it is unavailable. Do not attempt to guess.
6. Return your responses in clean Markdown format. You can use Markdown tables for comparisons.
"""
