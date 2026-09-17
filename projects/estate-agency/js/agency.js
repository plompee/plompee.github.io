/* Hartley & Grove — static demo engine.
   All data comes from data.js (a real snapshot of the Apex27 Portal API).
   No backend: search, filter, sort, pagination and rendering happen client-side. */
(function () {
  "use strict";

  var DATA = window.AGENCY_DATA || null;

  var SORTS = {
    featured: "Featured first",
    newest: "Newest first",
    oldest: "Oldest first",
    highest_price: "Highest price",
    lowest_price: "Lowest price",
    newly_instructed: "Newly instructed"
  };
  var UNDER_OFFER = ["SSTC", "Sale Agreed", "Under Offer"];
  var PAGE_SIZE = 12;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function num(x) { var n = parseInt(x, 10); return isNaN(n) ? 0 : n; }
  function param(name, def) {
    var m = new URLSearchParams(location.search).get(name);
    return m === null || m === "" ? (def === undefined ? "" : def) : m;
  }
  function isUnderOffer(l) {
    if (l.status === "Under Offer") return true;
    return l.saleProgression && UNDER_OFFER.indexOf(l.saleProgression) !== -1;
  }

  /* ---------- cards ---------- */
  function card(l) {
    var price = l.displayPrice || (l.price ? "&pound;" + num(l.price).toLocaleString() : "POA");
    var summary = l.summary || "";
    if (summary.length > 140) summary = summary.slice(0, 140) + "&hellip;";
    var specs = "";
    if (l.bedrooms) specs += "<li>" + esc(l.bedrooms) + " bed</li>";
    if (l.bathrooms) specs += "<li>" + esc(l.bathrooms) + " bath</li>";
    if (l.livingRooms) specs += "<li>" + esc(l.livingRooms) + " rec</li>";
    specs += '<li class="card-type">' + esc(l.propertyType || "") + "</li>";
    var badges = "";
    if (l.isFeatured) badges += '<span class="badge badge-featured">Featured</span>';
    if (l.websiteStatus) badges += '<span class="badge badge-status">' + esc(l.websiteStatus) + "</span>";
    var img = l.thumbnailUrl
      ? '<img src="' + esc(l.thumbnailUrl) + '" alt="' + esc(l.displayAddress || l.address1) + '" loading="lazy">'
      : '<div class="card-no-image">No image</div>';
    return '<a href="property.html?id=' + l.id + '" class="property-card">' +
      '<div class="card-media">' + img + badges +
        '<span class="badge badge-price">' + price + "</span></div>" +
      '<div class="card-body">' +
        '<p class="card-title">' + esc(l.header || l.propertyType) + "</p>" +
        '<p class="card-address">' + esc(l.displayAddress || (l.address1 + ", " + l.city)) + "</p>" +
        '<p class="card-summary">' + esc(summary) + "</p>" +
        '<ul class="card-specs">' + specs + "</ul>" +
      "</div></a>";
  }
  function cards(list) {
    if (!list.length) return "";
    var h = "";
    for (var i = 0; i < list.length; i++) h += card(list[i]);
    return h;
  }

  /* ---------- filter / sort / paginate ---------- */
  function filterItems(items, f) {
    return items.filter(function (l) {
      if (f.transaction_type && l.__tt !== f.transaction_type) return false;
      if (f.property_type && l.propertyTypeValue !== f.property_type) return false;
      if (f.city && (l.city || "").toLowerCase() !== f.city.toLowerCase()) return false;
      if (f.min_price && num(l.price) < num(f.min_price)) return false;
      if (f.max_price && num(l.price) > num(f.max_price)) return false;
      if (f.min_beds && num(l.bedrooms) < num(f.min_beds)) return false;
      if (f.max_beds && (l.bedrooms == null ? 0 : num(l.bedrooms)) > num(f.max_beds)) return false;
      if (f.min_baths && num(l.bathrooms) < num(f.min_baths)) return false;
      if (f.featured && l.isFeatured !== true) return false;
      if (!f.include_sstc && isUnderOffer(l)) return false;
      return true;
    });
  }
  function sortItems(items, sort) {
    var a = items.slice();
    function cmp(f) { return function (x, y) { return f(x) - f(y); }; }
    switch (sort) {
      case "newest": a.sort(cmp(function (x) { return -num(x.timeCreated); })); break;
      case "oldest": a.sort(cmp(function (x) { return num(x.timeCreated); })); break;
      case "highest_price": a.sort(cmp(function (x) { return -num(x.price); })); break;
      case "lowest_price": a.sort(cmp(function (x) { return num(x.price); })); break;
      case "newly_instructed": a.sort(cmp(function (x) { return -num(x.timeMarketed); })); break;
      case "featured":
      default:
        a.sort(function (x, y) {
          var fx = x.isFeatured ? 1 : 0, fy = y.isFeatured ? 1 : 0;
          if (fy !== fx) return fy - fx;
          return num(y.timeCreated) - num(x.timeCreated);
        });
    }
    return a;
  }
  function readFilters() {
    var f = {};
    ["transaction_type", "property_type", "city", "min_price", "max_price", "min_beds", "max_beds", "min_baths", "sort"].forEach(function (k) {
      var v = param(k); if (v) f[k] = v;
    });
    if (param("featured") === "1") f.featured = "1";
    if (param("include_sstc") === "1") f.include_sstc = "1";
    if (!f.transaction_type && !f.property_type) f.transaction_type = "sale";
    f.page = Math.max(num(param("page", "1")), 1);
    return f;
  }
  function buildUrl(f, page) {
    var usp = new URLSearchParams();
    Object.keys(f).forEach(function (k) {
      if (k === "page") return;
      if (f[k] !== undefined && f[k] !== null && f[k] !== "") usp.set(k, f[k]);
    });
    if (page && page > 1) usp.set("page", String(page));
    return "listings.html?" + usp.toString();
  }

  /* ---------- demo form notice ---------- */
  function demoNotice(form, title, body) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = "Demo mode"; }
      var box = document.createElement("div");
      box.className = "flash flash-success demo-notice";
      box.innerHTML = "<strong>" + esc(title) + "</strong><br>" + esc(body);
      form.insertBefore(box, form.firstChild);
      box.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }
  var DEMO_MSG = "This is a static demo, so the request is not sent. In production it would POST to the Apex27 Portal API.";

  /* ---------- page: home ---------- */
  function initHome() {
    if (!DATA) return;
    // cities datalist
    var dl = document.getElementById("city-list");
    if (dl) {
      dl.innerHTML = (DATA.options.cities || []).map(function (c) { return '<option value="' + esc(c) + '">'; }).join("");
    }
    // hero search
    var heroForm = document.getElementById("hero-search");
    if (heroForm) {
      heroForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var usp = new URLSearchParams();
        usp.set("transaction_type", document.getElementById("h-tt").value || "sale");
        var city = document.getElementById("h-city").value.trim();
        if (city) usp.set("city", city);
        var maxp = document.getElementById("h-max").value;
        if (maxp) usp.set("max_price", maxp);
        location.href = "listings.html?" + usp.toString();
      });
    }
    // stats
    var statsWrap = document.getElementById("stats-strip");
    var st = DATA.stats && DATA.stats.sale;
    if (statsWrap && st && (st.soldCount || st.underOfferCount || st.applicantCount)) {
      statsWrap.style.display = "";
      setText("stat-sold", st.soldCount || 0);
      setText("stat-under", st.underOfferCount || 0);
      setText("stat-applicants", st.applicantCount || 0);
      setText("stat-managed", st.managedCount || 0);
    } else if (statsWrap) { statsWrap.style.display = "none"; }

    // featured
    var grid = document.getElementById("featured-grid");
    if (grid) {
      var saleIdx = DATA.searchIndex.filter(function (l) { return l.__tt === "sale"; });
      var featured = DATA.searchIndex.filter(function (l) { return l.isFeatured; });
      var picks = featured.slice(0, 6);
      if (picks.length < 6) picks = picks.concat(saleIdx.slice(0, 6 - picks.length));
      picks = picks.slice(0, 6);
      grid.innerHTML = picks.length ? cards(picks) :
        '<p class="empty-state">No featured properties at the moment. <a href="listings.html?transaction_type=sale">Browse all listings</a>.</p>';
    }
    function setText(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }
  }

  /* ---------- page: listings ---------- */
  function initListings() {
    var gridEl = document.getElementById("results-grid");
    if (!DATA) {
      gridEl.innerHTML = '<div class="empty-state"><p>Property data is unavailable.</p></div>';
      return;
    }
    var f = readFilters();
    var base = DATA.searchIndex;
    var filtered = filterItems(base, f);
    var sorted = sortItems(filtered, f.sort || "highest_price");
    var pageCount = Math.max(Math.ceil(sorted.length / PAGE_SIZE), 1);
    if (f.page > pageCount) f.page = pageCount;
    var pageItems = sorted.slice((f.page - 1) * PAGE_SIZE, f.page * PAGE_SIZE);

    document.getElementById("page-sub").textContent =
      sorted.length + " propert" + (sorted.length === 1 ? "y" : "ies") + " in snapshot";
    document.getElementById("results-count").textContent =
      sorted.length + " result" + (sorted.length === 1 ? "" : "s") +
      (sorted.length !== filtered.length ? " (filtered from " + filtered.length + ")" : "");

    gridEl.innerHTML = pageItems.length ? cards(pageItems) :
      '<div class="empty-state"><p>No properties match your search.</p><p>Try widening your price range or removing some filters.</p></div>';

    renderPagination(f, pageCount);
    populateFilterForm(f);
    wireFilterForm(f);
  }

  function populateFilterForm(f) {
    function sel(id, val) { var el = document.getElementById(id); if (el) el.value = val == null ? "" : val; }
    // transaction type
    var tt = document.getElementById("f-tt");
    if (tt) {
      tt.innerHTML = (DATA.options.transactionTypes || []).map(function (o) {
        return '<option value="' + esc(o.value) + '"' + (f.transaction_type === o.value ? " selected" : "") + ">" + esc(o.display) + "</option>";
      }).join("");
    }
    var pt = document.getElementById("f-type");
    if (pt) {
      pt.innerHTML = '<option value="">Any type</option>' + (DATA.options.propertyTypes || []).map(function (o) {
        return '<option value="' + esc(o.value) + '"' + (f.property_type === o.value ? " selected" : "") + ">" + esc(o.display) + "</option>";
      }).join("");
    }
    var ci = document.getElementById("f-city");
    if (ci) {
      ci.innerHTML = '<option value="">Any city</option>' + (DATA.options.cities || []).map(function (c) {
        return '<option value="' + esc(c) + '"' + (f.city === c ? " selected" : "") + ">" + esc(c) + "</option>";
      }).join("");
    }
    sel("f-min-price", f.min_price); sel("f-max-price", f.max_price);
    sel("f-min-beds", f.min_beds); sel("f-max-beds", f.max_beds);
    var fb = document.getElementById("f-featured"); if (fb) fb.checked = !!f.featured;
    var ss = document.getElementById("f-sstc"); if (ss) ss.checked = !!f.include_sstc;
    var so = document.getElementById("f-sort");
    if (so) {
      so.innerHTML = Object.keys(SORTS).map(function (k) {
        return '<option value="' + k + '"' + ((f.sort || "highest_price") === k ? " selected" : "") + ">" + SORTS[k] + "</option>";
      }).join("");
    }
  }

  function wireFilterForm(f) {
    var form = document.getElementById("filter-form");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var nf = collectForm();
        location.href = buildUrl(nf, 1);
      });
    }
    var sortSel = document.getElementById("f-sort");
    if (sortSel) {
      sortSel.addEventListener("change", function () {
        var nf = collectForm();
        nf.sort = sortSel.value;
        location.href = buildUrl(nf, 1);
      });
    }
    function collectForm() {
      var nf = {};
      function val(id) { var el = document.getElementById(id); return el ? el.value : ""; }
      function set(id, k) { var v = val(id); if (v) nf[k] = v; }
      set("f-tt", "transaction_type");
      set("f-type", "property_type");
      set("f-city", "city");
      set("f-min-price", "min_price");
      set("f-max-price", "max_price");
      set("f-min-beds", "min_beds");
      set("f-max-beds", "max_beds");
      set("f-sort", "sort");
      if (document.getElementById("f-featured") && document.getElementById("f-featured").checked) nf.featured = "1";
      if (document.getElementById("f-sstc") && document.getElementById("f-sstc").checked) nf.include_sstc = "1";
      return nf;
    }
  }

  function renderPagination(f, pageCount) {
    var nav = document.getElementById("pagination");
    if (!nav) return;
    if (pageCount <= 1) { nav.innerHTML = ""; return; }
    var html = "";
    if (f.page > 1) html += pageLink(f, f.page - 1, "&larr; Previous");
    for (var p = 1; p <= pageCount; p++) {
      var far = p > f.page + 2 || p < f.page - 2;
      if (p === f.page) html += '<span class="page-link page-current">' + p + "</span>";
      else if (far && p !== 1 && p !== pageCount) html += "";
      else html += pageLink(f, p, String(p));
    }
    if (f.page < pageCount) html += pageLink(f, f.page + 1, "Next &rarr;");
    nav.innerHTML = html;
    function pageLink(ff, pg, label) {
      return '<a class="page-link" href="' + buildUrl(ff, pg) + '">' + label + "</a>";
    }
  }

  /* ---------- page: property detail ---------- */
  function initProperty() {
    var id = param("id");
    var root = document.getElementById("detail-root");
    if (!DATA) {
      root.innerHTML = '<div class="empty-state" style="margin:60px auto;max-width:520px"><p>Property data is unavailable.</p></div>';
      return;
    }
    var l = DATA.listings[id];
    if (!l) {
      root.innerHTML = '<div class="empty-state" style="margin:60px auto;max-width:520px"><p>Property not found in this snapshot.</p>' +
        '<p><a href="listings.html?transaction_type=sale">Back to search</a></p></div>';
      return;
    }
    document.title = (l.displayAddress || l.address1) + " — Hartley & Grove";
    root.innerHTML = propertyHtml(l);

    // gallery behaviour
    var track = document.getElementById("gallery-track");
    var counter = document.getElementById("gallery-counter");
    if (track && counter) {
      var update = function () {
        var idx = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1)) + 1;
        var total = track.querySelectorAll(".gallery-item").length;
        counter.textContent = idx + " / " + total;
      };
      track.addEventListener("scroll", update, { passive: true });
    }
    // enquiry form
    var qf = document.getElementById("enquiry-form");
    if (qf) demoNotice(qf, "Enquiry captured (demo).", DEMO_MSG);
  }

  function section(title, body) {
    return '<section class="detail-section"><h2 class="detail-heading">' + title + "</h2>" + body + "</section>";
  }
  function docLinks(list, prefix, generic) {
    if (!list || !list.length) return "";
    return list.map(function (d) {
      var label = (prefix + " — " + (d.name || "")).trim();
      if (generic) label = generic;
      return '<a class="doc-link" href="' + esc(d.url) + '" target="_blank" rel="noopener">' + esc(label) + "</a>";
    }).join("");
  }
  function propertyHtml(l) {
    var price = l.displayPrice || "&pound;" + num(l.price).toLocaleString();
    var h = "";
    // breadcrumb
    h += '<div class="container"><p class="breadcrumb"><a href="index.html">Home</a> &rsaquo; ' +
      '<a href="listings.html?transaction_type=' + esc(l.__tt || "sale") + '">Search</a> &rsaquo; <span>' + esc(l.reference) + "</span></p></div>";
    // head
    h += '<section class="detail-head"><div class="container"><div class="detail-head-text"><div>' +
      '<h1 class="detail-title">' + esc(l.displayAddress || l.address1) + "</h1>" +
      '<p class="detail-sub">' + esc(l.subtitle || l.header || "") + " &middot; " + esc(l.city) + ", " + esc(l.county) + " " + esc(l.postalCode) + "</p></div>" +
      '<div class="detail-price-block"><p class="detail-price">' + price + "</p>" +
      (l.saleFee && l.saleFeePayableByBuyer ? '<p class="detail-fee">Buyer\'s fee: ' + esc(l.saleFee) + "</p>" : "") +
      "</div></div>";
    if (l.banner) h += '<p class="detail-banner">' + esc(l.banner) + "</p>";
    h += "</div></section>";

    h += '<div class="container detail-layout"><div class="detail-main">';

    // gallery
    if (l.images && l.images.length) {
      h += '<div class="gallery" id="gallery">' +
        '<button class="gallery-nav gallery-prev" aria-label="Previous image" onclick="AG.moveGallery(-1)">&#10094;</button>' +
        '<div class="gallery-track" id="gallery-track">';
      l.images.forEach(function (img, i) {
        h += '<figure class="gallery-item"><img src="' + esc(img.url) + '" alt="' + esc(img.name || "Property image " + (i + 1)) + '" loading="' + (i === 0 ? "eager" : "lazy") + '"></figure>';
      });
      h += "</div>" +
        '<button class="gallery-nav gallery-next" aria-label="Next image" onclick="AG.moveGallery(1)">&#10095;</button>' +
        '<span class="gallery-counter" id="gallery-counter">1 / ' + l.images.length + "</span></div>";
    } else {
      h += '<div class="gallery-empty">No photographs available for this property.</div>';
    }

    // specs
    var specs = "";
    function spec(n, lab) { if (n) specs += '<div class="spec"><span class="spec-num">' + esc(n) + '</span><span class="spec-label">' + lab + "</span></div>"; }
    function specText(t, lab) { if (t) specs += '<div class="spec"><span class="spec-num spec-text">' + esc(t) + '</span><span class="spec-label">' + lab + "</span></div>"; }
    spec(l.bedrooms, "Bedrooms"); spec(l.bathrooms, "Bathrooms");
    spec(l.livingRooms, "Receptions"); spec(l.parkingSpaces, "Parking");
    specText(l.propertyType, "Type"); specText(l.status, "Status");
    if (specs) h += '<div class="detail-specs">' + specs + "</div>";

    // overview
    if (l.summary || l.description) {
      var body = "";
      if (l.summary) body += '<p class="detail-summary">' + esc(l.summary) + "</p>";
      if (l.description) body += '<div class="detail-description">' + esc(l.description).replace(/\n/g, "<br>") + "</div>";
      if (l.incomeDescription) body += '<p class="detail-summary">' + esc(l.incomeDescription) + "</p>";
      h += section("Overview", body);
    }
    // key features
    if (l.bullets && l.bullets.length)
      h += section("Key features", '<ul class="tick-list">' + l.bullets.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("") + "</ul>");
    // rooms
    if (l.rooms && l.rooms.length) {
      var rows = l.rooms.map(function (r) {
        var dim = esc(r.dimensions) + (r.feetInches ? " (" + esc(r.feetInches) + ")" : "");
        var note = esc(r.description || r.dimensionNotes || "—");
        return "<tr><td>" + esc(r.name) + "</td><td>" + dim + "</td><td>" + note + "</td></tr>";
      }).join("");
      h += section("Rooms", '<table class="rooms-table"><thead><tr><th>Room</th><th>Dimensions</th><th>Notes</th></tr></thead><tbody>' + rows + "</tbody></table>");
    }
    // additional details
    if (l.additionalDetails && l.additionalDetails.length) {
      var ad = l.additionalDetails.map(function (d) { return "<tr><th>" + esc(d.label) + "</th><td>" + esc(d.text) + "</td></tr>"; }).join("");
      h += section("Additional details", '<table class="rooms-table"><tbody>' + ad + "</tbody></table>");
    }
    // documents
    var docs = docLinks(l.floorplans, "Floorplan") + docLinks(l.epcs, "EPC");
    if (docs) h += section("Documents", '<div class="doc-links">' + docs + "</div>");
    // media & tours
    var media = docLinks(l.brochures, "Brochure") +
      (l.videos || []).map(function (v) { return '<a class="doc-link" href="' + esc(v.url) + '" target="_blank" rel="noopener">Video — ' + esc(v.name) + "</a>"; }).join("") +
      (l.virtualTours || []).map(function (t) { return '<a class="doc-link" href="' + esc(t.url) + '" target="_blank" rel="noopener">Virtual tour</a>'; }).join("");
    if (media) h += section("Media &amp; tours", '<div class="doc-links">' + media + "</div>");
    // map
    if (l.mapEmbedUrl)
      h += section("Location", '<div class="map-embed"><iframe src="' + esc(l.mapEmbedUrl) + '" title="Map" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>');

    h += "</div>"; // detail-main

    // aside
    h += '<aside class="detail-side"><div class="enquiry-card">' +
      '<h2 class="enquiry-title">Enquire about this property</h2>' +
      '<p class="enquiry-ref">Ref: ' + esc(l.reference) + "</p>" +
      (l.branch && l.branch.phone ? '<p class="enquiry-phone">Call <a href="tel:' + esc(l.branch.phone) + '">' + esc(l.branch.phone) + "</a></p>" : "") +
      '<form id="enquiry-form" class="stack-form">' +
      '<div class="form-row"><div><label for="e-first">First name *</label><input id="e-first" name="first_name" required></div>' +
      '<div><label for="e-last">Last name *</label><input id="e-last" name="last_name" required></div></div>' +
      '<label for="e-email">Email *</label><input id="e-email" name="email" type="email" required>' +
      '<label for="e-phone">Phone</label><input id="e-phone" name="phone" type="tel">' +
      '<label for="e-msg">Message</label><textarea id="e-msg" name="message" rows="4">I would like to arrange a viewing for this property.</textarea>' +
      '<label class="check-label"><input type="checkbox" name="request_viewing" value="1" checked> I\'d like to book a viewing</label>' +
      '<button type="submit" class="btn btn-gold btn-block">Send enquiry</button></form>' +
      "</div></aside></div>"; // detail-side, detail-layout
    return h;
  }

  function moveGallery(dir) {
    var track = document.getElementById("gallery-track");
    if (!track) return;
    var item = track.querySelector(".gallery-item");
    var step = item ? item.offsetWidth : track.clientWidth;
    track.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  /* ---------- expose ---------- */
  window.AG = {
    initHome: initHome,
    initListings: initListings,
    initProperty: initProperty,
    demoNotice: demoNotice,
    moveGallery: moveGallery,
    DATA: DATA
  };
})();
