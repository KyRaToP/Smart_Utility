from __future__ import annotations

import os
import secrets
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .auth import resolve_user
from .db import Store

PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(PROJECT_ROOT / ".env")

DB_PATH = Path(os.getenv("DATABASE_PATH", PROJECT_ROOT / "api" / "data" / "smart_utility.db"))
_store: Store | None = None


def get_store() -> Store:
    global _store
    if _store is None:
        _store = Store(DB_PATH)
    return _store

app = FastAPI(title="Smart_Utility API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def new_id(prefix: str) -> str:
    return f"{prefix}-{secrets.token_hex(4)}"


class ApartmentDraft(BaseModel):
    name: str
    rooms: str = ""
    areaM2: str = ""


class OnboardingPayload(BaseModel):
    apartments: list[ApartmentDraft]


class ActiveApartmentPayload(BaseModel):
    id: str


class ApartmentPatch(BaseModel):
    name: str
    rooms: str = ""
    areaM2: str = ""
    readingDueDay: str = "25"


class ReadingsPayload(BaseModel):
    month: str
    values: dict[str, float]


class CalculationPayload(BaseModel):
    month: str
    values: dict[str, float] = Field(default_factory=dict)


class PaidPayload(BaseModel):
    apartmentId: str
    month: str
    paidAt: str


class ServicePayload(BaseModel):
    name: str
    category: str = ""
    unit: str = "₽"
    tariff: str
    hasMeter: bool
    calcType: str


class NotificationsPayload(BaseModel):
    readingsEnabled: bool | None = None
    readingsDaysBefore: int | None = None
    paymentEnabled: bool | None = None
    paymentDaysBefore: int | None = None
    reportEnabled: bool | None = None
    reportDay: int | None = None


class BaselinePayload(BaseModel):
    month: str
    values: dict[str, float]
    markPaid: bool = True
    paidAt: str | None = None


def current_user(user: dict = Depends(resolve_user)) -> dict:
    get_store().ensure_user(user["telegram_id"], user["display_name"])
    return user


def state_for(user: dict) -> dict:
    return get_store().load_state(user["telegram_id"])


@app.get("/api/health")
def health() -> dict:
    return {"ok": True}


@app.get("/api/state")
def get_state(user: dict = Depends(current_user)) -> dict:
    return state_for(user)


@app.post("/api/onboarding")
def onboarding(payload: OnboardingPayload, user: dict = Depends(current_user)) -> dict:
    names = [item.name.strip() for item in payload.apartments]
    if len(names) != 3 or not all(names):
        raise HTTPException(status_code=400, detail="Need exactly 3 apartment names")
    get_store().complete_onboarding(
        user["telegram_id"],
        user["display_name"],
        [item.model_dump() for item in payload.apartments],
        new_id,
    )
    return state_for(user)


@app.post("/api/apartments/active")
def set_active(payload: ActiveApartmentPayload, user: dict = Depends(current_user)) -> dict:
    try:
        get_store().set_active_apartment(user["telegram_id"], payload.id)
    except PermissionError as error:
        raise HTTPException(status_code=403, detail=str(error)) from error
    return state_for(user)


@app.patch("/api/apartments/{apartment_id}")
def patch_apartment(
    apartment_id: str,
    payload: ApartmentPatch,
    user: dict = Depends(current_user),
) -> dict:
    try:
        get_store().update_apartment(user["telegram_id"], apartment_id, payload.model_dump())
    except PermissionError as error:
        raise HTTPException(status_code=403, detail=str(error)) from error
    return state_for(user)


@app.post("/api/services")
def add_service(payload: ServicePayload, user: dict = Depends(current_user)) -> dict:
    try:
        get_store().add_service(user["telegram_id"], payload.model_dump(), new_id)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return state_for(user)


@app.post("/api/readings")
def save_readings(payload: ReadingsPayload, user: dict = Depends(current_user)) -> dict:
    try:
        get_store().save_readings(user["telegram_id"], payload.month, payload.values, new_id)
    except PermissionError as error:
        raise HTTPException(status_code=403, detail=str(error)) from error
    return state_for(user)


@app.post("/api/baseline")
def save_baseline(payload: BaselinePayload, user: dict = Depends(current_user)) -> dict:
    """Save meter readings for an already-paid month (baseline for next month)."""
    if not payload.values:
        raise HTTPException(status_code=400, detail="Need at least one meter reading")
    try:
        get_store().save_baseline(
            user["telegram_id"],
            payload.month,
            payload.values,
            payload.markPaid,
            payload.paidAt,
            new_id,
        )
    except (PermissionError, ValueError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return state_for(user)


@app.post("/api/calculations")
def save_calculation(payload: CalculationPayload, user: dict = Depends(current_user)) -> dict:
    try:
        get_store().save_calculation(user["telegram_id"], payload.month, payload.values, new_id)
    except (PermissionError, ValueError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return state_for(user)


@app.post("/api/payments/paid")
def mark_paid(payload: PaidPayload, user: dict = Depends(current_user)) -> dict:
    try:
        get_store().mark_paid(user["telegram_id"], payload.apartmentId, payload.month, payload.paidAt)
    except PermissionError as error:
        raise HTTPException(status_code=403, detail=str(error)) from error
    return state_for(user)


@app.patch("/api/notifications")
def notifications(payload: NotificationsPayload, user: dict = Depends(current_user)) -> dict:
    patch = payload.model_dump(exclude_none=True)
    get_store().update_notifications(user["telegram_id"], patch)
    return state_for(user)
