from typing import Any

from app.core.config import settings
from app.core.supabase_client import get_response_data, get_supabase_admin_client


PUBLIC_PROFILE_VISIBILITY = "Public"
MATCHES_ONLY_PROFILE_VISIBILITY = "Matches Only"
HIDDEN_PROFILE_VISIBILITY = "Hide From Everyone"


def normalize_profile_visibility_label(value: Any) -> str:
    if not isinstance(value, str):
        return PUBLIC_PROFILE_VISIBILITY

    normalized = value.strip().lower()
    if not normalized:
        return PUBLIC_PROFILE_VISIBILITY

    aliases = {
        "public": PUBLIC_PROFILE_VISIBILITY,
        "anyone": PUBLIC_PROFILE_VISIBILITY,
        "everyone": PUBLIC_PROFILE_VISIBILITY,
        "matches only": MATCHES_ONLY_PROFILE_VISIBILITY,
        "match only": MATCHES_ONLY_PROFILE_VISIBILITY,
        "only matches": MATCHES_ONLY_PROFILE_VISIBILITY,
        "only match": MATCHES_ONLY_PROFILE_VISIBILITY,
        "matched only": MATCHES_ONLY_PROFILE_VISIBILITY,
        "hide from everyone": HIDDEN_PROFILE_VISIBILITY,
        "hidden": HIDDEN_PROFILE_VISIBILITY,
        "hide profile": HIDDEN_PROFILE_VISIBILITY,
        "hide": HIDDEN_PROFILE_VISIBILITY,
        "don't show anyone": HIDDEN_PROFILE_VISIBILITY,
        "dont show anyone": HIDDEN_PROFILE_VISIBILITY,
        "do not show anyone": HIDDEN_PROFILE_VISIBILITY,
        "show no one": HIDDEN_PROFILE_VISIBILITY,
        "nobody": HIDDEN_PROFILE_VISIBILITY,
        "no one": HIDDEN_PROFILE_VISIBILITY,
        "private": HIDDEN_PROFILE_VISIBILITY,
    }
    return aliases.get(normalized, PUBLIC_PROFILE_VISIBILITY)


def get_profile_visibility(profile_row: dict[str, Any] | None) -> str:
    profile_row = profile_row or {}
    return normalize_profile_visibility_label(profile_row.get("profile_visibility"))


def get_matched_profile_ids(user_id: str) -> set[str]:
    if not user_id:
        return set()

    response = (
        get_supabase_admin_client()
        .table(settings.matches_table)
        .select("user_one_id,user_two_id")
        .or_(f"user_one_id.eq.{user_id},user_two_id.eq.{user_id}")
        .execute()
    )
    rows = get_response_data(response) or []

    matched_ids: set[str] = set()
    for row in rows:
        if row.get("user_one_id") == user_id and row.get("user_two_id"):
            matched_ids.add(row["user_two_id"])
        elif row.get("user_two_id") == user_id and row.get("user_one_id"):
            matched_ids.add(row["user_one_id"])

    return matched_ids


def can_view_profile_photo(
    *,
    viewer_id: str,
    profile_row: dict[str, Any] | None,
    matched_profile_ids: set[str] | None = None,
) -> bool:
    if not viewer_id or not profile_row:
        return False

    profile_id = profile_row.get("id")
    if profile_id == viewer_id:
        return True

    visibility = get_profile_visibility(profile_row)
    if visibility == PUBLIC_PROFILE_VISIBILITY:
        return True

    if visibility == MATCHES_ONLY_PROFILE_VISIBILITY:
        if matched_profile_ids is None:
            matched_profile_ids = get_matched_profile_ids(viewer_id)
        return profile_id in matched_profile_ids

    return False


def annotate_profile_photo_visibility(
    *,
    viewer_id: str,
    profile_row: dict[str, Any] | None,
    matched_profile_ids: set[str] | None = None,
) -> dict[str, Any] | None:
    if not profile_row:
        return None

    annotated = dict(profile_row)
    annotated["profile_visibility"] = get_profile_visibility(profile_row)
    annotated["photo_blurred"] = not can_view_profile_photo(
        viewer_id=viewer_id,
        profile_row=profile_row,
        matched_profile_ids=matched_profile_ids,
    )
    return annotated


def annotate_profile_list_photo_visibility(
    *,
    viewer_id: str,
    profile_rows: list[dict[str, Any]],
    matched_profile_ids: set[str] | None = None,
) -> list[dict[str, Any]]:
    if not profile_rows:
        return []

    if matched_profile_ids is None and any(
        get_profile_visibility(row) == MATCHES_ONLY_PROFILE_VISIBILITY for row in profile_rows
    ):
        matched_profile_ids = get_matched_profile_ids(viewer_id)

    return [
        annotate_profile_photo_visibility(
            viewer_id=viewer_id,
            profile_row=row,
            matched_profile_ids=matched_profile_ids,
        )
        for row in profile_rows
        if row
    ]
