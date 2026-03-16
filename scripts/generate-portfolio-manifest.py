#!/usr/bin/env python3

import base64
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request


PROJECT_ROOT = "/Users/avtrix/Projects/photography-portfolio"
OUTPUT_PATH = os.path.join(PROJECT_ROOT, "js", "portfolio-media.js")
DEFAULT_ROOT_FOLDER = "Portfolio Images"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".avif"}


def slugify(value):
    lowered = value.strip().lower()
    normalized = re.sub(r"[^a-z0-9]+", "-", lowered)
    return normalized.strip("-") or "portfolio-section"


def build_request(url, api_key, api_secret, method="GET", payload=None):
    token = base64.b64encode(f"{api_key}:{api_secret}".encode("utf-8")).decode("utf-8")
    headers = {
        "Authorization": f"Basic {token}",
    }

    if payload is not None:
        payload_bytes = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"
    else:
        payload_bytes = None

    return urllib.request.Request(url, data=payload_bytes, headers=headers, method=method)


def fetch_json(request):
    with urllib.request.urlopen(request) as response:
        return json.loads(response.read().decode("utf-8"))


def list_subfolders(cloud_name, api_key, api_secret, root_folder):
    encoded_folder = urllib.parse.quote(root_folder, safe="")
    url = f"https://api.cloudinary.com/v1_1/{cloud_name}/folders/{encoded_folder}"
    request = build_request(url, api_key, api_secret)
    payload = fetch_json(request)

    folders = payload.get("folders", [])
    return [
        {
            "name": folder["name"],
            "path": folder["path"],
        }
        for folder in folders
    ]


def list_all_assets(cloud_name, api_key, api_secret):
    url = f"https://api.cloudinary.com/v1_1/{cloud_name}/resources/image/upload"
    next_cursor = None
    resources = []

    while True:
        query = {
            "max_results": 100,
        }

        if next_cursor:
            query["next_cursor"] = next_cursor

        request = build_request(f"{url}?{urllib.parse.urlencode(query)}", api_key, api_secret)
        response = fetch_json(request)
        resources.extend(response.get("resources", []))
        next_cursor = response.get("next_cursor")

        if not next_cursor:
            break

    return filter_resources(resources)


def search_assets(cloud_name, api_key, api_secret, folder_path):
    url = f"https://api.cloudinary.com/v1_1/{cloud_name}/resources/by_asset_folder"
    next_cursor = None
    resources = []

    while True:
        query = {
            "asset_folder": folder_path,
            "max_results": 100,
        }

        if next_cursor:
            query["next_cursor"] = next_cursor

        request = build_request(f"{url}?{urllib.parse.urlencode(query)}", api_key, api_secret)
        response = fetch_json(request)
        resources.extend(response.get("resources", []))
        next_cursor = response.get("next_cursor")

        if not next_cursor:
            break

    return filter_resources(resources)


def search_assets_fallback(cloud_name, api_key, api_secret, folder_path):
    url = f"https://api.cloudinary.com/v1_1/{cloud_name}/resources/search"
    expression = f'asset_folder="{folder_path}" AND resource_type="image"'
    next_cursor = None
    resources = []

    while True:
        payload = {
            "expression": expression,
            "sort_by": [{"public_id": "asc"}],
            "max_results": 100,
        }

        if next_cursor:
            payload["next_cursor"] = next_cursor

        request = build_request(url, api_key, api_secret, method="POST", payload=payload)
        response = fetch_json(request)
        resources.extend(response.get("resources", []))
        next_cursor = response.get("next_cursor")

        if not next_cursor:
            break

    return filter_resources(resources)


def filter_resources(resources):
    valid_resources = []

    for item in resources:
        public_id = item.get("public_id", "")
        fmt = f".{item.get('format', '').lower()}" if item.get("format") else ""
        if not public_id:
            continue
        if fmt and fmt not in ALLOWED_EXTENSIONS:
            continue
        valid_resources.append(item)

    return valid_resources


def build_sections_from_assets(root_folder, resources):
    grouped = {}
    prefix = f"{root_folder}/"

    for item in resources:
        asset_folder = item.get("asset_folder") or ""

        if not asset_folder.startswith(prefix):
            continue

        remainder = asset_folder[len(prefix):]
        if not remainder:
            continue

        section_name = remainder.split("/", 1)[0]
        grouped.setdefault(section_name, []).append(item)

    sections = []

    for title in sorted(grouped.keys(), key=lambda value: value.lower()):
        images = [
            {
                "public_id": item["public_id"],
                "alt": f"GoldMonkVisuals sports portfolio image from {title}",
            }
            for item in sorted(grouped[title], key=lambda asset: asset.get("public_id", ""))
        ]

        sections.append({
            "title": title,
            "slug": slugify(title),
            "images": images,
        })

    return sections


def build_cloudinary_url(cloud_name, public_id, width):
    encoded_public_id = "/".join(urllib.parse.quote(segment, safe="") for segment in public_id.split("/"))
    return f"https://res.cloudinary.com/{cloud_name}/image/upload/f_auto,q_auto,w_{width}/{encoded_public_id}"


def build_manifest(cloud_name, sections):
    first_image = None

    for section in sections:
        if section["images"]:
            first_image = section["images"][0]
            break

    hero_src = build_cloudinary_url(cloud_name, first_image["public_id"], 1800) if first_image else "images/Portfolio/Sports/GOLD0062.jpg"

    manifest = {
        "hero": {
            "src": hero_src,
            "alt": "GoldMonkVisuals sports portfolio hero image",
        },
        "sections": [],
    }

    for section in sections:
        manifest["sections"].append({
            "title": section["title"],
            "slug": section["slug"],
            "images": [
                {
                    "src": build_cloudinary_url(cloud_name, image["public_id"], 1600),
                    "alt": image["alt"],
                }
                for image in section["images"]
            ],
        })

    return manifest


def write_manifest(manifest):
    content = "(function () {\n"
    content += "  window.PORTFOLIO_MEDIA = "
    content += json.dumps(manifest, indent=2)
    content += ";\n})();\n"

    with open(OUTPUT_PATH, "w", encoding="utf-8") as output_file:
        output_file.write(content)


def main():
    cloud_name = os.environ.get("CLOUDINARY_CLOUD_NAME")
    api_key = os.environ.get("CLOUDINARY_API_KEY")
    api_secret = os.environ.get("CLOUDINARY_API_SECRET")
    root_folder = os.environ.get("CLOUDINARY_PORTFOLIO_ROOT", DEFAULT_ROOT_FOLDER)
    debug = os.environ.get("CLOUDINARY_DEBUG") == "1"

    if not cloud_name or not api_key or not api_secret:
        print(
            "Missing Cloudinary credentials. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
            file=sys.stderr,
        )
        return 1

    try:
        subfolders = list_subfolders(cloud_name, api_key, api_secret, root_folder)
        all_assets = list_all_assets(cloud_name, api_key, api_secret)
        if debug:
            print(f"Root folder: {root_folder}")
            print(f"Subfolders found: {len(subfolders)}")
            for folder in subfolders:
                print(f"- {folder['path']}")
            print(f"Image assets scanned: {len(all_assets)}")
            matching_assets = [item for item in all_assets if (item.get('asset_folder') or '').startswith(f'{root_folder}/')]
            print(f"Assets under root: {len(matching_assets)}")
            for item in matching_assets[:10]:
                print(f"  {item.get('asset_folder')} -> {item.get('public_id')}")
            if not matching_assets:
                print("Sample asset folders from Cloudinary:")
                for item in all_assets[:20]:
                    print(f"  {item.get('asset_folder') or '[no asset_folder]'} -> {item.get('public_id')}")
        sections = build_sections_from_assets(root_folder, all_assets)

        manifest = build_manifest(cloud_name, sections)
        write_manifest(manifest)
        non_empty = [section for section in sections if section["images"]]
        print(f"Generated portfolio manifest with {len(non_empty)} populated section(s).")
        return 0
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        print(f"Cloudinary API error: {detail}", file=sys.stderr)
        return 1
    except urllib.error.URLError as error:
        print(f"Network error: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
