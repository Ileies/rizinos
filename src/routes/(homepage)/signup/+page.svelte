<script lang="ts">
	import type { ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { type FormData, formSchema, maxAge, minAge } from '$lib/formValidation';
	import type { FormEventHandler } from 'svelte/elements';
	import { z } from 'zod';
	import * as Button from '$shadcn/button';
	import * as Input from '$shadcn/input';

	// Current step in the multistep process
	let step = $state(1);

	let formElement: HTMLFormElement;

	const formData: FormData = $state({
		gender: 'male',
		birthdate: '',
		firstName: '',
		lastName: '',
		username: '',
		password: '',
		email: ''
	});

	const errors: Record<string, string> = $state({});

	function checkValue(value: string, key: keyof FormData) {
		try {
			formSchema.shape[key].parse(value);
		} catch (err) {
			if (err instanceof z.ZodError) console.log(err.flatten().fieldErrors);
		}
	}

	// Validate all fields whenever formData changes
	$effect(() => {
		checkValue(formData.firstName, 'firstName');
	});

	// Derived store to check if the entire form is valid
	//const isFormValid = $derived(Object.keys(errors).length === 0);

	// Update userData on input change
	const handleInput: FormEventHandler<HTMLInputElement> = () => {
		console.log();
	};

	let { form }: { form: ActionData } = $props();
</script>

{#if form?.success}
	<div>Success!</div>
{/if}

<form
	bind:this={formElement}
	class="mx-auto mt-10 w-full max-w-lg rounded-md border border-border bg-background p-6 shadow-md"
	method="POST"
	use:enhance
>
	<h2 class="mb-4 text-2xl font-bold">Step {step}</h2>

	<div class="space-y-4">
		<!-- Step 1: Basic Information -->
		<div class:hidden={step !== 1} class="space-y-4">
			<div class="flex flex-col gap-1.5">
				<label class="text-sm font-medium" for="firstName">First Name</label>
				<Input.Root
					id="firstName"
					type="text"
					bind:value={formData.firstName}
					placeholder="First name"
					name="firstName"
					maxlength={16}
					oninput={handleInput}
					autocomplete="given-name"
				/>
			</div>
			<div class="flex flex-col gap-1.5">
				<label class="text-sm font-medium" for="lastName">Last Name</label>
				<Input.Root
					id="lastName"
					type="text"
					bind:value={formData.lastName}
					placeholder="Last name"
					name="lastName"
					maxlength={16}
					oninput={handleInput}
					autocomplete="family-name"
				/>
			</div>
		</div>
		<!-- Step 2: Birthdate & Gender -->
		<div class:hidden={step !== 2} class="space-y-4">
			<div class="flex flex-col gap-1.5">
				<label class="text-sm font-medium" for="birthdate">Birthdate</label>
				<Input.Root
					id="birthdate"
					type="date"
					bind:value={formData.birthdate}
					name="birthdate"
					min={maxAge}
					max={minAge}
					oninput={handleInput}
					autocomplete="bday"
				/>
			</div>
			<div class="flex space-x-4">
				<label class="flex cursor-pointer items-center gap-2 text-sm">
					<input type="radio" name="gender" value="male" oninput={handleInput} />
					Male
				</label>
				<label class="flex cursor-pointer items-center gap-2 text-sm">
					<input type="radio" name="gender" value="female" oninput={handleInput} />
					Female
				</label>
			</div>
		</div>
		<!-- Step 3: Account Details -->
		<div class:hidden={step !== 3} class="space-y-4">
			<div class="flex flex-col gap-1.5">
				<label class="text-sm font-medium" for="email">Email</label>
				<Input.Root
					id="email"
					type="email"
					placeholder="E-mail..."
					name="email"
					maxlength={32}
					minlength={10}
					oninput={handleInput}
					autocomplete="email"
				/>
			</div>
			<div class="flex flex-col gap-1.5">
				<label class="text-sm font-medium" for="username">Username</label>
				<Input.Root
					id="username"
					type="text"
					placeholder="Username..."
					name="username"
					minlength={5}
					maxlength={20}
					oninput={handleInput}
				/>
			</div>
		</div>
		<!-- Step 4: Password -->
		<div class:hidden={step !== 4} class="space-y-4">
			<div class="flex flex-col gap-1.5">
				<label class="text-sm font-medium" for="password">Password</label>
				<Input.Root
					id="password"
					type="password"
					placeholder="Password..."
					name="password"
					minlength={8}
					maxlength={24}
					oninput={handleInput}
					autocomplete="new-password"
				/>
			</div>
			<div class="flex flex-col gap-1.5">
				<label class="text-sm font-medium" for="confirmPassword">Confirm Password</label>
				<Input.Root
					id="confirmPassword"
					type="password"
					placeholder="Confirm Password..."
					minlength={8}
					maxlength={24}
					oninput={handleInput}
				/>
			</div>
		</div>
	</div>

	<!-- Navigation Buttons -->
	<div class="mt-6 flex justify-between">
		{#if step > 1}
			<Button.Root variant="outline" type="button" onclick={() => step > 1 && step--}>Back</Button.Root>
		{/if}
		{#if step < 4}
			<Button.Root type="button" onclick={() => step < 4 && step++}>Next</Button.Root>
		{:else}
			<Button.Root type="submit" class="bg-green-600 hover:bg-green-700">Submit</Button.Root>
		{/if}
	</div>
</form>
