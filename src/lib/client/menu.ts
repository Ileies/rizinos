import type { ContextMenuAction } from '$types/contextMenu';
import os from '$lib/os.svelte';
import { getSelectionText } from '$lib/client/index.svelte';
import { browser } from '$app/environment';

export function showContextMenu(event: MouseEvent, actions: ContextMenuAction[]) {
	event.preventDefault();
	event.stopPropagation();

	let { clientX: x, clientY: y } = event;
	const target = event.target as HTMLElement;

	const parentWindowNode = target.ownerDocument.defaultView?.frameElement?.parentNode?.parentNode;
	if (parentWindowNode) {
		y += (parentWindowNode as HTMLElement).offsetTop + 32;
		x += (parentWindowNode as HTMLElement).offsetLeft + 1;
	}
	if (x > (document.documentElement.scrollWidth / 2)) x -= 199;
	if (y > (document.documentElement.scrollHeight / 2)) y -= actions.length * 22 + 7;

	os.contextMenu = { actions, target, x, y };
}

if (browser) {
	document.addEventListener('contextmenu', (event: MouseEvent) => {
		event.preventDefault();

		const selection = window.getSelection();
		if (selection) {
			// Check if there's a selection and it contains some text
			if (selection.rangeCount > 0 && !selection.isCollapsed) {
				const rect = selection.getRangeAt(0).getBoundingClientRect(); // Get the bounding box of the selection

				// Check if the click occurred within the selection's bounding box
				if (
					event.clientX >= rect.left &&
					event.clientX <= rect.right &&
					event.clientY >= rect.top &&
					event.clientY <= rect.bottom
				) {
					console.log('Right-clicked on a selection:', selection.toString());
				}
			}
		}
	});
}

export function textMenu(): ContextMenuAction[] {
	return [
		{
			title: 'Cut',
			disabled: (x) => {
				if ('value' in x) {
					const y = x as HTMLInputElement | HTMLTextAreaElement;
					return y.selectionStart === null || y.selectionEnd === null;
				}
				return !getSelectionText();
			},
			action: (x) => {
				let t;
				if ('value' in x) {
					const y = x as HTMLInputElement | HTMLTextAreaElement;
					t = y.value.slice(y.selectionStart as number, y.selectionEnd as number);
					if (!y.disabled) y.value = y.value.slice(0, y.selectionStart as number) + y.value.slice(y.selectionEnd as number);
				} else t = getSelectionText();
				if (!t) return;
				//cb.data = { type: 'text', value: t };
			}
		},
		{
			title: 'Copy',
			disabled: (x) => {
				if ('value' in x) {
					const y = x as HTMLInputElement | HTMLTextAreaElement;
					return y.selectionStart === null || y.selectionEnd === null;
				}
				return !getSelectionText();
			},
			action: x => {
				let t;
				if ('value' in x) {
					const y = x as HTMLInputElement | HTMLTextAreaElement;
					t = y.value.slice(y.selectionStart as number, y.selectionEnd as number);
				} else t = getSelectionText();
				if (!t) return;
				//cb.data = { type: 'text', value: t };
			}
		},
		{
			title: 'Paste',
			disabled: async (x) => {
				const items = await navigator.clipboard.read();
				if (items.length === 0) return true;
				if ('value' in x) {
					const y = x as HTMLInputElement | HTMLTextAreaElement;
					return y.selectionStart === null || y.selectionEnd === null;
				}
				return true;
			},
			action: async x => {
				if ('value' in x) {
					//const y = x as HTMLInputElement | HTMLTextAreaElement;
					//y.value = y.value.slice(0, y.selectionStart as number) + (cb.type === 'text' ? cb.data : '') + x.value.slice(x.selectionEnd);
				} else {
					// TODO: Implement paste for other types
					//await navigator.clipboard.write(cb.type === 'text' ? [new ClipboardItem({ 'text/plain': cb.data })] : [new ClipboardItem({ 'text/html': cb.data })]);
				}
			}
		},
		{
			title: 'Select all',
			action: x => {
				if (x instanceof HTMLInputElement || x instanceof HTMLTextAreaElement) {
					x.select();
				} else {
					const range = document.createRange();
					range.selectNode(x as Node);
					getSelection()?.removeAllRanges();
					getSelection()?.addRange(range);
				}
			}
		}
	];
}

/*export function fsoMenu(): ContextMenuAction[] {
	return [
		{
			title: 'Compress',
			action: x => {
				const name = x.textContent;
        const ext = name.split('.').pop();
        const n = name.slice(0, -ext.length - 1);
        const o = $('+input');
        o.value = n;
        o.select();
        o.onblur = () => {
          const nn = o.value + '.' + ext;
          if (nn === name) return;
          api('compress&target=/desktop/' + encodeURIComponent(name) + '&name=' + encodeURIComponent(nn), () => loadDesk());
        };
			}
		},
		{ // only if file
			title: 'Open with ...',
			action: x => {
				const name = x.textContent;
				api('openwith&target=/desktop/' + encodeURIComponent(name), e => {
					const o = $('+div');
					o.innerHTML = e;
					o.classList.add('openwith');
					o.style.left = x.getBoundingClientRect().left + 'px';
					o.style.top = x.getBoundingClientRect().top + 'px';
				});
			}
		},
		{ // only if file
			title: 'Download',
			action: x => {
				const o = $('+a');
				o.href = '/api/?action=download&file=desktop/' + encodeURIComponent(x.textContent);
				o.click();
			}
		},
		{
			title: 'Cut',
			action: x => cbFile(x, true)
		},
		{
			title: 'Copy',
			action: cbFile
		},
		{
			title: 'Create Shortcut',
			action: x => start('i.system.link&file=/desktop/' + encodeURIComponent(x.textContent))
		},
		{
			title: 'Delete',
			action: x => api('delete&target=/desktop/' + encodeURIComponent(x.textContent), () => loadDesk())
		},
		{
			title: 'Rename',
			action: x => {
				const name = x.textContent;
				const ext = name.split('.').pop();
				const n = name.slice(0, -ext.length - 1);
				const o = $('+input');
				o.value = n;
				o.select();
				o.onblur = () => {
					const nn = o.value + '.' + ext;
					if (nn === name) return;
					api('rename&target=/desktop/' + encodeURIComponent(name) + '&name=' + encodeURIComponent(nn), () => loadDesk());
				};
			}
		},
		{
			title: 'Properties',
			action: x => {
				const name = x.textContent;
				api('properties&target=/desktop/' + encodeURIComponent(name), e => {
					const o = $('+div');
					o.innerHTML = e;
					o.classList.add('properties');
					o.style.left = x.getBoundingClientRect().left + 'px';
					o.style.top = x.getBoundingClientRect().top + 'px';
				});
			}
		}
	];
}

	taskbar: {
		'Task-Manager': x => start('i.system.taskmgr', true),
		'Taskbar settings': x => start('i.system.settings.taskbar')
	},
	dockItem: {
		'Open': x => start(x.dataset.app),
		'Pin': x => tlpin(x.dataset.app),
		'Unpin': x => tlpin('!' + x.dataset.app)
	},
	}*/