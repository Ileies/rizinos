<script lang="ts">
	// Function to handle the "Get Started" button click
	function handleGetStarted() {
		// Redirect to the RizinOS dashboard or installation page
		window.location.href = '/dashboard';
	}
</script>

<div class="hero from-base-100 to-base-200 bg-gradient-to-br">
	<div class="hero-content text-center">
		<div class="max-w-4xl">
			<!-- RizinOS Logo -->
			<img alt="RizinOS Logo" class="mx-auto mb-8 h-32 w-32" src="/images/rizinos-logo.png" />

			<!-- Headline -->
			<h1 class="text-primary mb-6 text-6xl font-bold">
				Welcome to <span class="text-secondary">RizinOS</span>
			</h1>

			<!-- Subheadline -->
			<p class="text-base-content mb-8 text-xl">
				The world's first operating system running entirely in your browser. Lightweight, fast, and
				built for the future of the web.
			</p>

			<!-- Call-to-Action Buttons -->
			<div class="flex justify-center gap-4">
				<button
					class="btn btn-primary btn-lg shadow-lg transition-shadow hover:shadow-xl"
					on:click={handleGetStarted}
				>
					Get Started
				</button>
				<button
					class="btn btn-outline btn-secondary btn-lg hover:bg-secondary hover:text-base-100 transition-colors"
				>
					Learn More
				</button>
			</div>

			<!-- Feature Highlights -->
			<div class="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
				<div class="card bg-base-100 shadow-md transition-shadow hover:shadow-lg">
					<div class="card-body">
						<h2 class="card-title text-primary text-lg font-semibold">🚀 Blazing Fast</h2>
						<p class="text-base-content">
							Built with performance in mind, RizinOS delivers a seamless experience.
						</p>
					</div>
				</div>
				<div class="card bg-base-100 shadow-md transition-shadow hover:shadow-lg">
					<div class="card-body">
						<h2 class="card-title text-primary text-lg font-semibold">🌐 Browser-Powered</h2>
						<p class="text-base-content">
							No installations needed. Run RizinOS directly in your browser.
						</p>
					</div>
				</div>
				<div class="card bg-base-100 shadow-md transition-shadow hover:shadow-lg">
					<div class="card-body">
						<h2 class="card-title text-primary text-lg font-semibold">🔒 Secure & Private</h2>
						<p class="text-base-content">
							Your data stays safe with end-to-end encryption and privacy-first design.
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
