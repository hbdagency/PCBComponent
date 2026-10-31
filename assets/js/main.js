/* ==========================================================================
   PCB Component Services — interactions
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Sticky header state ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  if (header && toggle) {
    toggle.addEventListener("click", function () {
      var open = header.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("nav-open", open);
    });

    document.querySelectorAll(".nav a").forEach(function (link) {
      link.addEventListener("click", function () {
        header.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.classList.remove("nav-open");
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && header.classList.contains("is-open")) {
        header.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.classList.remove("nav-open");
        toggle.focus();
      }
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealItems = document.querySelectorAll("[data-reveal]");
  if (revealItems.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealItems.forEach(function (el) { el.classList.add("is-visible"); });
    } else {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              var el = entry.target;
              var delay = parseInt(el.getAttribute("data-reveal-delay") || "0", 10);
              window.setTimeout(function () { el.classList.add("is-visible"); }, delay);
              observer.unobserve(el);
            }
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
      );
      revealItems.forEach(function (el) { observer.observe(el); });
    }
  }

  /* ---------- Knowledge tabs ---------- */
  var tabLists = document.querySelectorAll("[data-tabs]");
  tabLists.forEach(function (list) {
    var tabs = Array.prototype.slice.call(list.querySelectorAll("[role='tab']"));
    var panels = tabs.map(function (tab) {
      return document.getElementById(tab.getAttribute("aria-controls"));
    });

    function select(index) {
      tabs.forEach(function (tab, i) {
        var selected = i === index;
        tab.setAttribute("aria-selected", String(selected));
        tab.setAttribute("tabindex", selected ? "0" : "-1");
        if (panels[i]) panels[i].hidden = !selected;
      });
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(i); });
      tab.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
        if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
        if (e.key === "Home") next = 0;
        if (e.key === "End") next = tabs.length - 1;
        if (next !== null) {
          e.preventDefault();
          select(next);
          tabs[next].focus();
        }
      });
    });
  });

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq-button").forEach(function (button) {
    var panel = document.getElementById(button.getAttribute("aria-controls"));
    if (!panel) return;
    panel.style.height = "0px";
    panel.setAttribute("aria-hidden", "true");

    button.addEventListener("click", function () {
      var expanded = button.getAttribute("aria-expanded") === "true";
      var group = button.closest(".faq");

      if (group) {
        group.querySelectorAll(".faq-button[aria-expanded='true']").forEach(function (other) {
          if (other === button) return;
          var otherPanel = document.getElementById(other.getAttribute("aria-controls"));
          other.setAttribute("aria-expanded", "false");
          if (otherPanel) {
            otherPanel.style.height = "0px";
            otherPanel.setAttribute("aria-hidden", "true");
          }
        });
      }

      button.setAttribute("aria-expanded", String(!expanded));
      panel.setAttribute("aria-hidden", String(expanded));
      panel.style.height = expanded ? "0px" : panel.scrollHeight + "px";
    });
  });

  /* ---------- Home page: service card hover light cue (no-op safety) ---------- */

  /* ---------- Contact form ---------- */
  var form = document.querySelector("[data-contact-form]");
  if (form) {
    var status = form.querySelector(".form-status");

    var setError = function (field, message) {
      var wrap = field.closest(".field");
      if (!wrap) return;
      wrap.classList.toggle("has-error", Boolean(message));
      var error = wrap.querySelector(".field-error");
      if (error) error.textContent = message || "";
      field.setAttribute("aria-invalid", message ? "true" : "false");
    };

    var validate = function () {
      var firstInvalid = null;
      form.querySelectorAll("input[required], select[required], textarea[required]").forEach(function (field) {
        var value = (field.value || "").trim();
        var message = "";
        if (!value) {
          message = "This field is required.";
        } else if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
          message = "Enter a valid email address.";
        }
        setError(field, message);
        if (message && !firstInvalid) firstInvalid = field;
      });
      return firstInvalid;
    };

    form.querySelectorAll("input, select, textarea").forEach(function (field) {
      field.addEventListener("input", function () {
        if (field.closest(".field") && field.closest(".field").classList.contains("has-error")) {
          setError(field, "");
        }
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var invalid = validate();
      if (invalid) {
        invalid.focus();
        return;
      }

      var data = new FormData(form);
      var lines = [
        "Name: " + (data.get("name") || ""),
        "Company: " + (data.get("company") || "—"),
        "Email: " + (data.get("email") || ""),
        "Service: " + (data.get("service") || ""),
        "",
        "Project details:",
        (data.get("message") || "")
      ];

      var subject = "Component library enquiry — " + (data.get("name") || "new enquiry");
      var href =
        "mailto:info@pcbcomponent.co.in" +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(lines.join("\n"));

      window.location.href = href;

      if (status) {
        status.textContent =
          "Your email app should open with the details filled in. If nothing happens, write to info@pcbcomponent.co.in directly.";
        status.classList.add("is-visible");
      }
    });
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
