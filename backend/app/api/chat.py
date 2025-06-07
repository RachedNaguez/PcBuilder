from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
import uuid
from app.core.pc_builder import get_pc_builder_instance

router = APIRouter()


class ChatMessage(BaseModel):
    text: str
    isBot: bool = False


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    mode: str = "discuss"  # "discuss" or "build"


class ChatResponse(BaseModel):
    content: str
    type: str  # e.g., "text", "build", "component_added", etc.
    data: Optional[Dict[str, Any]] = None
    session_id: str


@router.post("/message", response_model=ChatResponse)
async def process_message(request: ChatRequest):
    pc_builder = get_pc_builder_instance()
    session_id = request.session_id if request.session_id else uuid.uuid4().hex

    try:
        if request.mode == "build":
            # Extract budget from message if specified
            import re
            budget_match = re.search(
                r'\$(\d{3,4})|(\d{3,4})\s*\$', request.message)
            budget = 1300  # Default budget if not specified
            if budget_match:
                budget_str = budget_match.group(1) or budget_match.group(2)
                if budget_str:
                    budget = int(budget_str)

            # Use the optimizer with the extracted or default budget
            preferences = {"usage": "general", "priority": {}}
            build = pc_builder.budget_optimizer.optimize_build(
                budget=budget, preferences=preferences)

            # Format the build response
            components = {}
            for component_type, component_info in build.components.items():
                components[component_type] = component_info

            build_json = {
                "components": components,
                "total_price": build.total_price,
                "requested_budget": budget
            }
            return ChatResponse(
                content="Here is your PC build!",
                type="build",
                data=build_json,
                session_id=session_id
            )
        else:
            # Default: discuss/chat mode
            answer = pc_builder.get_answer(
                request.message, session_id=session_id)
            if isinstance(answer, dict) and 'components' in answer:
                return ChatResponse(
                    content="Here is your PC build!",
                    type="build",
                    data=answer,
                    session_id=session_id
                )
            else:
                return ChatResponse(
                    content=answer if isinstance(answer, str) else str(answer),
                    type="text",
                    data=None,
                    session_id=session_id
                )
    except Exception as e:
        print(f"Error processing message (session: {session_id}): {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {e}")
