from fastapi import APIRouter, HTTPException
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
import aiosqlite
from jose import JWTError, jwt
import os
from datetime import datetime, timedelta, timezone

from database import DB_PATH

router = APIRouter(prefix="/api/auth", tags=["auth"])

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET = os.getenv("APP_SECRET", "attrition-dev-secret-change-in-production")
ALGO = "HS256"
ACCESS_MINUTES = 60 * 24 * 7


class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    name: str | None = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


def _token(sub: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_MINUTES)
    return jwt.encode(
        {"sub": sub, "exp": exp},
        SECRET,
        algorithm=ALGO,
    )


@router.post("/register")
async def register(body: RegisterIn):
    email = body.email.strip().lower()
    h = pwd.hash(body.password)
    async with aiosqlite.connect(DB_PATH) as db:
        try:
            await db.execute(
                "INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)",
                (email, h, body.name or email.split("@")[0]),
            )
            await db.commit()
        except aiosqlite.IntegrityError:
            raise HTTPException(status_code=400, detail="Email already registered")
    return {"access_token": _token(email), "token_type": "bearer"}


@router.post("/login")
async def login(body: LoginIn):
    email = body.email.strip().lower()
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cur = await db.execute("SELECT * FROM users WHERE email = ?", (email,))
        row = await cur.fetchone()
    if not row or not pwd.verify(body.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"access_token": _token(email), "token_type": "bearer"}
