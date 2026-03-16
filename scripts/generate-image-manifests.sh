#!/usr/bin/env sh
set -eu

project_root="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"

write_manifest() {
  folder="$1"
  alt_text="$2"
  output="$3"
  var_name="$4"
  temp_file="$(mktemp)"

  find "$folder" -maxdepth 1 -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.webp' \) | sort > "$temp_file"

  printf 'window.%s = [\n' "$var_name" > "$output"
  first=true

  while IFS= read -r file; do
    relative_path="${file#"$project_root"/}"

    if [ "$first" = true ]; then
      first=false
    else
      printf ',\n' >> "$output"
    fi

    printf '  { src: "%s", alt: "%s" }' "$relative_path" "$alt_text" >> "$output"
  done < "$temp_file"

  printf '\n];\n' >> "$output"
  rm -f "$temp_file"
}

write_manifest "$project_root/images/home-slider" "GoldMonkVisuals coverage from DY Patil T20 League" "$project_root/images/home-slider/manifest.js" "HOME_SLIDER_IMAGES"
write_manifest "$project_root/images/footer-gallery" "GoldMonkVisuals sports photography preview" "$project_root/images/footer-gallery/manifest.js" "FOOTER_GALLERY_IMAGES"
