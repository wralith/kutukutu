import { toPng } from 'html-to-image';
import { initialsAvatarDataUrl, proxyAvatarUrl } from './avatar';

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function inlineImage(url: string): Promise<string | null> {
  const target = proxyAvatarUrl(url);
  try {
    const res = await fetch(target, { mode: 'cors' });
    if (!res.ok) return null;
    return await blobToDataUrl(await res.blob());
  } catch {
    return null;
  }
}

function waitForImage(img: HTMLImageElement): Promise<void> {
  return new Promise((resolve) => {
    if (img.complete) {
      resolve();
      return;
    }
    const finish = () => {
      img.removeEventListener('load', finish);
      img.removeEventListener('error', finish);
      resolve();
    };
    img.addEventListener('load', finish);
    img.addEventListener('error', finish);
  });
}

/**
 * Inputs render without their current value in a DOM snapshot, so swap them
 * for plain spans while capturing and restore them right after.
 */
function freezeInputs(root: HTMLElement): () => void {
  const inputs = Array.from(root.querySelectorAll('input'));
  const restores: Array<() => void> = [];

  for (const input of inputs) {
    const label = document.createElement('span');
    label.className = `${input.className} export-label`;
    label.textContent = input.value;
    const style = input.getAttribute('style');
    if (style) label.setAttribute('style', style);
    input.replaceWith(label);
    restores.push(() => label.replaceWith(input));
  }

  return () => {
    for (const restore of restores) restore();
  };
}

/**
 * Snapshots the live board element, so the exported PNG matches what is on
 * screen (same colors, sizes, labels and layout).
 */
export async function exportNode(node: HTMLElement, filename: string): Promise<void> {
  // Let the "Rendering…" state paint before the capture work starts.
  await new Promise((resolve) => setTimeout(resolve, 50));

  const swaps: Array<{ img: HTMLImageElement; src: string }> = [];

  try {
    await Promise.all(
      Array.from(node.querySelectorAll('img')).map(async (img) => {
        // Inline whatever the UI is currently showing (proxy or fallback).
        const src = img.currentSrc || img.getAttribute('src') || '';
        if (!src || src.startsWith('data:')) return;

        swaps.push({ img, src });
        const inlined = await inlineImage(src);
        img.src =
          inlined ??
          initialsAvatarDataUrl(img.dataset.handle ?? '', img.getAttribute('alt') ?? '?', 256);
        await waitForImage(img);
      }),
    );

    const restoreInputs = freezeInputs(node);
    node.classList.add('exporting');

    // Keep exports roughly the same resolution on phones and desktops.
    const width = node.getBoundingClientRect().width || node.offsetWidth || 900;
    const pixelRatio = Math.min(4, Math.max(1.5, 1600 / width));

    try {
      const dataUrl = await toPng(node, {
        pixelRatio,
        cacheBust: false,
        skipFonts: true,
        includeQueryParams: true,
        backgroundColor: '#eff1f5',
        // Never reject the snapshot because of a broken avatar.
        onImageErrorHandler: () => '',
      });

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.append(link);
      link.click();
      link.remove();
    } finally {
      node.classList.remove('exporting');
      restoreInputs();
    }
  } finally {
    for (const { img, src } of swaps) img.src = src;
  }
}
