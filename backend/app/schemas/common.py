"""
Общие схемы для API ответов
"""
from pydantic import BaseModel
from typing import List, TypeVar, Generic, Optional

T = TypeVar('T')


class PaginationMeta(BaseModel):
    """Метаданные пагинации"""
    total: int
    skip: int
    limit: int
    page: int
    total_pages: int


class PaginatedResponse(BaseModel, Generic[T]):
    """Стандартизированный ответ с пагинацией"""
    data: List[T]
    meta: PaginationMeta


class ErrorDetail(BaseModel):
    """Детали ошибки валидации"""
    loc: List[str | int]
    msg: str
    type: str


class ErrorResponse(BaseModel):
    """Стандартизированный ответ об ошибке"""
    detail: str | List[ErrorDetail]


class SuccessMessage(BaseModel):
    """Стандартизированное сообщение об успехе"""
    message: str
