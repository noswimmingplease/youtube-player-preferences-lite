// ==UserScript==
// @name         YouTube Player Preferences Lite
// @namespace    Citizen.youtube.player-preferences-lite
// @version      1
// @description  Applies small YouTube player preferences without touching Enhancer-style miniplayer, queue, autoplay, or background playback controls.
// @author       Citizen
// @match        https://www.youtube.com/*
// @run-at       document-idle
// @grant        none
// @noframes
// ==/UserScript==

(() => {
  "use strict";

  const CONFIG = {
    convertShortsToWatch: true,
    hideShorts: true,
    hideUpcomingStreams: true,
    hidePayToWatchCards: true,
    hideWatchedVideos: true,
    watchedVideoThresholdPercent: 90,
    hideRelatedVideos: true,
    hideAskButton: true,
    hideThanksButton: true,
    hideShareButton: true,
    hideJoinButton: true,
    hideMerchShelf: true,
    hideStatementBanners: true,
    hideMetadataTeaserCarousel: true,
    hideStructuredDescription: true,
    hideChat: true,
    hideInfoCardsAndEndScreens: true,
    enableTheaterMode: true,
    enablePlayerWheelVolume: true,
    requireRightMouseButtonForWheelVolume: true,
    wheelVolumeStep: 5,
  };

  const STYLE_ID = "ytppl-style";
  const VOLUME_OVERLAY_CLASS = "ytppl-volume-overlay";
  const RESTORED_DISLIKE_ICON_CLASS = "ytppl-ryd-dislike-icon";
  const SHORTS_LINK_SELECTOR =
    'a[href^="/shorts/"], a[href*="youtube.com/shorts/"]';
  const FEED_CARD_CONTAINER_SELECTOR = [
    "ytd-rich-item-renderer",
    "ytd-video-renderer",
    "ytd-grid-video-renderer",
    "ytd-compact-video-renderer",
  ].join(",");
  const UPCOMING_STREAM_SCAN_SELECTOR = [
    FEED_CARD_CONTAINER_SELECTOR,
    "yt-lockup-view-model",
    "yt-lockup-view-model-wiz",
  ].join(",");
  const UPCOMING_STREAM_BADGE_SELECTOR = [
    ".yt-badge-shape__text",
    "badge-shape",
    "yt-badge-shape",
    "ytd-thumbnail-overlay-time-status-renderer",
    "yt-thumbnail-overlay-badge-view-model",
    "yt-thumbnail-bottom-overlay-view-model",
  ].join(",");
  const PAY_TO_WATCH_SCAN_SELECTOR = [
    UPCOMING_STREAM_SCAN_SELECTOR,
    "yt-lockup-metadata-view-model",
    "yt-lockup-metadata-view-model-wiz",
  ].join(",");
  const PAY_TO_WATCH_TEXT_SELECTOR = [
    "yt-lockup-metadata-view-model",
    "yt-lockup-metadata-view-model-wiz",
    "ytd-video-meta-block",
    "#metadata-line",
    ".yt-badge-shape__text",
    "badge-shape",
    "yt-badge-shape",
    "ytd-badge-supported-renderer",
  ].join(",");
  const WATCHED_VIDEO_SCAN_SELECTOR = [
    FEED_CARD_CONTAINER_SELECTOR,
    "ytd-rich-grid-media",
    "ytd-rich-grid-slim-media",
    "yt-lockup-view-model",
    "yt-lockup-view-model-wiz",
  ].join(",");
  const WATCHED_PROGRESS_VALUE_SELECTOR = [
    "ytd-thumbnail-overlay-resume-playback-renderer #progress",
    "#progress",
    "tp-yt-paper-progress#progress",
    "tp-yt-paper-progress #primaryProgress",
    "yt-progress-bar-line",
    ".ytThumbnailOverlayProgressBarProgress",
    ".ytThumbnailOverlayProgressBarViewModelProgress",
    "[class*='ThumbnailOverlayProgressBar'][class*='Progress']",
  ].join(",");
  const WATCHED_PROGRESS_SELECTOR = [
    "ytd-thumbnail-overlay-resume-playback-renderer",
    "yt-thumbnail-overlay-progress-bar-view-model",
    ".ytThumbnailOverlayProgressBarHost",
    ".ytThumbnailOverlayProgressBarViewModelHost",
    WATCHED_PROGRESS_VALUE_SELECTOR,
  ].join(",");
  const WATCH_PATHS = ["/watch", "/live/"];
  const EXCLUDED_SURFACE_SELECTOR = [
    "ytd-miniplayer",
    "ytd-miniplayer-ui",
    "ytd-miniplayer-bar-renderer",
    "ytd-playlist-panel-renderer",
    "ytd-playlist-panel-video-renderer",
    "ytd-playlist-panel-renderer #items",
    "ytd-engagement-panel-section-list-renderer",
  ].join(",");
  const CARD_HIDE_DATASET_KEYS = [
    "ytpplUpcomingHidden",
    "ytpplPayToWatchHidden",
    "ytpplWatchedHidden",
  ];
  // Keep the DOM marker and CSS selector in lockstep; YouTube custom elements
  // can expose non-standard style objects, so hiding is CSS-driven.
  const WATCH_ACTION_HIDDEN_DATASET_KEY = "ytpplActionHidden";
  const WATCH_ACTION_HIDDEN_ATTRIBUTE = "data-ytppl-action-hidden";
  const WATCH_ACTION_HIDDEN_VALUE = "1";
  const WATCH_ACTION_HIDDEN_SELECTOR =
    `[${WATCH_ACTION_HIDDEN_ATTRIBUTE}="${WATCH_ACTION_HIDDEN_VALUE}"]`;
  const WATCH_ACTION_BUTTON_SELECTOR = [
    "ytd-watch-flexy ytd-menu-renderer yt-button-view-model",
    "ytd-watch-flexy ytd-menu-renderer button-view-model",
    `ytd-watch-flexy ytd-menu-renderer ${WATCH_ACTION_HIDDEN_SELECTOR}`,
  ].join(",");
  const WATCH_ACTION_MENU_ITEM_SELECTOR = [
    "ytd-popup-container ytd-menu-service-item-renderer",
    "ytd-popup-container yt-list-item-view-model",
    "ytd-popup-container ytd-compact-link-renderer",
    "ytd-popup-container tp-yt-paper-item",
    "tp-yt-iron-dropdown ytd-menu-service-item-renderer",
    "tp-yt-iron-dropdown yt-list-item-view-model",
    "tp-yt-iron-dropdown ytd-compact-link-renderer",
    "tp-yt-iron-dropdown tp-yt-paper-item",
    `ytd-popup-container ${WATCH_ACTION_HIDDEN_SELECTOR}`,
    `tp-yt-iron-dropdown ${WATCH_ACTION_HIDDEN_SELECTOR}`,
  ].join(",");
  const WATCH_ACTION_MENU_ITEM_RENDERER_SELECTOR = [
    "ytd-menu-service-item-renderer",
    "yt-list-item-view-model",
    "ytd-compact-link-renderer",
  ].join(",");
  const WATCH_ACTION_MENU_ITEM_FALLBACK_SELECTOR = "tp-yt-paper-item";
  const WATCH_ACTION_PRESERVE_SELECTOR = [
    "segmented-like-dislike-button-view-model",
    "ytd-segmented-like-dislike-button-renderer",
    "#segmented-like-button",
    "#segmented-dislike-button",
    "#like-button",
    "#dislike-button",
    "like-button-view-model",
    "dislike-button-view-model",
  ].join(",");
  const WATCH_ACTION_BUTTON_RULES = [
    { configKey: "hideAskButton", label: "Ask" },
    { configKey: "hideThanksButton", label: "Thanks" },
    { configKey: "hideShareButton", label: "Share" },
  ];
  const WATCH_ACTION_MUTATION_SELECTOR = [
    "ytd-watch-flexy ytd-menu-renderer",
    "ytd-popup-container",
    "tp-yt-iron-dropdown",
  ].join(",");
  const RYD_DISLIKE_BUTTON_SELECTOR = [
    "ytd-watch-flexy #segmented-dislike-button button",
    "ytd-watch-flexy dislike-button-view-model button",
    "ytd-watch-flexy #dislike-button button",
  ].join(",");
  const RYD_LIKE_TEXT_SELECTOR = [
    "ytd-watch-flexy #segmented-like-button .ytSpecButtonShapeNextButtonTextContent",
    "ytd-watch-flexy #segmented-like-button .yt-spec-button-shape-next__button-text-content",
    "ytd-watch-flexy like-button-view-model .ytSpecButtonShapeNextButtonTextContent",
    "ytd-watch-flexy like-button-view-model .yt-spec-button-shape-next__button-text-content",
  ].join(",");
  const RYD_TEXT_CONTAINER_SELECTOR = [
    ".ytSpecButtonShapeNextButtonTextContent",
    ".yt-spec-button-shape-next__button-text-content",
    "yt-formatted-string#text",
    "span[role='text']",
  ].join(",");
  const RYD_ICON_SELECTOR = [
    ".ytSpecButtonShapeNextIcon",
    ".yt-spec-button-shape-next__icon",
    "yt-icon",
    `.${RESTORED_DISLIKE_ICON_CLASS}`,
  ].join(",");

  let scheduled = false;
  let legacyActionHiddenCleared = false;
  let theaterModeUserDisabled = false;
  let rightButtonHeldOnPlayer = false;
  let suppressNextContextMenu = false;
  let volumeOverlayHideTimer = 0;

  function isWatchPath() {
    return (
      location.pathname === WATCH_PATHS[0] ||
      location.pathname.startsWith(WATCH_PATHS[1])
    );
  }

  function isShortsPath() {
    return location.pathname.startsWith("/shorts/");
  }

  function isExcludedSurface(target) {
    return Boolean(closestElement(target, EXCLUDED_SURFACE_SELECTOR));
  }

  function closestElement(target, selector) {
    if (!target) {
      return null;
    }

    const el =
      target.nodeType === Node.ELEMENT_NODE ? target : target.parentElement;
    return el ? el.closest(selector) : null;
  }

  function getShortsIdFromUrl(rawUrl) {
    let url;
    try {
      url = new URL(rawUrl, location.origin);
    } catch {
      return "";
    }

    const match = url.pathname.match(/^\/shorts\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : "";
  }

  function getWatchUrlForShort(shortId) {
    const url = new URL("/watch", location.origin);
    url.searchParams.set("v", shortId);
    return url.toString();
  }

  function getElementText(el) {
    return el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  }

  function collectMatchingElements(root, selector) {
    const elements = new Set();
    if (!root || !root.querySelectorAll) {
      return elements;
    }

    if (root.nodeType === Node.ELEMENT_NODE && root.matches(selector)) {
      elements.add(root);
    }
    root.querySelectorAll(selector).forEach((el) => elements.add(el));
    return elements;
  }

  function convertCurrentShortsPage() {
    if (!CONFIG.convertShortsToWatch || !isShortsPath()) {
      return;
    }

    const shortId = getShortsIdFromUrl(location.href);
    if (!shortId) {
      return;
    }

    location.replace(getWatchUrlForShort(shortId));
  }

  function rewriteShortsLinks(root = document) {
    if (!CONFIG.convertShortsToWatch) {
      return;
    }

    root.querySelectorAll(SHORTS_LINK_SELECTOR).forEach((link) => {
      if (isExcludedSurface(link)) {
        return;
      }

      const shortId = getShortsIdFromUrl(
        link.href || link.getAttribute("href"),
      );
      if (!shortId) {
        return;
      }

      link.href = getWatchUrlForShort(shortId);
      link.dataset.ytpplShortsConverted = "1";
    });
  }

  function handleShortsClick(event) {
    if (!CONFIG.convertShortsToWatch) {
      return;
    }

    const link = closestElement(event.target, SHORTS_LINK_SELECTOR);
    if (!link || isExcludedSurface(link)) {
      return;
    }

    const shortId = getShortsIdFromUrl(link.href || link.getAttribute("href"));
    if (!shortId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    location.assign(getWatchUrlForShort(shortId));
  }

  function hasUpcomingStreamBadge(card) {
    return Array.from(
      card.querySelectorAll(UPCOMING_STREAM_BADGE_SELECTOR),
    ).some((el) => {
      const text = getElementText(el);
      const label = el.getAttribute("aria-label") || "";
      return /^Upcoming$/i.test(text) || /^Upcoming$/i.test(label);
    });
  }

  function isUpcomingStreamCard(card) {
    if (!card || isExcludedSurface(card)) {
      return false;
    }

    const text = getElementText(card);
    return (
      hasUpcomingStreamBadge(card) ||
      /\bScheduled for\b/i.test(text) ||
      (/\bNotify me\b/i.test(text) && /\b(waiting|Scheduled)\b/i.test(text))
    );
  }

  function setCardHidden(card, datasetKey, hidden) {
    const container =
      closestElement(card, FEED_CARD_CONTAINER_SELECTOR) || card;

    if (hidden) {
      container.dataset[datasetKey] = "1";
    } else if (container.dataset[datasetKey] === "1") {
      delete container.dataset[datasetKey];
    } else {
      return;
    }

    const shouldHide = CARD_HIDE_DATASET_KEYS.some(
      (key) => container.dataset[key] === "1",
    );
    container.hidden = shouldHide;

    if (shouldHide) {
      container.style.setProperty("display", "none", "important");
    } else {
      container.style.removeProperty("display");
    }
  }

  function hideMatchingCards(root, enabled, selector, datasetKey, predicate) {
    if (!enabled) {
      return;
    }

    collectMatchingElements(root, selector).forEach((card) => {
      setCardHidden(card, datasetKey, predicate(card));
    });
  }

  function hideUpcomingStreams(root = document) {
    hideMatchingCards(
      root,
      CONFIG.hideUpcomingStreams,
      UPCOMING_STREAM_SCAN_SELECTOR,
      "ytpplUpcomingHidden",
      isUpcomingStreamCard,
    );
  }

  function hasPayToWatchText(card) {
    const candidates = new Set();
    if (card.matches(PAY_TO_WATCH_TEXT_SELECTOR)) {
      candidates.add(card);
    }
    card
      .querySelectorAll(PAY_TO_WATCH_TEXT_SELECTOR)
      .forEach((el) => candidates.add(el));

    return Array.from(candidates).some((el) => {
      const text = getElementText(el);
      const label = el.getAttribute("aria-label") || "";
      return /\bPay to watch\b/i.test(text) || /\bPay to watch\b/i.test(label);
    });
  }

  function isPayToWatchCard(card) {
    if (!card || isExcludedSurface(card)) {
      return false;
    }
    return hasPayToWatchText(card);
  }

  function hidePayToWatchCards(root = document) {
    hideMatchingCards(
      root,
      CONFIG.hidePayToWatchCards,
      PAY_TO_WATCH_SCAN_SELECTOR,
      "ytpplPayToWatchHidden",
      isPayToWatchCard,
    );
  }

  // YouTube uses several thumbnail progress renderers; keep this layered from
  // explicit values to measured width.
  function parsePercentFromText(text) {
    const match = String(text || "").match(/\b(\d+(?:\.\d+)?)\s*%/);
    return match ? Number(match[1]) : null;
  }

  function parseScaleXPercent(text) {
    const match = String(text || "").match(/scaleX\((\d*\.?\d+)\)/i);
    if (!match) {
      return null;
    }

    const value = Number(match[1]);
    if (!Number.isFinite(value)) {
      return null;
    }

    return value <= 1 ? value * 100 : value;
  }

  function parseProgressValue(value, max = 100) {
    if (value === null || value === "") {
      return null;
    }

    const number = Number(value);
    const maximum = Number(max) || 100;
    if (!Number.isFinite(number) || number < 0 || maximum <= 0) {
      return null;
    }

    return clamp((number / maximum) * 100, 0, 100);
  }

  function getInlineWidthPercent(el) {
    const width = parsePercentFromText(el.style && el.style.width);
    if (width !== null) {
      return width;
    }

    const style = el.getAttribute("style");
    const styleWidth = parsePercentFromText(style);
    if (styleWidth !== null) {
      return styleWidth;
    }

    return parseScaleXPercent((el.style && el.style.transform) || style);
  }

  function getAttributeProgressPercent(el) {
    const value = parseProgressValue(
      el.getAttribute("aria-valuenow"),
      el.getAttribute("aria-valuemax"),
    );
    if (value !== null) {
      return value;
    }

    return parseProgressValue(
      el.getAttribute("value"),
      el.getAttribute("max"),
    );
  }

  function getMeasuredWidthPercent(el) {
    const parent = el.parentElement;
    if (!parent) {
      return null;
    }

    const rect = el.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    if (!rect.width || !parentRect.width) {
      return null;
    }

    return clamp((rect.width / parentRect.width) * 100, 0, 100);
  }

  function getWatchedProgressPercent(progressEl) {
    const candidates = [];
    if (progressEl.matches(WATCHED_PROGRESS_VALUE_SELECTOR)) {
      candidates.push(progressEl);
    }
    candidates.push(
      ...progressEl.querySelectorAll(WATCHED_PROGRESS_VALUE_SELECTOR),
    );

    for (const candidate of candidates) {
      const attributeProgress = getAttributeProgressPercent(candidate);
      if (attributeProgress !== null) {
        return attributeProgress;
      }

      const width = getInlineWidthPercent(candidate);
      if (width !== null) {
        return width;
      }

      const label = [
        candidate.getAttribute("aria-label"),
        candidate.getAttribute("title"),
      ].join(" ");
      const labelledPercent = parsePercentFromText(label);
      if (labelledPercent !== null) {
        return labelledPercent;
      }
    }

    const containerLabel = [
      progressEl.getAttribute("aria-label"),
      progressEl.getAttribute("title"),
    ].join(" ");
    const containerLabelledPercent = parsePercentFromText(containerLabel);
    if (containerLabelledPercent !== null) {
      return containerLabelledPercent;
    }

    const containerAttributeProgress = getAttributeProgressPercent(progressEl);
    if (containerAttributeProgress !== null) {
      return containerAttributeProgress;
    }

    return candidates.length ? getMeasuredWidthPercent(candidates[0]) : null;
  }

  function isWatchedVideoCard(card) {
    if (!card || isExcludedSurface(card)) {
      return false;
    }

    const threshold = clamp(CONFIG.watchedVideoThresholdPercent, 1, 100);
    return Array.from(card.querySelectorAll(WATCHED_PROGRESS_SELECTOR)).some(
      (progressEl) => {
        const progress = getWatchedProgressPercent(progressEl);
        return progress !== null && progress >= threshold;
      },
    );
  }

  function hideWatchedVideos(root = document) {
    hideMatchingCards(
      root,
      CONFIG.hideWatchedVideos,
      WATCHED_VIDEO_SCAN_SELECTOR,
      "ytpplWatchedHidden",
      isWatchedVideoCard,
    );
  }

  function clearLegacyHiddenWatchActionButtons(root = document) {
    if (legacyActionHiddenCleared) {
      return;
    }

    legacyActionHiddenCleared = true;
    collectMatchingElements(root, WATCH_ACTION_HIDDEN_SELECTOR).forEach(
      (buttonModel) => {
        delete buttonModel.dataset[WATCH_ACTION_HIDDEN_DATASET_KEY];
        buttonModel.hidden = false;
      },
    );
  }

  function createRestoredDislikeIcon() {
    const icon = document.createElement("div");
    icon.className = [
      "ytSpecButtonShapeNextIcon",
      "ytSpecButtonShapeNextElevatedContent",
      RESTORED_DISLIKE_ICON_CLASS,
    ].join(" ");
    icon.setAttribute("aria-hidden", "true");

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("focusable", "false");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute(
      "d",
      "M10 15v4a2 2 0 0 0 2 2l4-7V3H6.5a2 2 0 0 0-1.92 1.44l-2.33 8A2 2 0 0 0 4.17 15H10ZM16 3h2.7A2.3 2.3 0 0 1 21 5.3v6.4a2.3 2.3 0 0 1-2.3 2.3H16",
    );
    svg.appendChild(path);
    icon.appendChild(svg);

    return icon;
  }

  function createRydTextContainer(text) {
    const source = document.querySelector(RYD_LIKE_TEXT_SELECTOR);
    const textContainer = source
      ? source.cloneNode(true)
      : document.createElement("div");

    if (!source) {
      textContainer.className = [
        "ytSpecButtonShapeNextButtonTextContent",
        "ytSpecButtonShapeNextElevatedContent",
      ].join(" ");
    }

    textContainer.textContent = text || "";
    return textContainer;
  }

  function removeDirectTextNodes(el) {
    Array.from(el.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.remove();
      }
    });
  }

  function normaliseRydDislikeButton(button) {
    if (!button || closestElement(button, EXCLUDED_SURFACE_SELECTOR)) {
      return;
    }

    const existingText = getNormalisedLabel(button.innerText);
    let textContainer = button.querySelector(RYD_TEXT_CONTAINER_SELECTOR);
    if (textContainer && textContainer.matches("button")) {
      textContainer = null;
    }

    if (!button.querySelector(RYD_ICON_SELECTOR)) {
      button.insertBefore(createRestoredDislikeIcon(), button.firstChild);
    }

    if (!textContainer) {
      button.appendChild(createRydTextContainer(existingText));
      removeDirectTextNodes(button);
    }

    button.classList.remove(
      "ytSpecButtonShapeNextIconButton",
      "yt-spec-button-shape-next--icon-button",
    );
    button.classList.add(
      "ytSpecButtonShapeNextIconLeading",
      "yt-spec-button-shape-next--icon-leading",
    );
  }

  function normaliseReturnYoutubeDislikeButtons(root = document) {
    collectMatchingElements(root, RYD_DISLIKE_BUTTON_SELECTOR).forEach(
      normaliseRydDislikeButton,
    );
  }

  function getNormalisedLabel(text) {
    return String(text || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getWatchActionLabels(actionElement) {
    const labelledElements = new Set([actionElement]);
    actionElement
      .querySelectorAll("button, [aria-label], [title]")
      .forEach((el) => labelledElements.add(el));

    const labels = [];
    labelledElements.forEach((el) => {
      labels.push(el.getAttribute("aria-label"));
      labels.push(el.getAttribute("title"));
    });
    labels.push(actionElement.innerText);
    labels.push(getElementText(actionElement));

    return labels.map(getNormalisedLabel).filter(Boolean);
  }

  function isPreservedWatchActionButton(buttonModel) {
    return Boolean(
      buttonModel.matches(WATCH_ACTION_PRESERVE_SELECTOR) ||
        closestElement(buttonModel, WATCH_ACTION_PRESERVE_SELECTOR),
    );
  }

  function isWatchActionMatch(actionElement, label) {
    const normalisedLabel = label.toLowerCase();

    return getWatchActionLabels(actionElement).some((candidate) => {
      const normalisedCandidate = candidate.toLowerCase();
      return (
        normalisedCandidate === normalisedLabel ||
        normalisedCandidate.startsWith(`${normalisedLabel} `)
      );
    });
  }

  function setWatchActionHidden(actionElement, hidden) {
    if (hidden) {
      actionElement.dataset[WATCH_ACTION_HIDDEN_DATASET_KEY] =
        WATCH_ACTION_HIDDEN_VALUE;
      actionElement.hidden = true;
      return;
    }

    if (
      actionElement.dataset[WATCH_ACTION_HIDDEN_DATASET_KEY] !==
      WATCH_ACTION_HIDDEN_VALUE
    ) {
      return;
    }

    delete actionElement.dataset[WATCH_ACTION_HIDDEN_DATASET_KEY];
    actionElement.hidden = false;
  }

  function getWatchActionMenuItemContainer(menuItem) {
    return (
      closestElement(menuItem, WATCH_ACTION_MENU_ITEM_RENDERER_SELECTOR) ||
      closestElement(menuItem, WATCH_ACTION_MENU_ITEM_FALLBACK_SELECTOR) ||
      menuItem
    );
  }

  function isConfiguredWatchActionMatch(actionElement) {
    return WATCH_ACTION_BUTTON_RULES.some(
      ({ configKey, label }) =>
        CONFIG[configKey] && isWatchActionMatch(actionElement, label),
    );
  }

  function hideWatchActionButtons(root = document) {
    collectMatchingElements(root, WATCH_ACTION_BUTTON_SELECTOR).forEach(
      (buttonModel) => {
        if (isPreservedWatchActionButton(buttonModel)) {
          setWatchActionHidden(buttonModel, false);
          return;
        }

        setWatchActionHidden(
          buttonModel,
          isConfiguredWatchActionMatch(buttonModel),
        );
      },
    );
  }

  function hideWatchActionMenuItems(root = document) {
    if (!isWatchPath()) {
      return;
    }

    const menuItems = new Set();
    collectMatchingElements(root, WATCH_ACTION_MENU_ITEM_SELECTOR).forEach(
      (menuItem) => {
        menuItems.add(getWatchActionMenuItemContainer(menuItem));
      },
    );

    menuItems.forEach((menuItem) => {
      setWatchActionHidden(menuItem, isConfiguredWatchActionMatch(menuItem));
    });
  }

  function buildVolumeOverlayCss() {
    return `
      .${VOLUME_OVERLAY_CLASS} {
        position: fixed !important;
        z-index: 2147483647 !important;
        min-width: 0 !important;
        padding: 0 6px !important;
        border: 0 !important;
        border-radius: 4px !important;
        box-sizing: border-box !important;
        background: transparent !important;
        box-shadow: none !important;
        color: #ffff00 !important;
        font: 700 42px/1.1 Roboto, Arial, sans-serif !important;
        letter-spacing: 0 !important;
        text-align: center !important;
        text-shadow:
          0 1px 2px rgba(0, 0, 0, 0.92),
          0 3px 7px rgba(0, 0, 0, 0.78),
          0 8px 18px rgba(0, 0, 0, 0.58) !important;
        white-space: nowrap !important;
        opacity: 0 !important;
        pointer-events: none !important;
        transition: opacity 120ms ease-out, transform 120ms ease-out !important;
      }

      .${VOLUME_OVERLAY_CLASS}[data-visible="1"] {
        opacity: 1 !important;
      }
    `;
  }

  function buildShortsCss() {
    if (!CONFIG.hideShorts) {
      return "";
    }

    return `
        ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts]),
        ytd-rich-section-renderer:has(ytd-reel-shelf-renderer),
        ytd-rich-section-renderer:has(a[href^="/shorts/"]),
        ytd-rich-item-renderer:has(a[href^="/shorts/"]),
        ytd-video-renderer:has(a[href^="/shorts/"]),
        ytd-grid-video-renderer:has(a[href^="/shorts/"]),
        ytd-reel-shelf-renderer,
        ytd-reel-item-renderer,
        ytd-shorts,
        ytd-guide-entry-renderer:has(a[title="Shorts"]),
        ytd-mini-guide-entry-renderer:has(a[title="Shorts"]) {
          display: none !important;
        }
      `;
  }

  function buildWatchCleanupCss() {
    const rules = [];
    if (CONFIG.hideRelatedVideos) {
      rules.push(`
        ytd-watch-flexy #secondary ytd-watch-next-secondary-results-renderer.style-scope,
        ytd-watch-flexy #secondary #related {
          display: none !important;
        }
      `);
    }

    rules.push(`
        ytd-watch-flexy ytd-menu-renderer ${WATCH_ACTION_HIDDEN_SELECTOR},
        ytd-popup-container ${WATCH_ACTION_HIDDEN_SELECTOR},
        tp-yt-iron-dropdown ${WATCH_ACTION_HIDDEN_SELECTOR} {
          display: none !important;
        }

        ytd-watch-flexy ytd-menu-renderer .${RESTORED_DISLIKE_ICON_CLASS} {
          align-items: center !important;
          display: flex !important;
          flex: 0 0 24px !important;
          height: 24px !important;
          justify-content: center !important;
          opacity: 1 !important;
          visibility: visible !important;
          width: 24px !important;
        }

        ytd-watch-flexy ytd-menu-renderer .${RESTORED_DISLIKE_ICON_CLASS} svg {
          display: block !important;
          fill: none !important;
          height: 24px !important;
          stroke: currentColor !important;
          stroke-linecap: round !important;
          stroke-linejoin: round !important;
          stroke-width: 1.8 !important;
          width: 24px !important;
        }
      `);

    if (CONFIG.hideMerchShelf) {
      rules.push(`
        ytd-watch-flexy ytd-merch-shelf-renderer {
          display: none !important;
        }
      `);
    }

    if (CONFIG.hideJoinButton) {
      rules.push(`
        ytd-watch-flexy ytd-video-owner-renderer #sponsor-button,
        ytd-watch-flexy ytd-video-owner-renderer yt-button-view-model:has(a[href*="/channel/"][href*="/join"]),
        ytd-watch-flexy ytd-video-owner-renderer button-view-model:has(a[href*="/channel/"][href*="/join"]) {
          display: none !important;
        }
      `);
    }

    if (CONFIG.hideStatementBanners) {
      rules.push(`
        ytd-watch-flexy ytd-statement-banner-renderer,
        ytd-watch-flexy yt-statement-banner-view-model,
        ytd-watch-flexy .ytStatementBannerViewModelHost {
          display: none !important;
        }
      `);
    }

    if (CONFIG.hideMetadataTeaserCarousel) {
      rules.push(`
        ytd-watch-flexy ytd-watch-metadata #teaser-carousel {
          display: none !important;
        }
      `);
    }

    if (CONFIG.hideStructuredDescription) {
      rules.push(`
        ytd-watch-flexy ytd-structured-description-content-renderer#structured-description,
        ytd-watch-flexy ytd-structured-description-content-renderer how-this-was-made-section-view-model,
        ytd-watch-flexy ytd-structured-description-content-renderer .ytHowThisWasMadeSectionViewModelHost,
        ytd-watch-flexy ytd-structured-description-content-renderer yt-video-description-youchat-section-view-model,
        ytd-watch-flexy ytd-structured-description-content-renderer .ytVideoDescriptionYouchatSectionViewModelHost,
        ytd-watch-flexy ytd-structured-description-content-renderer yt-video-attributes-section-view-model .videoAttributesSectionViewModelFooterButton,
        ytd-watch-flexy ytd-structured-description-content-renderer .ytVideoAttributesSectionViewModelHost .videoAttributesSectionViewModelFooterButton,
        ytd-watch-flexy ytd-structured-description-content-renderer ytd-video-description-transcript-section-renderer,
        ytd-watch-flexy ytd-structured-description-content-renderer ytd-video-description-infocards-section-renderer,
        ytd-watch-flexy ytd-structured-description-content-renderer yt-video-description-infocards-section-renderer,
        ytd-watch-flexy ytd-structured-description-content-renderer .yt-video-description-infocards-section-renderer {
          display: none !important;
        }
      `);
    }

    return rules.join("\n");
  }

  function buildWatchLayoutCss() {
    if (!CONFIG.hideChat) {
      return "";
    }

    return `
        ytd-watch-flexy #below,
        ytd-watch-flexy ytd-watch-metadata,
        ytd-watch-flexy #bottom-row,
        ytd-watch-flexy #top-row {
          box-sizing: border-box !important;
          max-width: 100% !important;
          min-width: 0 !important;
          width: 100% !important;
        }

        ytd-watch-flexy ytd-watch-metadata #description.ytd-watch-metadata {
          box-sizing: border-box !important;
          flex: 1 1 auto !important;
          max-width: 100% !important;
          min-width: 0 !important;
          width: 100% !important;
        }

        ytd-watch-flexy ytd-watch-metadata #description-inner.ytd-watch-metadata,
        ytd-watch-flexy ytd-watch-metadata #description-inline-expander.ytd-watch-metadata,
        ytd-watch-flexy ytd-watch-metadata ytd-text-inline-expander,
        ytd-watch-flexy ytd-watch-metadata ytd-watch-info-text {
          box-sizing: border-box !important;
          max-width: 100% !important;
          min-width: 0 !important;
          width: auto !important;
        }

        ytd-watch-flexy #panels-full-bleed-container:empty,
        ytd-watch-flexy #panels-full-bleed-container:not(:has(*)) {
          display: none !important;
          flex: 0 0 0 !important;
          max-width: 0 !important;
          min-width: 0 !important;
          width: 0 !important;
        }

        ytd-watch-flexy #panels:has(ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-live-chat"]),
        ytd-watch-flexy ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-live-chat"],
        ytd-watch-flexy ytd-engagement-panel-section-list-renderer:has(ytd-live-chat-frame),
        ytd-watch-flexy ytd-engagement-panel-section-list-renderer:has(yt-live-chat-app),
        ytd-watch-flexy ytd-engagement-panel-section-list-renderer:has(ytd-watch-live-chat-renderer),
        ytd-watch-flexy ytd-engagement-panel-section-list-renderer:has(ytd-watch-live-chat-replay-renderer),
        ytd-watch-flexy #chat-container,
        ytd-watch-flexy #chat,
        ytd-watch-flexy ytd-live-chat-frame,
        ytd-watch-live-chat-renderer,
        ytd-watch-live-chat-replay-renderer,
        ytd-live-chat-viewer-engagement-message-renderer,
        ytd-watch-flexy ytd-watch-metadata #teaser-carousel.ytd-watch-metadata:has(yt-carousel-item-view-model[aria-label="Live chat replay"]),
        ytd-watch-flexy ytd-watch-metadata #teaser-carousel.ytd-watch-metadata:has(yt-carousel-item-view-model[aria-label*="Live chat" i]),
        ytd-watch-flexy yt-video-metadata-carousel-view-model:has(yt-carousel-item-view-model[aria-label="Live chat replay"]),
        ytd-watch-flexy yt-video-metadata-carousel-view-model:has(yt-carousel-item-view-model[aria-label*="Live chat" i]),
        ytd-watch-flexy .ytVideoMetadataCarouselViewModelHost:has(yt-carousel-item-view-model[aria-label="Live chat replay"]),
        ytd-watch-flexy .ytVideoMetadataCarouselViewModelHost:has(yt-carousel-item-view-model[aria-label*="Live chat" i]),
        ytd-watch-flexy .ytVideoMetadataCarouselViewModelCarouselContainer:has(yt-carousel-item-view-model[aria-label="Live chat replay"]),
        ytd-watch-flexy .ytVideoMetadataCarouselViewModelCarouselContainer:has(yt-carousel-item-view-model[aria-label*="Live chat" i]),
        ytd-watch-flexy .ytVideoMetadataCarouselViewModelTitleSection:has(+ .ytVideoMetadataCarouselViewModelCarouselContainer yt-carousel-item-view-model[aria-label="Live chat replay"]),
        ytd-watch-flexy .ytVideoMetadataCarouselViewModelTitleSection:has(+ .ytVideoMetadataCarouselViewModelCarouselContainer yt-carousel-item-view-model[aria-label*="Live chat" i]) {
          display: none !important;
        }
      `;
  }

  function buildPlayerOverlayCss() {
    if (!CONFIG.hideInfoCardsAndEndScreens) {
      return "";
    }

    return `
        .html5-video-player .ytp-cards-button,
        .html5-video-player .ytp-cards-teaser,
        .html5-video-player .ytp-ce-element,
        .html5-video-player .ytp-ce-covering-overlay,
        .html5-video-player .ytp-ce-expanding-overlay,
        .html5-video-player .ytp-ce-hide-button-container,
        .html5-video-player .ytp-endscreen-content,
        .html5-video-player .ytp-endscreen-previous,
        .html5-video-player .ytp-endscreen-next,
        .html5-video-player .ytp-endscreen-paginate,
        .html5-video-player .ytp-paid-content-overlay {
          display: none !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `;
  }

  function buildCss() {
    return [
      buildVolumeOverlayCss(),
      buildShortsCss(),
      buildWatchCleanupCss(),
      buildWatchLayoutCss(),
      buildPlayerOverlayCss(),
    ]
      .filter((css) => css.trim())
      .join("\n");
  }

  function ensureStyles() {
    const css = buildCss();
    if (!css.trim()) {
      return;
    }

    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(style);
    }

    if (style.textContent !== css) {
      style.textContent = css;
    }
  }

  function getWatchFlexy() {
    return document.querySelector("ytd-watch-flexy");
  }

  function isTheaterModeEnabled() {
    const flexy = getWatchFlexy();
    if (!flexy) {
      return false;
    }

    return (
      flexy.hasAttribute("theater") ||
      flexy.hasAttribute("theatre") ||
      flexy.hasAttribute("is-watch-wide")
    );
  }

  function enableTheaterMode() {
    if (
      !CONFIG.enableTheaterMode ||
      theaterModeUserDisabled ||
      !isWatchPath() ||
      isTheaterModeEnabled()
    ) {
      return;
    }
    if (document.fullscreenElement) {
      return;
    }

    const player = document.querySelector("#movie_player, .html5-video-player");
    const sizeButton = player && player.querySelector(".ytp-size-button");
    if (
      !sizeButton ||
      sizeButton.disabled ||
      sizeButton.getAttribute("aria-disabled") === "true"
    ) {
      return;
    }

    sizeButton.click();
  }

  function handleTheaterModeToggle(event) {
    if (!CONFIG.enableTheaterMode || !isWatchPath()) {
      return;
    }
    if (!closestElement(event.target, ".ytp-size-button")) {
      return;
    }

    theaterModeUserDisabled = isTheaterModeEnabled();
  }

  function getPlayerFromTarget(target) {
    if (!target || isExcludedSurface(target)) {
      return null;
    }
    return closestElement(target, "#movie_player, .html5-video-player");
  }

  function getPlayerVideo(player) {
    return player ? player.querySelector("video") : null;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function getVolumeOverlay() {
    const parent =
      document.fullscreenElement || document.body || document.documentElement;
    let overlay = document.querySelector(`.${VOLUME_OVERLAY_CLASS}`);

    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = VOLUME_OVERLAY_CLASS;
      overlay.setAttribute("aria-hidden", "true");
    }

    if (overlay.parentElement !== parent) {
      parent.appendChild(overlay);
    }

    return overlay;
  }

  function showVolumeOverlay(player, percent) {
    const overlay = getVolumeOverlay();
    const rect = player.getBoundingClientRect();
    const left = clamp(rect.left + rect.width / 2, 96, innerWidth - 96);
    const top = clamp(rect.top + rect.height / 3, 40, innerHeight - 40);

    overlay.style.left = `${Math.round(left)}px`;
    overlay.style.top = `${Math.round(top)}px`;
    overlay.style.transform = "translate(-50%, -50%)";
    overlay.textContent = String(percent);
    overlay.dataset.visible = "1";

    clearTimeout(volumeOverlayHideTimer);
    volumeOverlayHideTimer = setTimeout(() => {
      overlay.dataset.visible = "0";
    }, 850);
  }

  function setPlayerVolume(player, nextVolume) {
    const video = getPlayerVideo(player);
    if (!video) {
      return null;
    }

    const nextPercent = Math.round(clamp(nextVolume, 0, 1) * 100);

    if (typeof player.setVolume === "function") {
      player.setVolume(nextPercent);
    }

    video.volume = nextPercent / 100;

    if (nextPercent > 0) {
      if (typeof player.unMute === "function") {
        player.unMute();
      }
      video.muted = false;
    }

    return nextPercent;
  }

  function handleWheelVolume(event) {
    if (!CONFIG.enablePlayerWheelVolume) {
      return;
    }

    const player = getPlayerFromTarget(event.target);
    if (!player) {
      return;
    }

    const rightButtonPressed =
      (event.buttons & 2) === 2 || rightButtonHeldOnPlayer;
    if (CONFIG.requireRightMouseButtonForWheelVolume && !rightButtonPressed) {
      return;
    }

    const video = getPlayerVideo(player);
    if (!video) {
      return;
    }

    const direction = event.deltaY < 0 ? 1 : -1;
    const step = clamp(CONFIG.wheelVolumeStep, 1, 100) / 100;
    const nextVolume = clamp(video.volume + direction * step, 0, 1);

    const nextPercent = setPlayerVolume(player, nextVolume);
    if (nextPercent === null) {
      return;
    }

    showVolumeOverlay(player, nextPercent);

    event.preventDefault();
    event.stopImmediatePropagation();

    if (CONFIG.requireRightMouseButtonForWheelVolume) {
      suppressNextContextMenu = true;
    }
  }

  function handleMouseDown(event) {
    if (event.button !== 2) {
      return;
    }
    rightButtonHeldOnPlayer = Boolean(getPlayerFromTarget(event.target));
  }

  function handleMouseUp(event) {
    if (event.button !== 2) {
      return;
    }
    rightButtonHeldOnPlayer = false;
  }

  function handleContextMenu(event) {
    if (!suppressNextContextMenu) {
      return;
    }
    if (!getPlayerFromTarget(event.target)) {
      return;
    }

    suppressNextContextMenu = false;
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  function applyPreferences(root = document) {
    clearLegacyHiddenWatchActionButtons(root);
    ensureStyles();
    convertCurrentShortsPage();
    rewriteShortsLinks(root);
    hideUpcomingStreams(root);
    hidePayToWatchCards(root);
    hideWatchedVideos(root);
    normaliseReturnYoutubeDislikeButtons(root);
    hideWatchActionButtons(root);
    hideWatchActionMenuItems(root);

    if (isWatchPath()) {
      setTimeout(enableTheaterMode, 300);
      setTimeout(enableTheaterMode, 1200);
    }
  }

  function handleNavigateFinish() {
    theaterModeUserDisabled = false;
    applyPreferences(document);
  }

  function scheduleApply(root = document) {
    if (scheduled) {
      return;
    }

    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      applyPreferences(root);
    });
  }

  function shouldScheduleForMutation(mutation) {
    if (mutation.addedNodes && mutation.addedNodes.length) {
      return true;
    }

    if (mutation.type !== "attributes" && mutation.type !== "characterData") {
      return false;
    }

    return Boolean(
      closestElement(mutation.target, WATCH_ACTION_MUTATION_SELECTOR),
    );
  }

  applyPreferences(document);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (shouldScheduleForMutation(mutation)) {
        scheduleApply(document);
        break;
      }
    }
  });

  observer.observe(document.documentElement, {
    attributeFilter: ["aria-label", "title"],
    attributes: true,
    childList: true,
    characterData: true,
    subtree: true,
  });

  document.addEventListener("click", handleShortsClick, true);
  document.addEventListener("click", handleTheaterModeToggle, true);
  document.addEventListener("wheel", handleWheelVolume, {
    capture: true,
    passive: false,
  });
  document.addEventListener("mousedown", handleMouseDown, true);
  document.addEventListener("mouseup", handleMouseUp, true);
  document.addEventListener("contextmenu", handleContextMenu, true);

  window.addEventListener("yt-navigate-finish", handleNavigateFinish, true);
  window.addEventListener(
    "yt-page-data-updated",
    () => applyPreferences(document),
    true,
  );
})();
