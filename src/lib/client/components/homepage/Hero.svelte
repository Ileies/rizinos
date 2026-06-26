<script lang="ts">
	// Function to handle the "Get Started" button click
	function handleGetStarted() {
		// Redirect to the RizinOS dashboard or installation page
		window.location.href = '/dashboard';
	}
</script>

<div class="hero bg-base-100 py-20">
	<div class="hero-content text-center">
		<div class="max-w-4xl">
			<!-- RizinOS Logo -->
			<img alt="RizinOS Logo" class="mx-auto mb-8 h-32 w-32 drop-shadow-sm" src="/images/rizinos-logo.png" />

			<!-- Headline -->
			<h1 class="text-primary mb-4 text-6xl font-bold leading-tight">
				Welcome to <span class="text-secondary">RizinOS</span>
			</h1>

			<!-- Subheadline -->
			<p class="text-base-content mb-8 text-xl leading-relaxed">
				The world's first operating system running entirely in your browser. Lightweight, fast, and
				built for the future of the web.
			</p>

			<!-- Call-to-Action Buttons -->
			<div class="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
				<button
					class="btn btn-primary btn-lg shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95"
					on:click={handleGetStarted}
				>
					Get Started
				</button>
				<button
					class="btn btn-outline btn-secondary btn-lg transition-all hover:bg-secondary hover:text-base-100 hover:scale-105 active:scale-95"
				>
					Learn More
				</button>
			</div>

			<!-- Feature Highlights -->
			<div class="mt-20 grid grid-cols-1 gap-8 md:grid-cols-3">
				<div class="card border border-base-300 bg-base-100 shadow-sm transition-all duration-300 hover:shadow-lg hover:scale-105">
					<div class="card-body">
						<h2 class="card-title text-primary text-lg font-semibold">Blazing Fast</h2>
						<p class="text-base-content text-sm leading-relaxed">
							Built with performance in mind, RizinOS delivers a seamless experience.
						</p>
					</div>
				</div>
				<div class="card border border-base-300 bg-base-100 shadow-sm transition-all duration-300 hover:shadow-lg hover:scale-105">
					<div class="card-body">
						<h2 class="card-title text-primary text-lg font-semibold">Browser-Powered</h2>
						<p class="text-base-content text-sm leading-relaxed">
							No installations needed. Run RizinOS directly in your browser.
						</p>
					</div>
				</div>
				<div class="card border border-base-300 bg-base-100 shadow-sm transition-all duration-300 hover:shadow-lg hover:scale-105">
					<div class="card-body">
						<h2 class="card-title text-primary text-lg font-semibold">Secure & Private</h2>
						<p class="text-base-content text-sm leading-relaxed">
							Your data stays safe with end-to-end encryption and privacy-first design.
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
