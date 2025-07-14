<script lang="ts">
	import type { ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { type FormData, formSchema, maxAge, minAge } from '$lib/formValidation';
	import type { FormEventHandler } from 'svelte/elements';
	import { z } from 'zod';

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
	}

	let { form }: { form: ActionData } = $props();

</script>


{#if form?.success}
	<div>Success!</div>
{/if}

<form bind:this={formElement} class="w-full max-w-lg mx-auto mt-10 p-6 shadow-md bg-base-100 rounded-md" method="POST"
			use:enhance>
	<h2 class="text-2xl font-bold mb-4">Step {step}</h2>

	<div>
		<!-- Step 1: Basic Information -->
		<div class:hidden={step !== 1}>
			<div class="form-control mb-4">
				<label class="label">First Name
				<input
					type="text"
					bind:value={formData.firstName}
					class="input input-bordered"
					placeholder="First name"
					name="firstName"
					maxlength="16"
					oninput={handleInput}
					autocomplete="given-name"
				/>
				</label>
			</div>

			<div class="form-control">
				<label class="label">Last Name
				<input
					type="text"
					bind:value={formData.lastName}
					class="input input-bordered"
					placeholder="Last name"
					name="lastName"
					maxlength="16"
					oninput={handleInput}
					autocomplete="family-name"
				/>
				</label>
			</div>
		</div>
		<!-- Step 2: Birthdate & Gender -->
		<div class:hidden={step !== 2}>
			<div class="form-control mb-4">
				<label class="label">Birthdate
				<input
					type="date"
					bind:value={formData.birthdate}
					class="input input-bordered"
					name="birthdate"
					min={maxAge}
					max={minAge}
					oninput={handleInput}
					autocomplete="bday"
				/>
				</label>
			</div>

			<div class="form-control">
				<div class="flex space-x-4">
					<label class="cursor-pointer">
						<input
							type="radio"
							name="gender"
							value="male"
							oninput={handleInput}
						/>
						<!--bind:checked={userData.gender === 'male'}-->
						<span class="ml-2">Male</span>
					</label>
					<label class="cursor-pointer">
						<input
							type="radio"
							name="gender"
							value="female"
							oninput={handleInput}
						/>
						<!--bind:checked={userData.gender === 'male'}-->
						<span class="ml-2">Female</span>
					</label>
				</div>
			</div>
		</div>
		<!-- Step 3: Account Details -->
		<div class:hidden={step !== 3}>
			<div class="form-control mb-4">
				<label class="label">Email
				<input
					type="email"
					class="input input-bordered"
					placeholder="E-mail..."
					name="email"
					maxlength="32"
					minlength="10"
					oninput={handleInput}
					autocomplete="email"
				/></label>
			</div>

			<div class="form-control">
				<label class="label">Username
				<input
					type="text"
					class="input input-bordered"
					placeholder="Username..."
					name="username"
					minlength="5"
					maxlength="20"
					oninput={handleInput}
				/></label>
			</div>
		</div>
		<!-- Step 4: Password -->
		<div class:hidden={step !== 4}>
			<div class="form-control mb-4">
				<label class="label">Password
				<input
					type="password"
					class="input input-bordered"
					placeholder="Password..."
					name="password"
					minlength="8"
					maxlength="24"
					oninput={handleInput}
					autocomplete="new-password"
				/></label>
			</div>

			<div class="form-control">
				<label class="label">Confirm Password
				<input
					type="password"
					class="input input-bordered"
					placeholder="Confirm Password..."
					minlength="8"
					maxlength="24"
					oninput={handleInput}
				/></label>
			</div>
		</div>
	</div>

	<!-- Navigation Buttons -->
	<div class="mt-6 flex justify-between">
		{#if step > 1}
			<button class="btn btn-outline" onclick={() => step > 1 && step--}>Back</button>
		{/if}
		{#if step < 4}
			<button class="btn btn-primary" onclick={() => step < 4 && step++}>Next</button>
		{:else}
			<button class="btn btn-success">
				Submit
			</button>
		{/if}
	</div>
</form>

<style>
    .form-control {
        margin-bottom: 1rem;
    }
</style>
