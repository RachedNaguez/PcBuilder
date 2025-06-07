from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.core.pc_builder import get_pc_builder_instance

router = APIRouter()


class ComponentFilter(BaseModel):
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    type: Optional[str] = None


class Component(BaseModel):
    name: str
    type: str
    price: float
    specs: Dict[str, Any]


@router.get("/types", response_model=List[str])
async def get_component_types():
    pc_builder = get_pc_builder_instance()
    return pc_builder.processor.get_all_component_types()


@router.get("/{component_type}", response_model=List[Component])
async def get_components(
    component_type: str,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None
):
    pc_builder = get_pc_builder_instance()

    # Create filters
    filters = {}
    if min_price is not None or max_price is not None:
        filters["price"] = {}
        if min_price is not None:
            filters["price"]["min"] = min_price
        if max_price is not None:
            filters["price"]["max"] = max_price

    # Get filtered components
    try:
        df = pc_builder.processor.filter_components(component_type, filters)

        # Convert to list of components
        components = []
        for _, row in df.iterrows():
            data = row.to_dict()
            price = data.pop("price", 0)
            name = data.pop("name", "Unknown Component")

            components.append(Component(
                name=name,
                type=component_type,
                price=price,
                specs=data
            ))

        return components
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
