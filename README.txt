r-wasm — Corresponding Source mirror
==================================================

This repository publishes the Corresponding Source for the WebAssembly
build of r (license: GPL-2.0-or-later) used in edgetools.io.

Contents
  build/      our build recipe: Dockerfile + helper scripts/config/patches.
              Rebuild with:  docker build build/
  upstream/   the exact upstream source archive(s) the build fetched,
              byte-identical and sha256-verified (see below).

Upstream sources:
  pcre2.tar.gz
    https://github.com/PCRE2Project/pcre2/releases/download/pcre2-10.45/pcre2-10.45.tar.gz
    sha256 0e138387df7835d7403b8351e2226c1377da804e0737db0e071b48f07c9d12ee
  zlib.tar.gz
    https://github.com/madler/zlib/releases/download/v1.3.1/zlib-1.3.1.tar.gz
    sha256 9a93b2b7dfdac77ceba5a558a580e74667dd6fede4585b91eefb60f03b72df23
  bzip2.tar.gz
    https://sourceware.org/pub/bzip2/bzip2-1.0.8.tar.gz
    sha256 ab5a03176ee106d3f0fa90e381da478ddae405918153cca248e682cd0c4a2269
  xz.tar.gz
    https://github.com/tukaani-project/xz/releases/download/v5.6.4/xz-5.6.4.tar.gz
    sha256 269e3f2e512cbd3314849982014dc199a7b2148cf5c91cedc6db629acdf5e09b
  curl.tar.gz
    https://curl.se/download/curl-8.20.0.tar.gz
    sha256 fc5819cad3f9f5482669adcdc49a782c15f36d2a0715b395b06d9173593d2dc0
  R.tar.gz
    https://cran.r-project.org/src/base/R-4/R-4.6.0.tar.gz
    sha256 b8dc9b4543660c7b596b87938df532394350360976527d344228ee0ed12e45ec
