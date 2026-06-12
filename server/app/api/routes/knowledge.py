
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.database import get_db
from app.db.models import GjbRule, TermBase
from app.schemas import GjbRuleCreate, GjbRuleSchema, TermCreate, TermSchema
from typing import List

router = APIRouter()

# Rules CRUD
@router.get("/rules", response_model=List[GjbRuleSchema])
async def list_rules(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(GjbRule))
    return result.scalars().all()

@router.post("/rules", response_model=GjbRuleSchema)
async def create_rule(rule: GjbRuleCreate, db: AsyncSession = Depends(get_db)):
    db_rule = GjbRule(**rule.dict())
    db.add(db_rule)
    await db.commit()
    await db.refresh(db_rule)
    return db_rule

@router.put("/rules/{id}", response_model=GjbRuleSchema)
async def update_rule(id: int, rule_update: GjbRuleCreate, db: AsyncSession = Depends(get_db)):
    db_rule = await db.get(GjbRule, id)
    if not db_rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    for key, value in rule_update.dict().items():
        setattr(db_rule, key, value)
    await db.commit()
    await db.refresh(db_rule)
    return db_rule

@router.delete("/rules/{id}")
async def delete_rule(id: int, db: AsyncSession = Depends(get_db)):
    db_rule = await db.get(GjbRule, id)
    if db_rule:
        await db.delete(db_rule)
        await db.commit()
    return {"success": True}

# Terms CRUD
@router.get("/terms", response_model=List[TermSchema])
async def list_terms(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TermBase))
    return result.scalars().all()

@router.post("/terms", response_model=TermSchema)
async def create_term(term: TermCreate, db: AsyncSession = Depends(get_db)):
    db_term = TermBase(**term.dict())
    db.add(db_term)
    await db.commit()
    await db.refresh(db_term)
    return db_term

@router.put("/terms/{id}", response_model=TermSchema)
async def update_term(id: int, term_update: TermCreate, db: AsyncSession = Depends(get_db)):
    db_term = await db.get(TermBase, id)
    if not db_term:
        raise HTTPException(status_code=404, detail="Term not found")
    for key, value in term_update.dict().items():
        setattr(db_term, key, value)
    await db.commit()
    await db.refresh(db_term)
    return db_term

@router.delete("/terms/{id}")
async def delete_term(id: int, db: AsyncSession = Depends(get_db)):
    db_term = await db.get(TermBase, id)
    if db_term:
        await db.delete(db_term)
        await db.commit()
    return {"success": True}
