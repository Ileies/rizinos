<script lang="ts">
	import os from '$lib/os.svelte';
	import { type Process } from '$types/os';
	import { Maximize, Minimize, Minus, X } from 'lucide-svelte';
	import { closeProcess, focusProcess } from '$lib/client/index.svelte';

	const { processData }: { processData: Process } = $props();

	let windowContainer: HTMLDivElement;
	let app: HTMLIFrameElement;
	let icon = '';
	let url = '';
	let isMoving = $state(false);

	const size = $derived.by(() => {
		return {
			top: processData.position.top * (os.screenSize.height - 40),
			left: processData.position.left * os.screenSize.width,
			width: processData.position.width * os.screenSize.width,
			height: processData.position.height * (os.screenSize.height - 40)
		};
	});

	// Expose a method to send messages to this window
	export function sendMessage(message: AppMessage): boolean {
		if (!app?.contentWindow) {
			console.error('Invalid iframe reference');
			return false;
		}

		try {
			app.contentWindow.postMessage(message, '*');
			return true;
		} catch (error) {
			console.error('Failed to send message to iframe:', error);
			return false;
		}
	}

	function pointerDown(e: PointerEvent) {
		if (os.isMobile) return;
		isMoving = true;
		const cursorPosition = { left: e.clientX, top: e.clientY };
		const pointerMove = (e: PointerEvent) => {
			e.preventDefault();
			const desktopBounds = {
				width: os.screenSize.width,
				height: os.screenSize.height - 40
			};

			let x = windowContainer.offsetLeft - cursorPosition.left + e.clientX;
			let y = windowContainer.offsetTop - cursorPosition.top + e.clientY;

			if (y < 0) {
				cursorPosition.top = e.clientY - y;
				y = 0;
			} else if (y > desktopBounds.height) {
				cursorPosition.top = e.clientY + desktopBounds.height - y;
				y = desktopBounds.height;
			} else cursorPosition.top = e.clientY;

			if (x < 0) {
				cursorPosition.left = e.clientX - x;
				x = 0;
			} else if (x > desktopBounds.width) {
				cursorPosition.left = e.clientX + desktopBounds.width - x;
				x = desktopBounds.width;
			} else cursorPosition.left = e.clientX;

			processData.position.top = y / desktopBounds.height;
			processData.position.left = x / desktopBounds.width;
		};
		const endMove = () => {
			document.removeEventListener('pointermove', pointerMove);
			document.removeEventListener('pointerup', endMove);
			document.removeEventListener('pointercancel', endMove);
			isMoving = false;
		};
		document.addEventListener('pointercancel', endMove, { once: true });
		document.addEventListener('pointerup', endMove, { once: true });
		document.addEventListener('pointermove', pointerMove);
	}
	function appLoadHandler() {
		// Notify the OS that the app is ready
		if (app.contentWindow) {
			app.contentWindow.postMessage({
				type: 'app:ready', // TODO: Think about actual important message types
				data: { processId: processData.id }
			}, '*');
		}
	}

	function proxyClick(event: MouseEvent) {
		(event.target as HTMLElement).style.pointerEvents = 'none';
		const target = document.elementFromPoint(event.clientX, event.clientY);
		(event.target as HTMLElement).style.pointerEvents = 'auto';
		if (target) {
			target.dispatchEvent(new PointerEvent(event.type, {
				bubbles: true,
				clientX: event.clientX,
				clientY: event.clientY
			}));
		}
	}
</script>

<div
	bind:this={windowContainer}
	class="fixed flex flex-col box-border text-base-content bg-neutral {os.isMobile ? '' : 'border shadow-lg ' + (os.focusedProcessId === processData.id ? 'border-neutral-content' : 'border-neutral')}"
	class:hidden={processData.isHidden || processData.isMinimized}
	onpointerdown={e => {e.stopPropagation();focusProcess(processData);}}
	style={(os.isMobile || processData.isMaximized) ? 'top:0;left:0;bottom:2.5rem;right:0;' : `top:${size.top}px;left:${size.left}px;width:${size.width}px;height:${size.height}px;`}
	style:z-index={processData.zIndex}
>
	<!--Navigation bar-->
	<div
		class="flex justify-between h-8 z-10 {os.focusedProcessId === processData.id ? 'bg-base-100' : 'bg-base-300'}"
		onpointerdown={pointerDown}
	>
		<img alt="Icon" class="w-5.5 h-5.5 m-1" src={icon}>
		<div onpointerdown={e => {e.stopPropagation();focusProcess(processData);}}>
			<button class="h-full aspect-[1.5] place-items-center hover:bg-black"
							onclick={() => {
								processData.isMinimized = true;
								os.focusedProcessId = null;
							}}>
				<Minus size=16 />
			</button>
			{#if !os.isMobile}
				<button class="h-full aspect-[1.5] place-items-center hover:bg-black"
								onclick={() => processData.isMaximized = !processData.isMaximized}>
					{#if processData.isMaximized}
						<Minimize size=16 />
					{:else}
						<Maximize size=16 />
					{/if}
				</button>
			{/if}
			<button class="h-full aspect-[1.5] place-items-center hover:bg-black" onclick={() => closeProcess(processData)}>
				<X size=16 />
			</button>
		</div>
	</div>

	<!--App Content Window-->
	<button aria-label="Iframe" onclick={proxyClick}>
		<iframe bind:this={app}
						class="border-none w-full flex-grow"
						onload={appLoadHandler}
						src={url}
						style:pointer-events={isMoving || os.focusedProcessId !== processData.id ? 'none': null}
						title="">
		</iframe>
	</button>
</div>
