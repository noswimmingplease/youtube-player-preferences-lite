# YouTube Player Preferences Lite

Tampermonkey userscript that applies a small set of YouTube player preferences without using Enhancer for YouTube's miniplayer, queue, autoplay, or background playback controls.

## Features

- Converts Shorts URLs to normal watch URLs.
- Hides Shorts shelves, Shorts cards, and Shorts guide entries.
- Hides upcoming live-stream and pay-to-watch recommendation cards.
- Hides the watch-page related recommendations renderer without touching playlist or queue panels.
- Natively collapses live chat before hiding chat, chat replay, and below-video live chat engagement panels.
- Hides volatile inline watch action buttons, including Save when YouTube promotes it beside like/dislike.
- Hides info cards, paid-content overlays, and end-screen overlays.
- Automatically enables YouTube theatre mode on watch/live pages.
- Adds mouse-wheel volume control over the player, only while holding the right mouse button.
- Shows a temporary top-centre volume percentage overlay when script-controlled volume changes.

## Deliberately Not Included

- Custom miniplayer behaviour.
- Queue or playlist panel changes.
- Autoplay/background-tab playback control.
- Volume boosting beyond YouTube's normal 0-100% range.
- Watch-page full-width layout, which belongs in `YouTube Watch Layout Cleaner`.

## Install Tampermonkey

Install Tampermonkey first, then install this userscript. Tampermonkey officially supports Chrome, Microsoft Edge, Firefox, Safari, and Opera Next. Zen Browser can use Firefox extensions, so use the Firefox Tampermonkey extension for Zen.

- Chrome: <https://www.tampermonkey.net/?browser=chrome>
- Microsoft Edge: <https://www.tampermonkey.net/?browser=edge>
- Firefox: <https://www.tampermonkey.net/?browser=firefox>
- Zen Browser: install the Firefox Tampermonkey extension; Zen extension documentation is at <https://docs.zen-browser.app/user-manual/extensions>
- Safari: <https://www.tampermonkey.net/?browser=safari>
- Opera: <https://www.tampermonkey.net/?browser=opera>

## Install This Script

[Install YouTube Player Preferences Lite](https://raw.githubusercontent.com/Ci303/youtube-player-preferences-lite/main/youtube-player-preferences-lite.user.js)

Tampermonkey should open its installation page. Review the script, then select **Install**.

For a manual import, use the same raw URL in Tampermonkey's import-from-URL tool.

## Scope

This script avoids `ytd-miniplayer`, playlist panels, and queue panels. If YouTube changes its markup, selector updates may be needed.

## Updating

Tampermonkey checks the script's `@updateURL` and installs a newer published `@version` automatically. You can also check for userscript updates manually from the Tampermonkey Dashboard.
