# Dependency check 2026-09-09

`npm audit` reports two high entries through PptxGenJS → image-size <=2.0.2 (ICNS/JXL/HEIF parser denial of service). Registry latest is 2.0.2 at inspection. Do not apply audit's downgrade to PptxGenJS 1.1.5. Imported images are restricted by PNG/JPEG signatures and a 12 MB size cap; only the bundled trusted icon catalog supplies SVG. Unsupported parsers are not deliberately exposed, but this is not a patched dependency or a general image sandbox. Do not import untrusted files. Recheck for a compatible patched release before production deployment.
