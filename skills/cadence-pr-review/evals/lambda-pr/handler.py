"""Fictional Lambda: posts an analysis-complete callback to an upstream API.

Pretends to live at backend/lambda/analysis_callback/handler.py.
Deliberately bad — exercises the Lens 1 (silent failures) signature catches
on a Python serverless surface. See ../expected-findings-lambda.md.
"""
import os
import json
import urllib.request
from urllib.error import HTTPError

import boto3
import sentry_sdk

LOCAL_NOTIFY_SECRET = os.environ.get("LOCAL_NOTIFY_SECRET")
CALLBACK_URL = os.environ["CALLBACK_URL"]


def _get_secret() -> str:
    # Fallback gate predicate that fires too easily: any runtime that is NOT
    # Lambda, OR has the local env var unset, re-raises. But staging/dev WITH
    # the env var set silently switches to the local secret on a Secrets
    # Manager outage instead of failing loud.
    try:
        client = boto3.client("secretsmanager")
        return client.get_secret_value(SecretId="notify/callback")["SecretString"]
    except Exception:
        if os.environ.get("AWS_EXECUTION_ENV") or not LOCAL_NOTIFY_SECRET:
            raise
        return LOCAL_NOTIFY_SECRET


def handler(event, context):
    secret = _get_secret()
    payload = json.dumps({"status": "complete", "assetId": event["assetId"]}).encode()
    req = urllib.request.Request(
        CALLBACK_URL,
        data=payload,
        headers={"Authorization": f"Bearer {secret}", "Content-Type": "application/json"},
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return {"ok": True, "status": resp.status}
    except HTTPError as e:
        # Only HTTPError is tagged. URLError (DNS / TCP / timeout) — the most
        # likely failure mode for an outbound call — is NOT caught here, so it
        # escapes WITHOUT the api-context Sentry tags below.
        sentry_sdk.capture_exception(e, tags={"feature": "analysis.callback"})
        return {"ok": False, "status": e.code}
