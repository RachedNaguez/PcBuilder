from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.core.pc_builder import get_pc_builder_instance

router = APIRouter()

class BuildRequest(BaseModel):
    budget: float
    usage: str = "general"  # gaming, work, content, general
    priorities: Dict[str, int] = {}

class BuildComponent(BaseModel):
    name: str
    type: str
    price: float
    specs: Dict[str, Any]

class BuildResponse(BaseModel):
    components: List[BuildComponent]
    total_price: float
    compatibility_issues: List[Dict[str, Any]] = []

@router.post("/optimize", response_model=BuildResponse)
async def optimize_build(request: BuildRequest):
    pc_builder = get_pc_builder_instance()
    
    try:
        # Create preferences dict
        preferences = {
            "usage": request.usage,
            "priority": request.priorities
        }
        
        # Optimize build
        build = pc_builder.budget_optimizer.optimize_build(request.budget, preferences)
        
        # Check compatibility
        compatibility_issues = pc_builder.compatibility_checker.check_build_compatibility(build)
        
        # Convert to response format
        components = []
        for component_type, component_info in build.components.items():
            # Extract specs (everything except name and price)
            specs = {k: v for k, v in component_info.items() if k not in ["name", "price"]}
            
            components.append(BuildComponent(
                name=component_info.get("name", "Unknown"),
                type=component_type,
                price=component_info.get("price", 0),
                specs=specs
            ))
        
        return BuildResponse(
            components=components,
            total_price=build.total_price,
            compatibility_issues=compatibility_issues
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/compatibility", response_model=List[Dict[str, Any]])
async def check_compatibility():
    pc_builder = get_pc_builder_instance()
    
    try:
        # Check compatibility of current build
        issues = pc_builder.compatibility_checker.check_build_compatibility(pc_builder.current_build)
        return issues
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))