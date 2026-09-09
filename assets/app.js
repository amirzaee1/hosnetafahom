(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const observed = new WeakSet();

  const chapterMeta = [
    {
      nav: "تصمیم",
      kicker: "فصل نخست · سازوکار انتخاب",
      description: "از نخستین برداشت تا لحظه‌ای که مخاطب خودش جزئیات را می‌خواهد.",
      image: "./assets/gates-v2.webp",
      alt: "پنج دروازه نورانی در مسیری تاریک، نماد مراحل تصمیم‌گیری"
    },
    {
      nav: "اعتماد",
      kicker: "فصل دوم · پشتِ مقاومت ذهن",
      description: "هشدار فروشنده را بشناس، از فیلترهای ناخودآگاه عبور کن و حسن تفاهم بساز.",
      image: "",
      alt: ""
    },
    {
      nav: "یخ‌شکن",
      kicker: "فصل سوم · آغاز هوشمندانه",
      description: "جمله‌ای کوتاه که فشار را حذف می‌کند و کنجکاوی را به حرکت درمی‌آورد.",
      image: "./assets/icebreaker-v2.webp",
      alt: "دیوار یخی که میان مربی و کارآموز شکسته و به پلی نورانی تبدیل می‌شود"
    },
    {
      nav: "جمع‌بندی",
      kicker: "پایان جلسه · شروع اجرا",
      description: "تمام اجزای گفت‌وگو در یک مسیر روشن کنار هم قرار می‌گیرند.",
      image: "",
      alt: ""
    }
  ];

  const lessonVisuals = Array.from({ length: 46 }, (_, index) => ({
    src: `./assets/lessons/lesson-${String(index + 1).padStart(2, "0")}.webp`
  }));

  const faNumber = (value) => String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[digit]);

  const escapeHTML = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const inlineMarkdown = (value) => escapeHTML(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");

  function cleanChapterTitle(rawTitle) {
    const parts = rawTitle.split(":");
    return parts.length > 1 ? parts.slice(1).join(":").trim() : rawTitle.trim();
  }

  function parseCourse(markdown) {
    const chapters = [];
    let chapter = null;
    let lesson = null;

    markdown.replace(/\r/g, "").split("\n").forEach((line) => {
      if (line.startsWith("## ")) {
        chapter = { title: line.slice(3).trim(), lessons: [] };
        chapters.push(chapter);
        lesson = null;
        return;
      }

      if (line.startsWith("### ")) {
        if (!chapter) return;
        lesson = { title: line.slice(4).trim(), lines: [] };
        chapter.lessons.push(lesson);
        return;
      }

      if (!chapter || /^#\s/.test(line)) return;

      if (!lesson) {
        lesson = {
          title: chapter.title.includes("پایان") ? "جمع‌بندی مربی و کارآموز" : "ورود به گفت‌وگو",
          lines: []
        };
        chapter.lessons.push(lesson);
      }

      lesson.lines.push(line);
    });

    return chapters.filter((item) => item.lessons.some((entry) => entry.lines.some((line) => line.trim())));
  }

  function renderDialogueChunk(chunk, state) {
    const lines = chunk.split("\n").map((line) => line.trim()).filter(Boolean);
    if (!lines.length || lines.every((line) => line === "---")) return "";

    const first = lines[0];
    const speakerMatch = first.match(/^\*\*(مربی|کارآموز):\*\*\s*(.*)$/);

    if (speakerMatch) {
      const speaker = speakerMatch[1];
      state.lastSpeaker = speaker;
      const body = [speakerMatch[2], ...lines.slice(1)].filter(Boolean).join(" ");
      const kind = speaker === "مربی" ? "mentor" : "trainee";
      const initial = speaker === "مربی" ? "م" : "ک";

      return `
        <div class="speech speech--${kind}">
          <div class="speaker-avatar" aria-hidden="true">${initial}</div>
          <div class="speech-bubble">
            <span class="speech-name">${speaker}</span>
            <p>${inlineMarkdown(body)}</p>
          </div>
        </div>`;
    }

    if (lines.every((line) => /^-\s+/.test(line))) {
      const items = lines.map((line) => `<li>${inlineMarkdown(line.replace(/^-\s+/, ""))}</li>`).join("");
      return `<div class="lesson-list"><ul>${items}</ul></div>`;
    }

    if (lines.every((line) => /^\d+\.\s+/.test(line))) {
      const items = lines.map((line) => `<li>${inlineMarkdown(line.replace(/^\d+\.\s+/, ""))}</li>`).join("");
      return `<div class="lesson-list"><ol>${items}</ol></div>`;
    }

    if (lines.every((line) => /^>\s?/.test(line))) {
      return `<blockquote class="lesson-quote">${inlineMarkdown(lines.map((line) => line.replace(/^>\s?/, "")).join(" "))}</blockquote>`;
    }

    const text = lines.filter((line) => line !== "---").join(" ");
    if (!text) return '<div class="lesson-divider" aria-hidden="true"></div>';
    return `<div class="lesson-note"><p>${inlineMarkdown(text)}</p></div>`;
  }

  function renderLesson(lesson, visualIndex) {
    const chunks = lesson.lines.join("\n").split(/\n\s*\n/);
    const state = { lastSpeaker: null };
    const body = chunks.map((chunk) => renderDialogueChunk(chunk, state)).join("");
    const visual = lessonVisuals[visualIndex] || lessonVisuals[lessonVisuals.length - 1];

    return `
      <article class="lesson">
        <header class="lesson-heading reveal">
          <span>مربی × کارآموز</span>
          <h3>${escapeHTML(lesson.title)}</h3>
          <figure class="lesson-visual" data-visual-index="${visualIndex}">
            <div class="lesson-visual-frame">
              <img src="${visual.src}" alt="${escapeHTML(`تصویر مفهومی اختصاصی درس «${lesson.title}»`)}" loading="lazy">
            </div>
          </figure>
        </header>
        <div class="dialogue-flow">${body}</div>
      </article>`;
  }

  function renderCourse(chapters) {
    const content = $("#courseContent");
    const nav = $("#chapterNav");
    let visualIndex = 0;

    content.innerHTML = chapters.map((chapter, index) => {
      const meta = chapterMeta[index] || chapterMeta[chapterMeta.length - 1];
      const title = cleanChapterTitle(chapter.title);
      const image = meta.image
        ? `<figure class="chapter-image"><img src="${meta.image}" alt="${escapeHTML(meta.alt)}" loading="lazy"></figure>`
        : "";

      return `
        <section class="chapter-block" id="chapter-${index + 1}" data-chapter-name="${escapeHTML(meta.nav)}">
          <header class="chapter-intro reveal ${meta.image ? "" : "no-image"}">
            ${image}
            <div class="chapter-copy">
              <span class="chapter-kicker">${escapeHTML(meta.kicker)}</span>
              <h2>${escapeHTML(title)}</h2>
              <p>${escapeHTML(meta.description)}</p>
            </div>
          </header>
          <div class="lessons">
            ${chapter.lessons.map((lesson) => renderLesson(lesson, visualIndex++)).join("")}
          </div>
        </section>`;
    }).join("");

    nav.innerHTML = chapters.map((chapter, index) => {
      const meta = chapterMeta[index] || chapterMeta[chapterMeta.length - 1];
      return `<button type="button" data-jump="chapter-${index + 1}">${escapeHTML(meta.nav)}</button>`;
    }).join("");

    $("#courseLoading").classList.add("is-hidden");
    observeReveals();
    observeLessonVisuals();
    observeChapters();
  }

  function observeLessonVisuals() {
    const visuals = $$(".lesson-visual");

    if (reducedMotion || !("IntersectionObserver" in window)) {
      visuals.forEach((visual) => visual.classList.add("is-in-view"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("is-in-view", entry.isIntersecting && entry.intersectionRatio >= 0.12);
      });
    }, { threshold: [0, 0.12, 0.35, 0.7], rootMargin: "-8% 0px -8% 0px" });

    visuals.forEach((visual) => observer.observe(visual));
  }

  function observeReveals() {
    const targets = $$(".reveal, .lesson .speech, .lesson .lesson-note, .lesson .lesson-list, .lesson .lesson-quote");

    if (reducedMotion || !("IntersectionObserver" in window)) {
      targets.forEach((target) => target.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle(
          "is-visible",
          entry.isIntersecting && entry.intersectionRatio >= 0.1
        );
      });
    }, { threshold: [0, 0.1, 0.35], rootMargin: "-7% 0px -7% 0px" });

    targets.forEach((target, index) => {
      if (observed.has(target)) return;
      observed.add(target);
      if (target.matches(".speech, .lesson-note, .lesson-list, .lesson-quote")) {
        target.style.transitionDelay = `${Math.min(index % 3, 2) * 55}ms`;
      }
      observer.observe(target);
    });
  }

  function observeChapters() {
    const sections = [$(".hero"), ...$$(".chapter-intro")].filter(Boolean);
    const status = $("#chapterStatus strong");
    const navButtons = $$("#chapterNav button");

    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;
      const section = visible.target.closest("[data-chapter-name]") || visible.target;
      const name = section.dataset.chapterName || "آغاز";
      status.textContent = name;
      navButtons.forEach((button) => {
        const target = document.getElementById(button.dataset.jump);
        button.classList.toggle("is-active", target?.dataset.chapterName === name);
      });
    }, { threshold: [0.2, 0.45, 0.7], rootMargin: "-18% 0px -52% 0px" });

    sections.forEach((section) => observer.observe(section));
  }

  function updateScrollState() {
    const root = document.documentElement;
    const max = Math.max(root.scrollHeight - window.innerHeight, 1);
    const progress = Math.min(Math.max(window.scrollY / max, 0), 1);
    $("#progressBar").style.transform = `scaleX(${progress})`;
    $("#progressValue").textContent = `${faNumber(Math.round(progress * 100))}٪`;
    $("#topbar").classList.toggle("is-scrolled", window.scrollY > 24);
    window.shaderScroll = progress;
  }

  function setupControls() {
    document.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-jump]");
      if (!trigger) return;
      const target = document.getElementById(trigger.dataset.jump);
      target?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    });

    const focusButton = $("#focusButton");
    focusButton.addEventListener("click", () => {
      const enabled = document.body.classList.toggle("focus-mode");
      focusButton.setAttribute("aria-pressed", String(enabled));
      $(".focus-label").textContent = enabled ? "خروج از تمرکز" : "حالت تمرکز";
    });

    let ticking = false;
    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateScrollState();
        ticking = false;
      });
    }, { passive: true });

    window.addEventListener("pointermove", (event) => {
      document.documentElement.style.setProperty("--mx", `${event.clientX}px`);
      document.documentElement.style.setProperty("--my", `${event.clientY}px`);
      window.shaderPointer = [event.clientX / window.innerWidth, 1 - event.clientY / window.innerHeight];
    }, { passive: true });

    updateScrollState();
  }

  function initShader() {
    const canvas = $("#shaderCanvas");
    const gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: true,
      powerPreference: "low-power"
    });

    if (!gl) {
      canvas.hidden = true;
      return;
    }

    const vertexSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragmentSource = `
      precision highp float;
      uniform vec2 resolution;
      uniform vec2 pointer;
      uniform float time;
      uniform float scroll;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 4; i++) {
          v += a * noise(p);
          p = p * 2.03 + vec2(13.2, 7.7);
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        vec2 p = uv;
        p.x *= resolution.x / resolution.y;

        float drift = time * 0.025;
        float field = fbm(p * 2.1 + vec2(drift, scroll * 1.8));
        float ribbon = smoothstep(0.62, 0.98, field + 0.16 * sin(p.y * 7.0 + time * 0.11));

        vec2 mouse = pointer;
        mouse.x *= resolution.x / resolution.y;
        float halo = exp(-5.5 * distance(p, mouse));
        float horizon = exp(-8.0 * abs(uv.y - (0.46 + 0.13 * sin(uv.x * 4.0 + drift))));

        vec3 base = vec3(0.012, 0.020, 0.032);
        vec3 cyan = vec3(0.10, 0.55, 0.62) * ribbon * 0.16;
        vec3 blue = vec3(0.03, 0.13, 0.25) * horizon * (0.16 + scroll * 0.12);
        vec3 warm = vec3(0.48, 0.22, 0.07) * halo * 0.07;
        float grain = (hash(gl_FragCoord.xy + time) - 0.5) * 0.012;

        gl_FragColor = vec4(base + cyan + blue + warm + grain, 1.0);
      }
    `;

    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compile(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compile(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) {
      canvas.hidden = true;
      return;
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      canvas.hidden = true;
      return;
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.useProgram(program);

    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
      resolution: gl.getUniformLocation(program, "resolution"),
      pointer: gl.getUniformLocation(program, "pointer"),
      time: gl.getUniformLocation(program, "time"),
      scroll: gl.getUniformLocation(program, "scroll")
    };

    const resize = () => {
      const density = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(window.innerWidth * density);
      canvas.height = Math.floor(window.innerHeight * density);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    window.shaderPointer = [0.5, 0.55];
    window.shaderScroll = 0;
    resize();
    window.addEventListener("resize", resize, { passive: true });

    let lastFrame = 0;
    const draw = (now) => {
      if (!reducedMotion && now - lastFrame < 32) {
        requestAnimationFrame(draw);
        return;
      }

      lastFrame = now;
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform2f(uniforms.pointer, window.shaderPointer[0], window.shaderPointer[1]);
      gl.uniform1f(uniforms.time, reducedMotion ? 0 : now * 0.001);
      gl.uniform1f(uniforms.scroll, window.shaderScroll || 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (!reducedMotion) requestAnimationFrame(draw);
    };

    requestAnimationFrame(draw);
  }

  async function loadCourse() {
    try {
      const response = await fetch("./assets/course.md");
      if (!response.ok) throw new Error("course-load");
      const markdown = await response.text();
      const chapters = parseCourse(markdown);
      if (!chapters.length) throw new Error("course-empty");
      renderCourse(chapters);
    } catch {
      $("#courseLoading").classList.add("is-hidden");
      $("#courseContent").innerHTML = '<div class="course-error">متن جلسه بارگذاری نشد. لطفاً نمایش را دوباره باز کنید.</div>';
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupControls();
    observeReveals();
    initShader();
    loadCourse();
  });
})();
