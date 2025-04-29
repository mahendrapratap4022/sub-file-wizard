function getFont(langCode) {
  const fontMap = {
    // Chinese
    zh: "/fonts/NotoSansSC-Regular.otf",
    yue: "/fonts/NotoSansSC-Regular.otf",
    wuu: "/fonts/NotoSansSC-Regular.otf",
    cjy: "/fonts/NotoSansSC-Regular.otf",
    nan: "/fonts/NotoSansSC-Regular.otf",
    hsn: "/fonts/NotoSansSC-Regular.otf",
    hak: "/fonts/NotoSansSC-Regular.otf",

    // Japanese, Korean
    ja: "/fonts/NotoSansJP-Regular.otf",
    ko: "/fonts/NotoSansKR-Regular.otf",

    // Devanagari scripts
    hi: "/fonts/NotoSansDevanagari-Regular.ttf",
    mr: "/fonts/NotoSansDevanagari-Regular.ttf",
    bho: "/fonts/NotoSansDevanagari-Regular.ttf",
    mai: "/fonts/NotoSansDevanagari-Regular.ttf",
    mag: "/fonts/NotoSansDevanagari-Regular.ttf",
    doi: "/fonts/NotoSansDevanagari-Regular.ttf",

    // Other Indic scripts
    gu: "/fonts/NotoSansGujarati-Regular.ttf",
    ta: "/fonts/NotoSansTamil-Regular.ttf",
    te: "/fonts/NotoSansTelugu-Regular.ttf",
    kn: "/fonts/NotoSansKannada-Regular.ttf",
    ml: "/fonts/NotoSansMalayalam-Regular.ttf",
    bn: "/fonts/NotoSansBengali-Regular.ttf",
    syl: "/fonts/NotoSansBengali-Regular.ttf",

    // Arabic scripts
    ur: "/fonts/NotoNaskhArabic-Regular.ttf",
    ar: "/fonts/NotoNaskhArabic-Regular.ttf",
    arz: "/fonts/NotoNaskhArabic-Regular.ttf",
    ps: "/fonts/NotoNaskhArabic-Regular.ttf",
    fa: "/fonts/NotoNaskhArabic-Regular.ttf",
    sd: "/fonts/NotoNaskhArabic-Regular.ttf",

    // Other scripts
    am: "/fonts/NotoSansEthiopic-Regular.ttf",
    ti: "/fonts/NotoSansEthiopic-Regular.ttf",
    my: "/fonts/NotoSansMyanmar-Regular.ttf",
    km: "/fonts/NotoSansKhmer-Regular.ttf",
    th: "/fonts/NotoSansThai-Regular.ttf",
    he: "/fonts/NotoSansHebrew-Regular.ttf",
    si: "/fonts/NotoSansSinhala-Regular.ttf",
  };

  return fontMap[langCode] || "/fonts/NotoSans-Regular.ttf";
}

export { getFont };
