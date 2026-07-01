FROM --platform=linux/amd64 ghcr.io/r-wasm/flang-wasm:v21.1.8 AS flang

RUN test -x /opt/flang/host/bin/flang \
    && test -f /opt/flang/wasm/lib/libFortranRuntime.a

FROM --platform=linux/amd64 emscripten/emsdk:5.0.7 AS builder

SHELL ["/bin/bash", "-c"]
ENV DEBIAN_FRONTEND=noninteractive

RUN ok=0; for i in $(seq 1 15); do \
      if apt-get -o Acquire::Retries=5 update \
         && apt-get -o Acquire::Retries=5 install -y --no-install-recommends \
              gcc g++ gfortran make autoconf automake libtool pkg-config \
              bison flex perl git rsync xz-utils file ca-certificates curl \
              zlib1g-dev libbz2-dev liblzma-dev libpcre2-dev libcurl4-openssl-dev \
              libreadline-dev gettext libicu-dev; \
      then ok=1; break; fi; \
      echo "apt attempt $i failed — retrying"; sleep 15; \
    done; \
    [ "$ok" = 1 ] && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=flang /opt/flang /opt/flang
COPY scripts/emflang /usr/local/bin/emflang
RUN chmod +x /usr/local/bin/emflang
ENV FLANG=/opt/flang/host/bin/flang
ENV FORTRAN_RT=/opt/flang/wasm/lib/libFortranRuntime.a

ENV PREFIX=/opt
ENV EM_PKG_CONFIG_PATH=${PREFIX}/lib/pkgconfig
ENV CFLAGS="-O2"
ENV CXXFLAGS="-O2 -fexceptions"

WORKDIR /src

ARG PCRE2_VERSION=10.45
ADD https://github.com/PCRE2Project/pcre2/releases/download/pcre2-${PCRE2_VERSION}/pcre2-${PCRE2_VERSION}.tar.gz pcre2.tar.gz
RUN echo "0e138387df7835d7403b8351e2226c1377da804e0737db0e071b48f07c9d12ee  pcre2.tar.gz" | sha256sum -c - \
    && tar -xzf pcre2.tar.gz && rm pcre2.tar.gz && cd pcre2-${PCRE2_VERSION} \
    && emconfigure ./configure --host=wasm32-unknown-emscripten --prefix=${PREFIX} \
        --disable-shared --enable-static --disable-jit --enable-pcre2-8 \
    && emmake make -j"$(nproc)" install

ARG ZLIB_VERSION=1.3.1
ADD https://github.com/madler/zlib/releases/download/v${ZLIB_VERSION}/zlib-${ZLIB_VERSION}.tar.gz zlib.tar.gz
RUN echo "9a93b2b7dfdac77ceba5a558a580e74667dd6fede4585b91eefb60f03b72df23  zlib.tar.gz" | sha256sum -c - \
    && tar -xzf zlib.tar.gz && rm zlib.tar.gz && cd zlib-${ZLIB_VERSION} \
    && emconfigure ./configure --prefix=${PREFIX} --static \
    && emmake make -j"$(nproc)" install

ARG BZIP2_VERSION=1.0.8
ADD https://sourceware.org/pub/bzip2/bzip2-${BZIP2_VERSION}.tar.gz bzip2.tar.gz
RUN echo "ab5a03176ee106d3f0fa90e381da478ddae405918153cca248e682cd0c4a2269  bzip2.tar.gz" | sha256sum -c - \
    && tar -xzf bzip2.tar.gz && rm bzip2.tar.gz && cd bzip2-${BZIP2_VERSION} \
    && emmake make -j"$(nproc)" libbz2.a CC=emcc AR=emar RANLIB=emranlib \
    && cp libbz2.a ${PREFIX}/lib/ && cp bzlib.h ${PREFIX}/include/

ARG XZ_VERSION=5.6.4
ADD https://github.com/tukaani-project/xz/releases/download/v${XZ_VERSION}/xz-${XZ_VERSION}.tar.gz xz.tar.gz
RUN echo "269e3f2e512cbd3314849982014dc199a7b2148cf5c91cedc6db629acdf5e09b  xz.tar.gz" | sha256sum -c - \
    && tar -xzf xz.tar.gz && rm xz.tar.gz && cd xz-${XZ_VERSION} \
    && emconfigure ./configure --host=wasm32-unknown-emscripten --prefix=${PREFIX} \
        --disable-shared --enable-static --disable-xz --disable-xzdec \
        --disable-lzmadec --disable-lzmainfo --disable-scripts --disable-doc \
        --disable-nls --disable-threads \
    && emmake make -j"$(nproc)" install

ARG CURL_VERSION=8.20.0
ADD https://curl.se/download/curl-${CURL_VERSION}.tar.gz curl.tar.gz
RUN echo "fc5819cad3f9f5482669adcdc49a782c15f36d2a0715b395b06d9173593d2dc0  curl.tar.gz" | sha256sum -c - \
    && tar -xzf curl.tar.gz && rm curl.tar.gz && cd curl-${CURL_VERSION} \
    && emconfigure ./configure --host=wasm32-unknown-emscripten --prefix=${PREFIX} \
        --disable-shared --enable-static --disable-manual \
        --without-ssl --without-libpsl --without-libidn2 --without-nghttp2 \
        --without-brotli --without-zstd --disable-ldap --disable-ldaps \
        --disable-threaded-resolver \
    && emmake make -j"$(nproc)" install

ARG VERSION=4.6.0
ENV VERSION=${VERSION}
ADD https://cran.r-project.org/src/base/R-4/R-${VERSION}.tar.gz R.tar.gz
RUN echo "b8dc9b4543660c7b596b87938df532394350360976527d344228ee0ed12e45ec  R.tar.gz" | sha256sum -c - \
    && tar -xzf R.tar.gz && rm R.tar.gz

RUN cp -a R-${VERSION} R-native && cd R-native \
    && export PKG_CONFIG_PATH= \
    && ./configure --prefix=${PREFIX}/R-host \
        --without-x --with-readline --with-libcurl --disable-java \
        --with-recommended-packages=yes \
       || { echo "=== native R configure FAILED ==="; tail -n 80 config.log; exit 1; } \
    && make -j"$(nproc)" && make install
ENV R_HOST=${PREFIX}/R-host

WORKDIR /src/R-${VERSION}
COPY js ./js

RUN sed -i 's|if test "x${r_cv_have_curl_https}" = xno; then|if false; then|' configure \
    && ! grep -q 'r_cv_have_curl_https" = xno; then' configure

RUN sed -i 's|Rshlibpath_var=${shlibpath_var}$|Rshlibpath_var=${shlibpath_var:-LD_LIBRARY_PATH}|' configure \
    && grep -q 'shlibpath_var:-LD_LIBRARY_PATH' configure

RUN sed -i 's/^\(SUBDIRS = .*\) library$/\1/' src/Makefile.in \
    && ! grep -qE '^SUBDIRS = .* library' src/Makefile.in

RUN sed -i 's/^R_binary = R\.bin$/R_binary = R.mjs/' src/main/Makefile.in \
    && grep -q '^R_binary = R.mjs' src/main/Makefile.in

ENV R_MAIN_LDFLAGS="\
    -s ASSERTIONS=1 \
    --post-js /src/R-${VERSION}/js/post.js \
    --js-library /src/R-${VERSION}/js/syscalls.js \
    -s WASM_BIGINT=1 \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s INITIAL_MEMORY=134217728 \
    -s STACK_SIZE=8388608 \
    -s EXIT_RUNTIME=1 \
    -s FORCE_FILESYSTEM=1 \
    -s ERROR_ON_UNDEFINED_SYMBOLS=0 \
    -s EXPORTED_RUNTIME_METHODS=callMain,FS,NODEFS,WORKERFS,ENV \
    -s INCOMING_MODULE_JS_API=arguments,noInitialRun,noFSInit,wasmBinary,locateFile,preRun,postRun,instantiateWasm,print,printErr,onExit,onAbort \
    -s INVOKE_RUN=0 \
    -s MODULARIZE=1 \
    -s EXPORT_ES6=1 \
    -lnodefs.js -lworkerfs.js \
"

RUN export PATH="${PREFIX}/bin:${PATH}" \
        FC=emflang F77=emflang \
        EMCONFIGURE_JS=0 \
        CPPFLAGS="-I${PREFIX}/include" \
        LDFLAGS="-L${PREFIX}/lib" \
        FLIBS="-L/opt/flang/wasm/lib -lFortranRuntime" \
        r_cv_prog_fc_cc_compat=yes \
        r_cv_working_mktime=yes \
    && emconfigure ./configure \
        --host=wasm32-unknown-emscripten \
        --prefix=${PREFIX}/R-wasm \
        --with-readline=no --with-x=no --with-aqua=no --with-tcltk=no \
        --with-recommended-packages=no --disable-openmp --disable-nls \
        --enable-R-static-lib --disable-BLAS-shlib \
       || { echo "=== wasm R configure FAILED — config.log tail ==="; \
            tail -n 150 config.log; exit 1; }

RUN cd src && emmake make -j"$(nproc)" \
        LDFLAGS="-L${PREFIX}/lib -L/opt/flang/wasm/lib" \
        MAIN_LDFLAGS="${R_MAIN_LDFLAGS}" \
       || { echo "=== wasm R make FAILED ==="; exit 1; }

RUN mkdir -p /dist \
    && cp src/main/R.mjs  /dist/R.mjs \
    && cp src/main/R.wasm /dist/R.wasm \
    && [ "$(head -c4 /dist/R.wasm | od -An -tx1 | tr -d ' \n')" = "0061736d" ] \
    && [ "$(stat -c%s /dist/R.wasm)" -gt 1048576 ] \
    && tar -cf /dist/R-runtime.tar -C ${R_HOST}/lib/R library etc share \
    && ls -la /dist

FROM scratch AS exportor
COPY --from=builder /dist /dist
