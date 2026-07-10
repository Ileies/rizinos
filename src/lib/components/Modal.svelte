<script lang="ts">
	import { dialog } from '$lib/dialog.svelte';
	import * as Dialog from '$shadcn/dialog';
	import { Button } from '$shadcn/button';
	import { Input } from '$shadcn/input';

	let promptValue = $state('');

	$effect(() => {
		if (dialog.state?.kind === 'prompt') promptValue = dialog.state.value;
	});

	function close() {
		dialog.state = null;
	}

	function confirmYes() {
		if (dialog.state?.kind !== 'confirm') return;
		dialog.state.resolve(true);
		close();
	}

	function confirmNo() {
		if (dialog.state?.kind !== 'confirm') return;
		dialog.state.resolve(false);
		close();
	}

	function promptSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (dialog.state?.kind !== 'prompt') return;
		dialog.state.resolve(promptValue.trim() || null);
		close();
	}

	function promptCancel() {
		if (dialog.state?.kind !== 'prompt') return;
		dialog.state.resolve(null);
		close();
	}
</script>

<Dialog.Root open={dialog.state !== null} onOpenChange={(open) => !open && close()}>
	<Dialog.Content showCloseButton={false}>
		{#if dialog.state?.kind === 'confirm'}
			<Dialog.Header>
				<Dialog.Title>{dialog.state.message}</Dialog.Title>
			</Dialog.Header>
			<Dialog.Footer>
				<Button variant="outline" onclick={confirmNo}>Cancel</Button>
				<Button variant="destructive" onclick={confirmYes}>Confirm</Button>
			</Dialog.Footer>
		{:else if dialog.state?.kind === 'prompt'}
			<form onsubmit={promptSubmit}>
				<Dialog.Header>
					<Dialog.Title>{dialog.state.message}</Dialog.Title>
				</Dialog.Header>
				<Input autofocus bind:value={promptValue} class="mt-2" />
				<Dialog.Footer>
					<Button type="button" variant="outline" onclick={promptCancel}>Cancel</Button>
					<Button type="submit">OK</Button>
				</Dialog.Footer>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>
