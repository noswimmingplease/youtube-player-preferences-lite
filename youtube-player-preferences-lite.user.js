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
    hideRelatedVideos: true,
    hideChat: true,
    hideInfoCardsAndEndScreens: true,
    enableTheaterMode: true,
    enablePlayerWheelVolume: true,
    requireRightMouseButtonForWheelVolume: true,
    wheelVolumeStep: 5,
  };

  const STYLE_ID = "ytppl-style";
  const VOLUME_OVERLAY_CLASS = "ytppl-volume-overlay";
  const SHORTS_LINK_SELECTOR = 'a[href^="/shorts/"], a[href*="youtube.com/shorts/"]';
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

  let scheduled = false;
  let rightButtonHeldOnPlayer = false;
  let suppressNextContextMenu = false;
  let volumeOverlayHideTimer = 0;

  function isWatchPath() {
    return location.pathname === WATCH_PATHS[0] || location.pathname.startsWith(WATCH_PATHS[1]);
  }

  function isShortsPath() {
    return location.pathname.startsWith("/shorts/");
  }

  function isExcludedSurface(target) {
    return Boolean(closestElement(target, EXCLUDED_SURFACE_SELECTOR));
  }

  function closestElement(target, selector) {
    if (!target) return null;

    const el = target.nodeType === Node.ELEMENT_NODE ? target : target.parentElement;
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

  function convertCurrentShortsPage() {
    if (!CONFIG.convertShortsToWatch || !isShortsPath()) return;

    const shortId = getShortsIdFromUrl(location.href);
    if (!shortId) return;

    location.replace(getWatchUrlForShort(shortId));
  }

  function rewriteShortsLinks(root = document) {
    if (!CONFIG.convertShortsToWatch) return;

    root.querySelectorAll(SHORTS_LINK_SELECTOR).forEach((link) => {
      const shortId = getShortsIdFromUrl(link.href || link.getAttribute("href"));
      if (!shortId) return;

      link.href = getWatchUrlForShort(shortId);
      link.dataset.ytpplShortsConverted = "1";
    });
  }

  function handleShortsClick(event) {
    if (!CONFIG.convertShortsToWatch) return;

    const link = closestElement(event.target, SHORTS_LINK_SELECTOR);
    if (!link || isExcludedSurface(link)) return;

    const shortId = getShortsIdFromUrl(link.href || link.getAttribute("href"));
    if (!shortId) return;

    event.preventDefault();
    event.stopPropagation();
    location.assign(getWatchUrlForShort(shortId));
  }

  function buildCss() {
    const rules = [`
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
        font: 800 42px/1.1 "Segoe UI Variable Display", "Segoe UI", Roboto, Arial, Helvetica, sans-serif !important;
        -webkit-text-fill-color: #ffff00 !important;
        -webkit-text-stroke: 3.4px rgba(0, 0, 0, 0.9) !important;
        letter-spacing: 0 !important;
        text-align: center !important;
        text-shadow:
          0 0 2px rgba(0, 0, 0, 0.95),
          0 3px 10px rgba(0, 0, 0, 0.78) !important;
        white-space: nowrap !important;
        opacity: 0 !important;
        pointer-events: none !important;
        transition: opacity 120ms ease-out, transform 120ms ease-out !important;
      }

      .${VOLUME_OVERLAY_CLASS}[data-visible="1"] {
        opacity: 1 !important;
      }
    `];

    if (CONFIG.hideShorts) {
      rules.push(`
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
      `);
    }

    if (CONFIG.hideRelatedVideos) {
      rules.push(`
        ytd-watch-flexy #secondary ytd-watch-next-secondary-results-renderer.style-scope,
        ytd-watch-flexy #secondary #related {
          display: none !important;
        }
      `);
    }

    if (CONFIG.hideChat) {
      rules.push(`
        ytd-watch-flexy #below,
        ytd-watch-flexy ytd-watch-metadata,
        ytd-watch-flexy ytd-watch-metadata #description.ytd-watch-metadata,
        ytd-watch-flexy ytd-watch-metadata #description-inner.ytd-watch-metadata,
        ytd-watch-flexy ytd-watch-metadata #description-inline-expander.ytd-watch-metadata,
        ytd-watch-flexy ytd-watch-metadata ytd-text-inline-expander,
        ytd-watch-flexy ytd-watch-metadata ytd-watch-info-text,
        ytd-watch-flexy #bottom-row,
        ytd-watch-flexy #top-row {
          max-width: 100% !important;
          min-width: 0 !important;
          width: 100% !important;
        }

        ytd-watch-flexy ytd-watch-metadata #description.ytd-watch-metadata,
        ytd-watch-flexy ytd-watch-metadata #description-inner.ytd-watch-metadata,
        ytd-watch-flexy ytd-watch-metadata #description-inline-expander.ytd-watch-metadata {
          flex: 1 1 auto !important;
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
      `);
    }

    if (CONFIG.hideInfoCardsAndEndScreens) {
      rules.push(`
        .html5-video-player .ytp-cards-button,
        .html5-video-player .ytp-cards-teaser,
        .html5-video-player .ytp-ce-element,
        .html5-video-player .ytp-ce-covering-overlay,
        .html5-video-player .ytp-ce-expanding-overlay,
        .html5-video-player .ytp-endscreen-content,
        .html5-video-player .ytp-endscreen-previous,
        .html5-video-player .ytp-endscreen-next,
        .html5-video-player .ytp-endscreen-paginate,
        .html5-video-player .ytp-videowall-still,
        .html5-video-player .ytp-suggestion-set,
        .html5-video-player .ytp-autonav-endscreen-upnext-container,
        .html5-video-player .ytp-upnext,
        .html5-video-player .ytp-paid-content-overlay {
          display: none !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `);
    }

    return rules.join("\n");
  }

  function ensureStyles() {
    const css = buildCss();
    if (!css.trim()) return;

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
    if (!flexy) return false;

    return (
      flexy.hasAttribute("theater") ||
      flexy.hasAttribute("theatre") ||
      flexy.hasAttribute("is-watch-wide")
    );
  }

  function enableTheaterMode() {
    if (!CONFIG.enableTheaterMode || !isWatchPath() || isTheaterModeEnabled()) return;
    if (document.fullscreenElement) return;

    const player = document.querySelector("#movie_player, .html5-video-player");
    const sizeButton = player && player.querySelector(".ytp-size-button");
    if (!sizeButton || sizeButton.disabled || sizeButton.getAttribute("aria-disabled") === "true") return;

    sizeButton.click();
  }

  function getPlayerFromTarget(target) {
    if (!target || isExcludedSurface(target)) return null;
    return closestElement(target, "#movie_player, .html5-video-player");
  }

  function getPlayerVideo(player) {
    return player ? player.querySelector("video") : null;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function getVolumeOverlay() {
    const parent = document.fullscreenElement || document.body || document.documentElement;
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
    if (!video) return null;

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
    if (!CONFIG.enablePlayerWheelVolume) return;

    const player = getPlayerFromTarget(event.target);
    if (!player) return;

    const rightButtonPressed = (event.buttons & 2) === 2 || rightButtonHeldOnPlayer;
    if (CONFIG.requireRightMouseButtonForWheelVolume && !rightButtonPressed) return;

    const video = getPlayerVideo(player);
    if (!video) return;

    const direction = event.deltaY < 0 ? 1 : -1;
    const step = clamp(CONFIG.wheelVolumeStep, 1, 100) / 100;
    const nextVolume = clamp(video.volume + direction * step, 0, 1);

    const nextPercent = setPlayerVolume(player, nextVolume);
    if (nextPercent === null) return;

    showVolumeOverlay(player, nextPercent);

    event.preventDefault();
    event.stopImmediatePropagation();

    if (CONFIG.requireRightMouseButtonForWheelVolume) {
      suppressNextContextMenu = true;
    }
  }

  function handleMouseDown(event) {
    if (event.button !== 2) return;
    rightButtonHeldOnPlayer = Boolean(getPlayerFromTarget(event.target));
  }

  function handleMouseUp(event) {
    if (event.button !== 2) return;
    rightButtonHeldOnPlayer = false;
  }

  function handleContextMenu(event) {
    if (!suppressNextContextMenu) return;
    if (!getPlayerFromTarget(event.target)) return;

    suppressNextContextMenu = false;
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  function applyPreferences(root = document) {
    ensureStyles();
    convertCurrentShortsPage();
    rewriteShortsLinks(root);

    if (isWatchPath()) {
      setTimeout(enableTheaterMode, 300);
      setTimeout(enableTheaterMode, 1200);
    }
  }

  function scheduleApply(root = document) {
    if (scheduled) return;

    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      applyPreferences(root);
    });
  }

  applyPreferences(document);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes && mutation.addedNodes.length) {
        scheduleApply(document);
        break;
      }
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });

  document.addEventListener("click", handleShortsClick, true);
  document.addEventListener("wheel", handleWheelVolume, { capture: true, passive: false });
  document.addEventListener("mousedown", handleMouseDown, true);
  document.addEventListener("mouseup", handleMouseUp, true);
  document.addEventListener("contextmenu", handleContextMenu, true);

  window.addEventListener("yt-navigate-finish", () => applyPreferences(document), true);
  window.addEventListener("yt-page-data-updated", () => applyPreferences(document), true);
})();
